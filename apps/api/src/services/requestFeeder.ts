import { REQUEST_TYPE_SERVICE_MAP, REQUEST_TYPES, SERVICES, URGENCIES } from '@turkcell/shared';
import { io, prisma } from '../index';

let feedInterval: NodeJS.Timeout | null = null;
let isFeeding = false;
let requestCount = 0;

// API base URL for internal calls
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Get random item from array
function getRandomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Get random user from database
async function getRandomUser() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true, name: true, city: true },
  });

  if (users.length === 0) {
    throw new Error('No users found in database');
  }

  return getRandomItem(users);
}

// Create a random request via POST /api/requests
async function createRandomRequest() {
  const user = await getRandomUser();

  // Random request type
  const requestType = getRandomItem(REQUEST_TYPES);

  // Get service from request type
  const service = REQUEST_TYPE_SERVICE_MAP[requestType] || getRandomItem(SERVICES);

  // Random urgency (weighted: more MEDIUM, less HIGH/LOW)
  const urgencyRoll = Math.random();
  let urgency: string;
  if (urgencyRoll < 0.25) {
    urgency = 'HIGH';
  } else if (urgencyRoll < 0.75) {
    urgency = 'MEDIUM';
  } else {
    urgency = 'LOW';
  }

  // Call POST /api/requests endpoint
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user.id,
      service,
      requestType,
      urgency,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create request: ${response.statusText}`);
  }

  const request = await response.json();

  requestCount++;
  console.log(
    `[${requestCount}] New request via API: ${user.name} (${user.city}) - ${service}/${requestType} - ${urgency}`,
  );

  return request;
}

// Feed next request
async function feedNextRequest() {
  if (!isFeeding) return;

  try {
    await createRandomRequest();
  } catch (error) {
    console.error('Error creating request:', error);
  }
}

// Start feeding requests (default: every 5 seconds)
export function startRequestFeeder(intervalMs: number = 5000) {
  if (isFeeding) {
    return { success: false, message: 'Request feeder already running' };
  }

  isFeeding = true;
  requestCount = 0;

  // Feed first request immediately
  feedNextRequest();

  // Then feed at regular intervals
  feedInterval = setInterval(feedNextRequest, intervalMs);

  console.log(`Request feeder started (interval: ${intervalMs}ms)`);
  return { success: true, message: 'Request feeder started', interval: intervalMs };
}

// Stop feeding requests
export function stopRequestFeeder() {
  if (!isFeeding) {
    return { success: false, message: 'Request feeder not running' };
  }

  isFeeding = false;

  if (feedInterval) {
    clearInterval(feedInterval);
    feedInterval = null;
  }

  console.log('Request feeder stopped');
  return { success: true, message: 'Request feeder stopped', totalRequests: requestCount };
}

// Get feeder status
export function getFeederStatus() {
  return {
    isFeeding,
    totalRequests: requestCount,
  };
}

// Reset the system (clear all requests/allocations)
export async function resetSystem() {
  // Stop feeder if running
  stopRequestFeeder();

  // Clear allocations and requests
  await prisma.allocation.deleteMany();
  await prisma.request.deleteMany();
  await prisma.systemLog.deleteMany();

  // Reset resources to available
  await prisma.resource.updateMany({
    data: { status: 'AVAILABLE' },
  });

  requestCount = 0;

  io.emit('dashboard:refresh');

  console.log('System reset completed');
  return { success: true, message: 'System reset completed' };
}
