import { Router } from 'express';
import { prisma } from '../index';
import { EntityType, EventType, getLogs, getRecentLogs } from '../services/logService';

const router = Router();

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get logs with pagination and filtering
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of logs
 */
router.get('/', async (req, res) => {
  try {
    const { eventType, entityType, entityId, startDate, endDate, limit, offset } = req.query;

    const result = await getLogs({
      eventType: eventType as EventType | undefined,
      entityType: entityType as EntityType | undefined,
      entityId: entityId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

/**
 * @swagger
 * /api/logs/recent:
 *   get:
 *     summary: Get recent logs
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent logs
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const logs = await getRecentLogs(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recent logs' });
  }
});

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Log statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, byEventType, byEntityType] = await Promise.all([
      prisma.systemLog.count(),
      prisma.systemLog.count({
        where: { timestamp: { gte: today } },
      }),
      prisma.systemLog.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
      }),
      prisma.systemLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
      }),
    ]);

    res.json({
      totalLogs,
      todayLogs,
      byEventType: byEventType.map((e) => ({
        type: e.eventType,
        count: e._count.eventType,
      })),
      byEntityType: byEntityType.map((e) => ({
        type: e.entityType,
        count: e._count.entityType,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get log stats' });
  }
});

/**
 * @swagger
 * /api/logs/export:
 *   get:
 *     summary: Export allocation logs in clean format
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Exported allocation logs
 */
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';

    // Get all allocations with related data
    const allocations = await prisma.allocation.findMany({
      include: {
        request: {
          include: { user: true },
        },
        resource: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 5000,
    });

    // Transform to clean format
    const exportData = allocations.map((a, index) => ({
      allocation_id: `AL-${(index + 1).toString().padStart(3, '0')}`,
      request_id: a.requestId,
      resource_id: a.resourceId,
      priority_score: a.priorityScore,
      status: a.status,
      timestamp: a.timestamp.toISOString(),
    }));

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const headers = 'allocation_id,request_id,resource_id,priority_score,status,timestamp\n';
      const rows = exportData
        .map(
          (row) =>
            `${row.allocation_id},${row.request_id},${row.resource_id},${row.priority_score},${row.status},${row.timestamp}`,
        )
        .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=allocations_${timestamp}.csv`);
      res.send('\uFEFF' + headers + rows);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=allocations_${timestamp}.json`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

/**
 * @swagger
 * /api/logs/export/detailed:
 *   get:
 *     summary: Export detailed allocation logs for Data Science
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Detailed allocation logs with all related data
 */
router.get('/export/detailed', async (req, res) => {
  try {
    // Get all allocations with full related data
    const allocations = await prisma.allocation.findMany({
      include: {
        request: {
          include: { user: true },
        },
        resource: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 5000,
    });

    // Get rules for reference
    const rules = await prisma.allocationRule.findMany({
      where: { isActive: true },
    });

    // Transform to detailed format
    const detailedData = allocations.map((a, index) => ({
      allocation_id: `AL-${(index + 1).toString().padStart(3, '0')}`,
      request_id: a.requestId,
      resource_id: a.resourceId,
      priority_score: a.priorityScore,
      status: a.status,
      timestamp: a.timestamp.toISOString(),
      completed_at: a.completedAt?.toISOString() || null,
      expected_completion_at: a.expectedCompletionAt?.toISOString() || null,
      duration_seconds:
        a.completedAt && a.timestamp
          ? Math.round((a.completedAt.getTime() - a.timestamp.getTime()) / 1000)
          : null,
      request: {
        service: a.request.service,
        request_type: a.request.requestType,
        urgency: a.request.urgency,
        created_at: a.request.createdAt.toISOString(),
        queued_at: a.request.queuedAt?.toISOString() || null,
        processed_at: a.request.processedAt?.toISOString() || null,
        wait_time_seconds:
          a.request.processedAt && a.request.createdAt
            ? Math.round((a.request.processedAt.getTime() - a.request.createdAt.getTime()) / 1000)
            : null,
      },
      user: {
        user_id: a.request.user.id,
        name: a.request.user.name,
        city: a.request.user.city,
      },
      resource: {
        city: a.resource.city,
        capacity: a.resource.capacity,
        type: a.resource.resourceType,
      },
    }));

    // Summary statistics
    const summary = {
      total_allocations: allocations.length,
      completed: allocations.filter((a) => a.status === 'COMPLETED').length,
      assigned: allocations.filter((a) => a.status === 'ASSIGNED').length,
      avg_priority_score: Math.round(
        allocations.reduce((sum, a) => sum + a.priorityScore, 0) / allocations.length,
      ),
      avg_duration_seconds:
        Math.round(
          allocations
            .filter((a) => a.completedAt)
            .reduce(
              (sum, a) => sum + (a.completedAt!.getTime() - a.timestamp.getTime()) / 1000,
              0,
            ) / allocations.filter((a) => a.completedAt).length,
        ) || 0,
      by_status: {
        ASSIGNED: allocations.filter((a) => a.status === 'ASSIGNED').length,
        COMPLETED: allocations.filter((a) => a.status === 'COMPLETED').length,
      },
      by_urgency: {
        HIGH: allocations.filter((a) => a.request.urgency === 'HIGH').length,
        MEDIUM: allocations.filter((a) => a.request.urgency === 'MEDIUM').length,
        LOW: allocations.filter((a) => a.request.urgency === 'LOW').length,
      },
      by_service: allocations.reduce(
        (acc, a) => {
          acc[a.request.service] = (acc[a.request.service] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      by_city: allocations.reduce(
        (acc, a) => {
          acc[a.resource.city] = (acc[a.resource.city] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    const exportData = {
      meta: {
        exported_at: new Date().toISOString(),
        version: '1.0',
        total_records: detailedData.length,
      },
      summary,
      active_rules: rules.map((r) => ({
        name: r.name,
        category: r.category,
        key: r.key,
        weight: r.weight,
      })),
      allocations: detailedData,
    };

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=allocations_detailed_${timestamp}.json`,
    );
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting detailed logs:', error);
    res.status(500).json({ error: 'Failed to export detailed logs' });
  }
});

/**
 * @swagger
 * /api/logs/clear:
 *   delete:
 *     summary: Clear old logs (older than 7 days)
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Logs cleared
 */
router.delete('/clear', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.systemLog.deleteMany({
      where: {
        timestamp: { lt: sevenDaysAgo },
      },
    });

    res.json({ deleted: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;
