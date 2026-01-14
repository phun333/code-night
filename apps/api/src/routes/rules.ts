import { Router } from 'express';
import { z } from 'zod';
import { prisma, io } from '../index';

const router = Router();

// Validation schema
const createRuleSchema = z.object({
  condition: z.string().min(1),
  weight: z.number().int(),
  isActive: z.boolean().optional().default(true),
});

const updateRuleSchema = z.object({
  condition: z.string().min(1).optional(),
  weight: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/rules - List all rules
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const rules = await prisma.allocationRule.findMany({
      where,
      orderBy: { weight: 'desc' },
    });

    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// GET /api/rules/:id - Get single rule
router.get('/:id', async (req, res) => {
  try {
    const rule = await prisma.allocationRule.findUnique({
      where: { id: req.params.id },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// POST /api/rules - Create new rule
router.post('/', async (req, res) => {
  try {
    const data = createRuleSchema.parse(req.body);

    const rule = await prisma.allocationRule.create({
      data: {
        condition: data.condition,
        weight: data.weight,
        isActive: data.isActive,
      },
    });

    io.emit('dashboard:refresh');

    res.status(201).json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PATCH /api/rules/:id - Update rule
router.patch('/:id', async (req, res) => {
  try {
    const data = updateRuleSchema.parse(req.body);

    const rule = await prisma.allocationRule.update({
      where: { id: req.params.id },
      data,
    });

    io.emit('dashboard:refresh');

    res.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', async (req, res) => {
  try {
    await prisma.allocationRule.delete({
      where: { id: req.params.id },
    });

    io.emit('dashboard:refresh');

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

export default router;
