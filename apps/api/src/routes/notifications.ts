import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all BiP mock notification logs
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notification logs
 */
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: {
          eventType: 'NOTIFICATION_SENT',
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.systemLog.count({
        where: {
          eventType: 'NOTIFICATION_SENT',
        },
      }),
    ]);

    res.json({ notifications: logs, total });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

export default router;
