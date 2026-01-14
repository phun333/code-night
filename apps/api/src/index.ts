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
  pingInterval: 10000,
  pingTimeout: 5000,
  connectTimeout: 10000,
  transports: ['websocket', 'polling'],
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

// Swagger UI - CDN kullanarak reverse proxy arkasında çalışması için
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Turkcell API Docs',
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
  ],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

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

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);

  // Socket bağlantılarını kapat
  io.close();

  // Prisma bağlantılarını kapat
  await prisma.$disconnect();

  // HTTP server'ı kapat
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // 10 saniye içinde kapanmazsa zorla kapat
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
