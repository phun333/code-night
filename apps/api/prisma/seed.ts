import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.allocation.deleteMany();
  await prisma.request.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();
  await prisma.allocationRule.deleteMany();

  // Seed Users
  const users = [
    { id: 'U1', name: 'Ayşe Yılmaz', email: 'ayse@test.com', password: '123456', city: 'Istanbul', role: 'USER' },
    { id: 'U2', name: 'Ali Demir', email: 'ali@test.com', password: '123456', city: 'Ankara', role: 'USER' },
    { id: 'U3', name: 'Deniz Kaya', email: 'deniz@test.com', password: '123456', city: 'Izmir', role: 'USER' },
    { id: 'U4', name: 'Mert Öztürk', email: 'mert@test.com', password: '123456', city: 'Bursa', role: 'USER' },
    { id: 'ADMIN1', name: 'Admin Turkcell', email: 'admin@turkcell.com', password: 'admin123', city: 'Istanbul', role: 'ADMIN' },
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log(`Seeded ${users.length} users`);

  // Seed Resources
  const resources = [
    { id: 'RES-1', resourceType: 'TECH_TEAM', capacity: 2, city: 'Istanbul', status: 'AVAILABLE' },
    { id: 'RES-2', resourceType: 'SUPPORT_AGENT', capacity: 3, city: 'Ankara', status: 'AVAILABLE' },
    { id: 'RES-3', resourceType: 'TECH_TEAM', capacity: 1, city: 'Izmir', status: 'AVAILABLE' },
  ];

  for (const resource of resources) {
    await prisma.resource.create({ data: resource });
  }
  console.log(`Seeded ${resources.length} resources`);

  // Seed Requests
  const requests = [
    { id: 'REQ-1', userId: 'U1', service: 'Superonline', requestType: 'CONNECTION_ISSUE', urgency: 'HIGH', createdAt: new Date('2026-03-12T09:30:00Z'), status: 'PENDING' },
    { id: 'REQ-2', userId: 'U2', service: 'Paycell', requestType: 'PAYMENT_PROBLEM', urgency: 'MEDIUM', createdAt: new Date('2026-03-12T10:00:00Z'), status: 'PENDING' },
    { id: 'REQ-3', userId: 'U3', service: 'TV+', requestType: 'STREAMING_ISSUE', urgency: 'LOW', createdAt: new Date('2026-03-12T10:15:00Z'), status: 'PENDING' },
    { id: 'REQ-4', userId: 'U4', service: 'Superonline', requestType: 'SPEED_COMPLAINT', urgency: 'HIGH', createdAt: new Date('2026-03-12T10:20:00Z'), status: 'PENDING' },
  ];

  for (const request of requests) {
    await prisma.request.create({ data: request });
  }
  console.log(`Seeded ${requests.length} requests`);

  // Seed Allocation Rules
  const rules = [
    { id: 'AR-1', condition: "urgency == 'HIGH'", weight: 50, isActive: true },
    { id: 'AR-2', condition: "urgency == 'MEDIUM'", weight: 30, isActive: true },
    { id: 'AR-3', condition: "urgency == 'LOW'", weight: 10, isActive: true },
    { id: 'AR-4', condition: "service == 'Superonline'", weight: 20, isActive: true },
  ];

  for (const rule of rules) {
    await prisma.allocationRule.create({ data: rule });
  }
  console.log(`Seeded ${rules.length} allocation rules`);

  // Seed Allocations
  const allocations = [
    { id: 'AL-1', requestId: 'REQ-1', resourceId: 'RES-1', priorityScore: 90, status: 'ASSIGNED', timestamp: new Date('2026-03-12T09:40:00Z') },
    { id: 'AL-2', requestId: 'REQ-4', resourceId: 'RES-1', priorityScore: 85, status: 'ASSIGNED', timestamp: new Date('2026-03-12T10:30:00Z') },
  ];

  for (const allocation of allocations) {
    await prisma.request.update({
      where: { id: allocation.requestId },
      data: { status: 'ASSIGNED' },
    });
    await prisma.allocation.create({ data: allocation });
  }
  console.log(`Seeded ${allocations.length} allocations`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
