import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/resources - List all resources
router.get('/', async (req, res) => {
  try {
    const { city, status } = req.query;

    const where: any = {};
    if (city) where.city = city;
    if (status) where.status = status;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        allocations: {
          where: { status: 'ASSIGNED' },
          include: {
            request: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Add utilization info
    const resourcesWithUtilization = resources.map((resource) => ({
      ...resource,
      activeAllocations: resource.allocations.length,
      utilization: Math.round((resource.allocations.length / resource.capacity) * 100),
    }));

    res.json(resourcesWithUtilization);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

export default router;
