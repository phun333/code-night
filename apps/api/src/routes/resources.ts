import { Router } from 'express';
import { prisma, io } from '../index';

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

// GET /api/resources/:id - Get single resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: {
        allocations: {
          include: {
            request: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      ...resource,
      activeAllocations: resource.allocations.filter((a) => a.status === 'ASSIGNED').length,
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// PATCH /api/resources/:id - Update resource
router.patch('/:id', async (req, res) => {
  try {
    const { status, capacity } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (capacity) updateData.capacity = capacity;

    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: updateData,
    });

    io.emit('resource:updated', resource);
    io.emit('dashboard:refresh');

    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

export default router;
