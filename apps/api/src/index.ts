import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import allocationsRouter from './routes/allocations';
import dashboardRouter from './routes/dashboard';
import logsRouter from './routes/logs';
import notificationsRouter from './routes/notifications';
import requestsRouter from './routes/requests';
import resourcesRouter from './routes/resources';
import rulesRouter from './routes/rules';
import { startSystem } from './services/automationService';
import { swaggerSpec } from './swagger';

export const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://codenight.aliselvet.xyz',
      'https://api.codenight.aliselvet.xyz',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Turkcell API Docs',
  }),
);

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/requests', requestsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/allocations', allocationsRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/logs', logsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, async () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  console.log(`WebSocket server ready`);

  // Auto-start the system
  console.log('Starting allocation system...');
  await startSystem();
});
