import { Router } from 'express';
import { prisma } from '../index';
import { getSystemStatus } from '../services/automationService';
import { getRecentLogs } from '../services/logService';
import { calculatePriority } from '../services/priorityEngine';

const router = Router();

// GET /api/dashboard/summary - Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    // Pending requests count
    const pendingRequests = await prisma.request.count({
      where: { status: 'PENDING' },
    });

    // Active allocations count
    const activeAllocations = await prisma.allocation.count({
      where: { status: 'ASSIGNED' },
    });

    // Total completed
    const completedAllocations = await prisma.allocation.count({
      where: { status: 'COMPLETED' },
    });

    // Resource utilization
    const resources = await prisma.resource.findMany({
      include: {
        allocations: {
          where: { status: 'ASSIGNED' },
        },
      },
    });

    const resourceUtilization = resources.map((resource) => ({
      resourceId: resource.id,
      resourceType: resource.resourceType,
      city: resource.city,
      capacity: resource.capacity,
      used: resource.allocations.length,
      percentage: Math.round((resource.allocations.length / resource.capacity) * 100),
      status: resource.status,
    }));

    // Recent allocations (last 20) with progress calculation
    const recentAllocationsRaw = await prisma.allocation.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: {
        request: {
          include: { user: true },
        },
        resource: true,
      },
    });

    // Add progress percentage for active allocations
    const now = new Date().getTime();
    const recentAllocations = recentAllocationsRaw.map((allocation) => {
      if (allocation.status === 'ASSIGNED' && allocation.expectedCompletionAt) {
        const startTime = new Date(allocation.timestamp).getTime();
        const endTime = new Date(allocation.expectedCompletionAt).getTime();
        const totalDuration = endTime - startTime;
        const elapsed = now - startTime;
        const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
        const remainingSeconds = Math.max(0, Math.ceil((endTime - now) / 1000));
        return {
          ...allocation,
          progress: Math.round(progress),
          remainingSeconds,
          totalDurationSeconds: Math.round(totalDuration / 1000),
        };
      }
      return { ...allocation, progress: 100, remainingSeconds: 0 };
    });

    // Priority queue (pending requests sorted by priority)
    const pendingRequestsList = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
    });

    const priorityQueue = await Promise.all(
      pendingRequestsList.map(async (request) => ({
        ...request,
        priorityScore: await calculatePriority(request),
      })),
    );

    priorityQueue.sort((a, b) => b.priorityScore - a.priorityScore);

    // Stats by urgency
    const requestsByUrgency = await prisma.request.groupBy({
      by: ['urgency'],
      _count: { id: true },
    });

    // Stats by service
    const requestsByService = await prisma.request.groupBy({
      by: ['service'],
      _count: { id: true },
    });

    // Get system status
    const automationStatus = getSystemStatus();

    // Get recent logs
    const recentLogs = await getRecentLogs(20);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompleted = await prisma.allocation.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: today },
      },
    });

    // Resources by city
    const resourcesByCity: Record<string, { total: number; used: number; available: number }> = {};
    resources.forEach((resource) => {
      if (!resourcesByCity[resource.city]) {
        resourcesByCity[resource.city] = { total: 0, used: 0, available: 0 };
      }
      resourcesByCity[resource.city].total += resource.capacity;
      resourcesByCity[resource.city].used += resource.allocations.length;
      resourcesByCity[resource.city].available += resource.capacity - resource.allocations.length;
    });

    // Queued requests count
    const queuedRequests = await prisma.request.count({
      where: {
        status: 'PENDING',
        queuedAt: { not: null },
      },
    });

    res.json({
      stats: {
        pendingRequests,
        activeAllocations,
        completedAllocations,
        totalResources: resources.length,
        todayCompleted,
        queuedRequests,
      },
      automationStatus,
      resourceUtilization,
      resourcesByCity,
      recentAllocations,
      recentLogs,
      priorityQueue,
      breakdown: {
        byUrgency: requestsByUrgency,
        byService: requestsByService,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;
