import { Router } from 'express';
import { prisma } from '../index';

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

export default router;
