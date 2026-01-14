import { Router } from 'express';
import { prisma, io } from '../index';
import { allocateRequest, autoAllocateAll } from '../services/allocationEngine';

const router = Router();

// GET /api/allocations - List all allocations
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        request: {
          include: { user: true },
        },
        resource: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// POST /api/allocate - Allocate a specific request
router.post('/', async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    const result = await allocateRequest(requestId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error allocating request:', error);
    res.status(500).json({ error: 'Failed to allocate request' });
  }
});

// POST /api/allocate/auto - Auto-allocate all pending requests
router.post('/auto', async (req, res) => {
  try {
    const results = await autoAllocateAll();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.json({
      message: `Auto-allocation complete: ${successful} successful, ${failed} queued/failed`,
      results,
    });
  } catch (error) {
    console.error('Error in auto-allocation:', error);
    res.status(500).json({ error: 'Failed to auto-allocate' });
  }
});

// PATCH /api/allocations/:id - Update allocation status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const allocation = await prisma.allocation.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        request: true,
        resource: true,
      },
    });

    // If allocation is completed, update request status and free resource
    if (status === 'COMPLETED') {
      await prisma.request.update({
        where: { id: allocation.requestId },
        data: { status: 'COMPLETED' },
      });

      // Check if resource can be set back to AVAILABLE
      const activeAllocations = await prisma.allocation.count({
        where: {
          resourceId: allocation.resourceId,
          status: 'ASSIGNED',
        },
      });

      const resource = await prisma.resource.findUnique({
        where: { id: allocation.resourceId },
      });

      if (resource && activeAllocations < resource.capacity) {
        await prisma.resource.update({
          where: { id: allocation.resourceId },
          data: { status: 'AVAILABLE' },
        });

        io.emit('resource:updated', { ...resource, status: 'AVAILABLE' });
      }
    }

    io.emit('dashboard:refresh');

    res.json(allocation);
  } catch (error) {
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation' });
  }
});

export default router;
