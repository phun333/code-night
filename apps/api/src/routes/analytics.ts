import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics data for dashboard
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics data including KPIs, trends, and distributions
 */
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel queries for performance
    const [
      allAllocations,
      todayAllocations,
      yesterdayAllocations,
      completedAllocations,
      resources,
      allocationsLast7Days,
    ] = await Promise.all([
      // Total allocations
      prisma.allocation.count(),

      // Today's allocations
      prisma.allocation.count({
        where: { timestamp: { gte: today } },
      }),

      // Yesterday's allocations
      prisma.allocation.count({
        where: {
          timestamp: { gte: yesterday, lt: today },
        },
      }),

      // Completed allocations with duration
      prisma.allocation.findMany({
        where: { status: 'COMPLETED', completedAt: { not: null } },
        select: { timestamp: true, completedAt: true },
      }),

      // Resources for utilization
      prisma.resource.findMany({
        include: {
          allocations: {
            where: { status: 'ASSIGNED' },
          },
        },
      }),

      // Last 7 days allocations for trend
      prisma.allocation.findMany({
        where: { timestamp: { gte: sevenDaysAgo } },
        include: { request: true, resource: true },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    // Calculate average resolution time (in seconds)
    const avgResolutionTime =
      completedAllocations.length > 0
        ? Math.round(
            completedAllocations.reduce((sum, a) => {
              if (a.completedAt) {
                return sum + (a.completedAt.getTime() - a.timestamp.getTime()) / 1000;
              }
              return sum;
            }, 0) / completedAllocations.length
          )
        : 0;

    // Calculate resource utilization
    const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
    const usedCapacity = resources.reduce((sum, r) => sum + r.allocations.length, 0);
    const resourceUtilization = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

    // Calculate completion rate
    const completedCount = allocationsLast7Days.filter((a) => a.status === 'COMPLETED').length;
    const completionRate =
      allocationsLast7Days.length > 0
        ? Math.round((completedCount / allocationsLast7Days.length) * 100)
        : 0;

    // Calculate high priority rate
    const highPriorityCount = allocationsLast7Days.filter((a) => a.request.urgency === 'HIGH').length;
    const highPriorityRate =
      allocationsLast7Days.length > 0
        ? Math.round((highPriorityCount / allocationsLast7Days.length) * 100)
        : 0;

    // Volume change percentage
    const volumeChange =
      yesterdayAllocations > 0
        ? Math.round(((todayAllocations - yesterdayAllocations) / yesterdayAllocations) * 100)
        : todayAllocations > 0
          ? 100
          : 0;

    // Daily trend (last 7 days)
    const dailyTrendMap = new Map<string, { count: number; completed: number }>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTrendMap.set(dateStr, { count: 0, completed: 0 });
    }

    allocationsLast7Days.forEach((a) => {
      const dateStr = a.timestamp.toISOString().split('T')[0];
      const entry = dailyTrendMap.get(dateStr);
      if (entry) {
        entry.count++;
        if (a.status === 'COMPLETED') {
          entry.completed++;
        }
      }
    });

    const dailyTrend = Array.from(dailyTrendMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      completed: data.completed,
    }));

    // Service distribution
    const serviceMap = new Map<string, number>();
    allocationsLast7Days.forEach((a) => {
      const service = a.request.service;
      serviceMap.set(service, (serviceMap.get(service) || 0) + 1);
    });

    const byService = Array.from(serviceMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // City distribution
    const cityMap = new Map<string, number>();
    allocationsLast7Days.forEach((a) => {
      const city = a.resource.city;
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    });

    const byCity = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);

    // Urgency distribution
    const byUrgency = {
      HIGH: allocationsLast7Days.filter((a) => a.request.urgency === 'HIGH').length,
      MEDIUM: allocationsLast7Days.filter((a) => a.request.urgency === 'MEDIUM').length,
      LOW: allocationsLast7Days.filter((a) => a.request.urgency === 'LOW').length,
    };

    // Hourly distribution (last 24 hours)
    const twentyFourHoursAgo = new Date(now);
    twentyFourHoursAgo.setHours(now.getHours() - 24);

    const hourlyAllocations = await prisma.allocation.findMany({
      where: { timestamp: { gte: twentyFourHoursAgo } },
      select: { timestamp: true },
    });

    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }

    hourlyAllocations.forEach((a) => {
      const hour = a.timestamp.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    const hourlyDistribution = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    res.json({
      dailyTrend,
      byService,
      byCity,
      byUrgency,
      hourlyDistribution,
      kpis: {
        avgResolutionTime,
        todayVolume: todayAllocations,
        volumeChange,
        resourceUtilization,
        completionRate,
        highPriorityRate,
        totalAllocations: allAllocations,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
