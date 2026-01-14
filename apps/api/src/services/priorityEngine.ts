import { prisma } from '../index';

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

// Get weight from AllocationRule table
async function getWeight(category: string, key: string): Promise<number> {
  const rule = await prisma.allocationRule.findFirst({
    where: {
      category,
      key,
      isActive: true,
    },
  });
  return rule?.weight ?? 0;
}

export async function calculatePriority(request: RequestWithUser): Promise<number> {
  let score = 0;

  // 1. Urgency weight
  const urgencyWeight = await getWeight('URGENCY', request.urgency);
  score += urgencyWeight;

  // 2. Service weight
  const serviceWeight = await getWeight('SERVICE', request.service);
  score += serviceWeight;

  // 3. Request type weight
  const requestTypeWeight = await getWeight('REQUEST_TYPE', request.requestType);
  score += requestTypeWeight;

  // 4. Waiting time bonus (from DB)
  const waitingBonusRule = await getWeight('WAITING_TIME', 'BONUS_PER_SECOND');
  const waitingMs = Date.now() - new Date(request.createdAt).getTime();
  const waitingSeconds = Math.floor(waitingMs / 1000);
  const waitingBonus = waitingSeconds * waitingBonusRule;
  score += waitingBonus;

  // 5. Custom rules (category = 'CUSTOM')
  const customRules = await prisma.allocationRule.findMany({
    where: {
      category: 'CUSTOM',
      isActive: true,
    },
  });

  for (const rule of customRules) {
    if (rule.condition && evaluateCondition(rule.condition, request)) {
      score += rule.weight;
    }
  }

  return score;
}

function evaluateCondition(condition: string, request: RequestWithUser): boolean {
  try {
    // Parse condition like "city == 'Istanbul'"
    const match = condition.match(/(\w+)\s*==\s*'([^']+)'/);
    if (match) {
      const [, field, value] = match;
      if (field === 'city') {
        return request.user.city === value;
      }
      const requestValue = (request as any)[field];
      return requestValue === value;
    }
    return false;
  } catch {
    return false;
  }
}

export async function calculateAllPriorities(): Promise<
  { requestId: string; priorityScore: number }[]
> {
  const pendingRequests = await prisma.request.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
  });

  const priorities = await Promise.all(
    pendingRequests.map(async (request) => ({
      requestId: request.id,
      priorityScore: await calculatePriority(request),
    })),
  );

  return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
}
