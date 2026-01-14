import { io, prisma } from '../index';

export type EventType =
  | 'REQUEST_CREATED'
  | 'REQUEST_QUEUED'
  | 'ALLOCATION_ASSIGNED'
  | 'ALLOCATION_COMPLETED'
  | 'RESOURCE_BUSY'
  | 'RESOURCE_AVAILABLE'
  | 'SCORE_CALCULATED'
  | 'AUTOMATION_STARTED'
  | 'AUTOMATION_STOPPED'
  | 'AUTOMATION_CYCLE';

export type EntityType = 'REQUEST' | 'ALLOCATION' | 'RESOURCE' | 'SYSTEM';

interface LogMetadata {
  duration?: number;
  scoreBreakdown?: Record<string, number>;
  resourceState?: Record<string, any>;
  automationCycle?: number;
}

interface LogEntry {
  eventType: EventType;
  eventData: {
    message: string;
    details?: Record<string, any>;
  };
  entityType: EntityType;
  entityId?: string;
  metadata?: LogMetadata;
}

export async function createLog(entry: LogEntry) {
  const startTime = Date.now();

  try {
    const log = await prisma.systemLog.create({
      data: {
        eventType: entry.eventType,
        eventData: entry.eventData,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: {
          ...entry.metadata,
          processingTime: Date.now() - startTime,
        },
      },
    });

    // Emit to WebSocket for real-time updates
    io.emit('log:new', {
      id: log.id,
      eventType: log.eventType,
      eventData: log.eventData,
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.timestamp,
      metadata: log.metadata,
    });

    return log;
  } catch (error) {
    console.error('Error creating log:', error);
    throw error;
  }
}

// Helper functions for common log types
export async function logRequestCreated(
  requestId: string,
  userId: string,
  service: string,
  requestType: string,
  urgency: string,
) {
  return createLog({
    eventType: 'REQUEST_CREATED',
    eventData: {
      message: `Yeni talep oluşturuldu: ${requestId}`,
      details: { userId, service, requestType, urgency },
    },
    entityType: 'REQUEST',
    entityId: requestId,
  });
}

export async function logRequestQueued(requestId: string, priorityScore: number, reason: string) {
  return createLog({
    eventType: 'REQUEST_QUEUED',
    eventData: {
      message: `Talep kuyruğa alındı: ${requestId}`,
      details: { priorityScore, reason },
    },
    entityType: 'REQUEST',
    entityId: requestId,
  });
}

export async function logAllocationAssigned(
  allocationId: string,
  requestId: string,
  resourceId: string,
  priorityScore: number,
  scoreBreakdown?: Record<string, number>,
) {
  return createLog({
    eventType: 'ALLOCATION_ASSIGNED',
    eventData: {
      message: `Atama yapıldı: ${requestId} → ${resourceId}`,
      details: { requestId, resourceId, priorityScore },
    },
    entityType: 'ALLOCATION',
    entityId: allocationId,
    metadata: { scoreBreakdown },
  });
}

export async function logAllocationCompleted(
  allocationId: string,
  requestId: string,
  resourceId: string,
  duration: number,
) {
  return createLog({
    eventType: 'ALLOCATION_COMPLETED',
    eventData: {
      message: `Atama tamamlandı: ${allocationId}`,
      details: { requestId, resourceId, durationSeconds: Math.round(duration / 1000) },
    },
    entityType: 'ALLOCATION',
    entityId: allocationId,
    metadata: { duration },
  });
}

export async function logResourceBusy(resourceId: string, city: string, resourceType: string) {
  return createLog({
    eventType: 'RESOURCE_BUSY',
    eventData: {
      message: `Kaynak dolu: ${resourceId}`,
      details: { city, resourceType },
    },
    entityType: 'RESOURCE',
    entityId: resourceId,
  });
}

export async function logResourceAvailable(resourceId: string, city: string, resourceType: string) {
  return createLog({
    eventType: 'RESOURCE_AVAILABLE',
    eventData: {
      message: `Kaynak müsait: ${resourceId}`,
      details: { city, resourceType },
    },
    entityType: 'RESOURCE',
    entityId: resourceId,
  });
}

export async function logScoreCalculated(
  requestId: string,
  totalScore: number,
  breakdown: Record<string, number>,
) {
  return createLog({
    eventType: 'SCORE_CALCULATED',
    eventData: {
      message: `Skor hesaplandı: ${requestId} = ${totalScore}`,
      details: breakdown,
    },
    entityType: 'REQUEST',
    entityId: requestId,
    metadata: { scoreBreakdown: breakdown },
  });
}

export async function logAutomationStarted() {
  return createLog({
    eventType: 'AUTOMATION_STARTED',
    eventData: {
      message: 'Otomasyon başlatıldı',
    },
    entityType: 'SYSTEM',
  });
}

export async function logAutomationStopped() {
  return createLog({
    eventType: 'AUTOMATION_STOPPED',
    eventData: {
      message: 'Otomasyon durduruldu',
    },
    entityType: 'SYSTEM',
  });
}

export async function logAutomationCycle(
  cycleNumber: number,
  processed: number,
  queued: number,
  completed: number,
) {
  return createLog({
    eventType: 'AUTOMATION_CYCLE',
    eventData: {
      message: `Otomasyon döngüsü #${cycleNumber}`,
      details: { processed, queued, completed },
    },
    entityType: 'SYSTEM',
    metadata: { automationCycle: cycleNumber },
  });
}

// Get logs with pagination and filtering
export async function getLogs(options: {
  eventType?: EventType;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (options.eventType) {
    where.eventType = options.eventType;
  }
  if (options.entityType) {
    where.entityType = options.entityType;
  }
  if (options.entityId) {
    where.entityId = options.entityId;
  }
  if (options.startDate || options.endDate) {
    where.timestamp = {};
    if (options.startDate) {
      where.timestamp.gte = options.startDate;
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return { logs, total };
}

// Get recent logs for dashboard
export async function getRecentLogs(limit: number = 20) {
  return prisma.systemLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}
