import { io, prisma } from '../index';
import {
  logAllocationAssigned,
  logAllocationCompleted,
  logAutomationStarted,
  logRequestQueued,
  logResourceAvailable,
  logResourceBusy,
} from './logService';
import { sendAllocationNotification } from './notificationService';
import { calculatePriority } from './priorityEngine';
import { startRequestFeeder, stopRequestFeeder } from './requestFeeder';

// System config - fixed values
const CONFIG = {
  REQUEST_INTERVAL: 2000, // New request every 2 seconds
  ALLOCATION_INTERVAL: 1000, // Check for allocations every 1 second
  COMPLETION_INTERVAL: 500, // Check completions every 0.5 seconds
  MIN_COMPLETION_TIME: 10000, // 10 seconds minimum
  MAX_COMPLETION_TIME: 15000, // 15 seconds maximum
};

let isRunning = false;
let allocationInterval: NodeJS.Timeout | null = null;
let completionInterval: NodeJS.Timeout | null = null;

// Generate random completion time (10-15 seconds)
function getRandomCompletionTime(): number {
  return (
    Math.floor(Math.random() * (CONFIG.MAX_COMPLETION_TIME - CONFIG.MIN_COMPLETION_TIME + 1)) +
    CONFIG.MIN_COMPLETION_TIME
  );
}

// Find available resource
async function findAvailableResource(city: string) {
  // Try same city first
  let resource = await prisma.resource.findFirst({
    where: { city, status: 'AVAILABLE' },
    include: { allocations: { where: { status: 'ASSIGNED' } } },
  });

  if (resource && resource.allocations.length < resource.capacity) {
    return resource;
  }

  // Try any available
  resource = await prisma.resource.findFirst({
    where: { status: 'AVAILABLE' },
    include: { allocations: { where: { status: 'ASSIGNED' } } },
  });

  if (resource && resource.allocations.length < resource.capacity) {
    return resource;
  }

  return null;
}

// Update resource status
async function updateResourceStatus(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { allocations: { where: { status: 'ASSIGNED' } } },
  });

  if (!resource) return;

  const isFull = resource.allocations.length >= resource.capacity;
  const newStatus = isFull ? 'BUSY' : 'AVAILABLE';

  if (resource.status !== newStatus) {
    await prisma.resource.update({
      where: { id: resourceId },
      data: { status: newStatus },
    });

    // Log resource status change
    if (newStatus === 'BUSY') {
      await logResourceBusy(resourceId, resource.city, resource.resourceType);
    } else {
      await logResourceAvailable(resourceId, resource.city, resource.resourceType);
    }

    io.emit('resource:updated', { ...resource, status: newStatus });
  }
}

// Allocate a request
async function allocateRequest(requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: true, allocation: true },
  });

  if (!request || request.allocation) return null;

  const priorityScore = await calculatePriority(request);
  const resource = await findAvailableResource(request.user.city);

  if (!resource) {
    // Mark as queued
    if (!request.queuedAt) {
      await prisma.request.update({
        where: { id: requestId },
        data: { queuedAt: new Date() },
      });
      await logRequestQueued(requestId, priorityScore, 'Müsait kaynak yok');
    }
    return null;
  }

  const completionTime = getRandomCompletionTime();
  const expectedCompletionAt = new Date(Date.now() + completionTime);

  const allocation = await prisma.allocation.create({
    data: {
      requestId: request.id,
      resourceId: resource.id,
      priorityScore,
      status: 'ASSIGNED',
      expectedCompletionAt,
    },
    include: {
      request: { include: { user: true } },
      resource: true,
    },
  });

  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'ASSIGNED', processedAt: new Date() },
  });

  await updateResourceStatus(resource.id);

  // Log allocation
  await logAllocationAssigned(allocation.id, request.id, resource.id, priorityScore);

  // Send mock BiP notification
  await sendAllocationNotification(
    request.userId,
    request.user.name,
    request.service,
    request.requestType,
  );

  io.emit('allocation:new', allocation);

  return allocation;
}

// Allocation cycle
async function runAllocationCycle() {
  if (!isRunning) return;

  try {
    const pendingRequests = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
    });

    if (pendingRequests.length === 0) return;

    // Calculate priorities and sort
    const sorted = await Promise.all(
      pendingRequests.map(async (req) => ({
        request: req,
        priority: await calculatePriority(req),
      })),
    );

    sorted.sort((a, b) => b.priority - a.priority);

    // Allocate highest priority first
    for (const { request } of sorted) {
      await allocateRequest(request.id);
    }

    io.emit('dashboard:refresh');
  } catch (error) {
    console.error('Allocation cycle error:', error);
  }
}

// Completion cycle
async function runCompletionCycle() {
  if (!isRunning) return;

  try {
    const now = new Date();
    const expired = await prisma.allocation.findMany({
      where: {
        status: 'ASSIGNED',
        expectedCompletionAt: { lte: now },
      },
      include: {
        request: { include: { user: true } },
        resource: true,
      },
    });

    for (const allocation of expired) {
      await prisma.allocation.update({
        where: { id: allocation.id },
        data: { status: 'COMPLETED', completedAt: now },
      });

      await prisma.request.update({
        where: { id: allocation.requestId },
        data: { status: 'COMPLETED' },
      });

      await updateResourceStatus(allocation.resourceId);

      // Log completion
      const duration = now.getTime() - new Date(allocation.timestamp).getTime();
      await logAllocationCompleted(
        allocation.id,
        allocation.requestId,
        allocation.resourceId,
        duration,
      );

      io.emit('allocation:completed', allocation);
    }

    // Try allocating queued requests
    if (expired.length > 0) {
      const queued = await prisma.request.findMany({
        where: { status: 'PENDING', queuedAt: { not: null } },
        include: { user: true },
        orderBy: { queuedAt: 'asc' },
      });

      for (const request of queued) {
        const result = await allocateRequest(request.id);
        if (!result) break;
      }

      io.emit('dashboard:refresh');
    }
  } catch (error) {
    console.error('Completion cycle error:', error);
  }
}

// Start the system (called once at API startup)
export async function startSystem() {
  if (isRunning) return;

  // Clear old data
  await prisma.allocation.deleteMany();
  await prisma.request.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.resource.updateMany({ data: { status: 'AVAILABLE' } });

  isRunning = true;

  // Start request feeder (every 2 seconds)
  startRequestFeeder(CONFIG.REQUEST_INTERVAL);

  // Start allocation cycle (every 1 second)
  allocationInterval = setInterval(runAllocationCycle, CONFIG.ALLOCATION_INTERVAL);

  // Start completion cycle (every 0.5 seconds)
  completionInterval = setInterval(runCompletionCycle, CONFIG.COMPLETION_INTERVAL);

  console.log('System started - requests every 2s, processing 5-15s');

  // Log system start
  await logAutomationStarted();

  io.emit('system:started');
}

// Stop system (for cleanup)
export function stopSystem() {
  isRunning = false;
  stopRequestFeeder();

  if (allocationInterval) {
    clearInterval(allocationInterval);
    allocationInterval = null;
  }
  if (completionInterval) {
    clearInterval(completionInterval);
    completionInterval = null;
  }

  console.log('System stopped');
}

// Get system status
export function getSystemStatus() {
  return { isRunning, config: CONFIG };
}
