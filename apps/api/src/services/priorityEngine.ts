import { prisma } from '../index';
import { URGENCY_WEIGHTS, SERVICE_WEIGHTS, WAITING_TIME_BONUS_PER_10_MIN } from '@turkcell/shared';

interface RequestWithUser {
  id: string;
  userId: string;
  service: string;
  requestType: string;
  urgency: string;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    city: string;
  };
}

export async function calculatePriority(request: RequestWithUser): Promise<number> {
  let score = 0;

  // 1. Urgency weight
  const urgencyWeight = URGENCY_WEIGHTS[request.urgency as keyof typeof URGENCY_WEIGHTS] || 0;
  score += urgencyWeight;

  // 2. Service weight
  const serviceWeight = SERVICE_WEIGHTS[request.service as keyof typeof SERVICE_WEIGHTS] || 0;
  score += serviceWeight;

  // 3. Waiting time bonus (points per 10 minutes)
  const waitingMs = Date.now() - new Date(request.createdAt).getTime();
  const waitingMinutes = waitingMs / 60000;
  const waitingBonus = Math.floor(waitingMinutes / 10) * WAITING_TIME_BONUS_PER_10_MIN;
  score += waitingBonus;

  // 4. Custom rules from database
  const rules = await prisma.allocationRule.findMany({
    where: { isActive: true },
  });

  for (const rule of rules) {
    if (evaluateCondition(rule.condition, request)) {
      score += rule.weight;
    }
  }

  return score;
}

function evaluateCondition(condition: string, request: RequestWithUser): boolean {
  // Simple condition evaluator
  // Supports: urgency == 'HIGH', service == 'Superonline', etc.
  try {
    // Parse condition like "urgency == 'HIGH'"
    const match = condition.match(/(\w+)\s*==\s*'([^']+)'/);
    if (match) {
      const [, field, value] = match;
      const requestValue = (request as any)[field];
      return requestValue === value;
    }

    // Parse condition like "requestType == 'CONNECTION_ISSUE'"
    const matchType = condition.match(/request_type\s*==\s*'([^']+)'/);
    if (matchType) {
      return request.requestType === matchType[1];
    }

    return false;
  } catch {
    return false;
  }
}

export async function calculateAllPriorities(): Promise<{ requestId: string; priorityScore: number }[]> {
  const pendingRequests = await prisma.request.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
  });

  const priorities = await Promise.all(
    pendingRequests.map(async (request) => ({
      requestId: request.id,
      priorityScore: await calculatePriority(request),
    }))
  );

  return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
}
