import { Router } from 'express';
import { z } from 'zod';
import { io, prisma } from '../index';

const router = Router();

// Validation schemas
const updateRuleSchema = z.object({
  name: z.string().optional(),
  weight: z.number().int().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  condition: z.string().optional(),
});

// GET /api/rules/by-category - Get rules grouped by category
router.get('/by-category', async (req, res) => {
  try {
    const rules = await prisma.allocationRule.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, typeof rules> = {};
    for (const rule of rules) {
      if (!grouped[rule.category]) {
        grouped[rule.category] = [];
      }
      grouped[rule.category].push(rule);
    }

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching rules by category:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// POST /api/rules - Create new custom rule
router.post('/', async (req, res) => {
  try {
    const { name, condition, weight, description } = req.body;

    const rule = await prisma.allocationRule.create({
      data: {
        name,
        category: 'CUSTOM',
        key: null,
        condition,
        weight: weight || 0,
        isActive: true,
        description,
      },
    });

    io.emit('rules:updated');
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PATCH /api/rules/:id - Update rule (weight, isActive, etc.)
router.patch('/:id', async (req, res) => {
  try {
    const data = updateRuleSchema.parse(req.body);

    const rule = await prisma.allocationRule.update({
      where: { id: req.params.id },
      data,
    });

    io.emit('rules:updated');
    res.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// DELETE /api/rules/:id - Delete rule (only CUSTOM rules can be deleted)
router.delete('/:id', async (req, res) => {
  try {
    const rule = await prisma.allocationRule.findUnique({
      where: { id: req.params.id },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    if (rule.category !== 'CUSTOM') {
      return res.status(400).json({ error: 'System rules cannot be deleted' });
    }

    await prisma.allocationRule.delete({
      where: { id: req.params.id },
    });

    io.emit('rules:updated');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

export default router;
