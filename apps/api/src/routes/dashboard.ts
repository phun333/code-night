import { Router } from 'express';
import { prisma } from '../index';
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

    // Recent allocations (last 10)
    const recentAllocations = await prisma.allocation.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        request: {
          include: { user: true },
        },
        resource: true,
      },
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
      }))
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

    res.json({
      stats: {
        pendingRequests,
        activeAllocations,
        completedAllocations,
        totalResources: resources.length,
      },
      resourceUtilization,
      recentAllocations,
      priorityQueue: priorityQueue.slice(0, 10), // Top 10
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
