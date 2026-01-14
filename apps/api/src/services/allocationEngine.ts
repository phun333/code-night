import { prisma, io } from '../index';
import { calculatePriority } from './priorityEngine';
import { sendNotification } from './notificationService';

interface AllocationResult {
  success: boolean;
  allocation?: any;
  message: string;
  priorityScore: number;
}

export async function allocateRequest(requestId: string): Promise<AllocationResult> {
  // 1. Get the request with user info
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: true, allocation: true },
  });

  if (!request) {
    return { success: false, message: 'Request not found', priorityScore: 0 };
  }

  if (request.allocation) {
    return { success: false, message: 'Request already allocated', priorityScore: 0 };
  }

  // 2. Calculate priority score
  const priorityScore = await calculatePriority(request);

  // 3. Find available resource in the same city
  const availableResource = await findAvailableResource(request.user.city);

  if (!availableResource) {
    // No available resource, queue the request
    return {
      success: false,
      message: 'No available resource, request queued',
      priorityScore,
    };
  }

  // 4. Create allocation
  const allocation = await prisma.allocation.create({
    data: {
      requestId: request.id,
      resourceId: availableResource.id,
      priorityScore,
      status: 'ASSIGNED',
    },
    include: {
      request: { include: { user: true } },
      resource: true,
    },
  });

  // 5. Update request status
  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'ASSIGNED' },
  });

  // 6. Update resource if at capacity
  await updateResourceStatus(availableResource.id);

  // 7. Emit WebSocket event
  io.emit('allocation:new', allocation);
  io.emit('dashboard:refresh');

  // 8. Send mock notification
  sendNotification(
    request.userId,
    `Talebiniz öncelikli olarak işleme alındı. ${availableResource.resourceType === 'TECH_TEAM' ? 'Teknik ekip' : 'Destek personeli'} yönlendirildi.`
  );

  return {
    success: true,
    allocation,
    message: 'Request allocated successfully',
    priorityScore,
  };
}

async function findAvailableResource(city: string) {
  // First try same city
  let resource = await prisma.resource.findFirst({
    where: {
      city,
      status: 'AVAILABLE',
    },
    include: {
      allocations: {
        where: {
          status: 'ASSIGNED',
        },
      },
    },
  });

  // Check if resource has capacity
  if (resource && resource.allocations.length < resource.capacity) {
    return resource;
  }

  // If no same-city resource, try any available
  resource = await prisma.resource.findFirst({
    where: {
      status: 'AVAILABLE',
    },
    include: {
      allocations: {
        where: {
          status: 'ASSIGNED',
        },
      },
    },
  });

  if (resource && resource.allocations.length < resource.capacity) {
    return resource;
  }

  return null;
}

async function updateResourceStatus(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      allocations: {
        where: { status: 'ASSIGNED' },
      },
    },
  });

  if (resource && resource.allocations.length >= resource.capacity) {
    await prisma.resource.update({
      where: { id: resourceId },
      data: { status: 'BUSY' },
    });

    io.emit('resource:updated', { ...resource, status: 'BUSY' });
  }
}

export async function autoAllocateAll(): Promise<AllocationResult[]> {
  // Get all pending requests ordered by priority
  const pendingRequests = await prisma.request.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
  });

  // Calculate priorities and sort
  const requestsWithPriority = await Promise.all(
    pendingRequests.map(async (req) => ({
      request: req,
      priority: await calculatePriority(req),
    }))
  );

  requestsWithPriority.sort((a, b) => b.priority - a.priority);

  // Allocate in priority order
  const results: AllocationResult[] = [];
  for (const { request } of requestsWithPriority) {
    const result = await allocateRequest(request.id);
    results.push(result);
  }

  return results;
}
