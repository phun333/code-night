"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i]?.trim() || '';
        });
        return obj;
    });
}
async function main() {
    const seedDataPath = path.join(__dirname, '../../../seed-data');
    // Clear existing data
    await prisma.allocation.deleteMany();
    await prisma.request.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.user.deleteMany();
    await prisma.allocationRule.deleteMany();
    // Seed Users
    const usersCSV = fs.readFileSync(path.join(seedDataPath, 'users.csv'), 'utf-8');
    const users = parseCSV(usersCSV);
    for (const user of users) {
        await prisma.user.create({
            data: {
                id: user.user_id,
                name: user.name,
                city: user.city,
                role: 'USER',
            },
        });
    }
    console.log(`Seeded ${users.length} users`);
    // Seed Admin Users
    await prisma.user.create({
        data: {
            id: 'ADMIN1',
            name: 'Admin Turkcell',
            city: 'Istanbul',
            role: 'ADMIN',
        },
    });
    console.log('Seeded 1 admin user');
    // Seed Resources
    const resourcesCSV = fs.readFileSync(path.join(seedDataPath, 'resources.csv'), 'utf-8');
    const resources = parseCSV(resourcesCSV);
    for (const resource of resources) {
        await prisma.resource.create({
            data: {
                id: resource.resource_id,
                resourceType: resource.resource_type,
                capacity: parseInt(resource.capacity),
                city: resource.city,
                status: resource.status,
            },
        });
    }
    console.log(`Seeded ${resources.length} resources`);
    // Seed Requests
    const requestsCSV = fs.readFileSync(path.join(seedDataPath, 'requests.csv'), 'utf-8');
    const requests = parseCSV(requestsCSV);
    for (const request of requests) {
        await prisma.request.create({
            data: {
                id: request.request_id,
                userId: request.user_id,
                service: request.service,
                requestType: request.request_type,
                urgency: request.urgency,
                createdAt: new Date(request.created_at),
                status: 'PENDING',
            },
        });
    }
    console.log(`Seeded ${requests.length} requests`);
    // Seed Allocation Rules
    const rulesCSV = fs.readFileSync(path.join(seedDataPath, 'allocation_rules.csv'), 'utf-8');
    const rules = parseCSV(rulesCSV);
    for (const rule of rules) {
        await prisma.allocationRule.create({
            data: {
                id: rule.rule_id,
                condition: rule.condition,
                weight: parseInt(rule.weight),
                isActive: rule.is_active === 'True',
            },
        });
    }
    console.log(`Seeded ${rules.length} allocation rules`);
    // Seed Allocations
    const allocationsCSV = fs.readFileSync(path.join(seedDataPath, 'allocations.csv'), 'utf-8');
    const allocations = parseCSV(allocationsCSV);
    for (const allocation of allocations) {
        // Update request status
        await prisma.request.update({
            where: { id: allocation.request_id },
            data: { status: 'ASSIGNED' },
        });
        await prisma.allocation.create({
            data: {
                id: allocation.allocation_id,
                requestId: allocation.request_id,
                resourceId: allocation.resource_id,
                priorityScore: parseInt(allocation.priority_score),
                status: allocation.status,
                timestamp: new Date(allocation.timestamp),
            },
        });
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
