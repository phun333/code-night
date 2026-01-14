import { Router } from 'express';
import { z } from 'zod';
import { io, prisma } from '../index';
import { calculatePriority } from '../services/priorityEngine';

const router = Router();

// Validation schema
const createRequestSchema = z.object({
  userId: z.string(),
  service: z.enum(['Superonline', 'Paycell', 'TV+']),
  requestType: z.string(),
  urgency: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

// GET /api/requests - List all requests
router.get('/', async (req, res) => {
  try {
    const { status, urgency, service } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    if (service) where.service = service;

    const requests = await prisma.request.findMany({
      where,
      include: {
        user: true,
        allocation: {
          include: { resource: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate priority for each request
    const requestsWithPriority = await Promise.all(
      requests.map(async (request) => ({
        ...request,
        priorityScore: await calculatePriority(request),
      })),
    );

    res.json(requestsWithPriority);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /api/requests - Create new request
router.post('/', async (req, res) => {
  try {
    const data = createRequestSchema.parse(req.body);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const request = await prisma.request.create({
      data: {
        userId: data.userId,
        service: data.service,
        requestType: data.requestType,
        urgency: data.urgency,
        status: 'PENDING',
      },
      include: { user: true },
    });

    const priorityScore = await calculatePriority(request);

    // Emit WebSocket event
    io.emit('request:new', { ...request, priorityScore });
    io.emit('dashboard:refresh');

    res.status(201).json({ ...request, priorityScore });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

export default router;
