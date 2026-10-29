import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security & Parsing
app.use(cors({ origin: '*' }));
app.use(express.json());

// Bonus B4: Rate limiting on sensitive lead creation endpoint
const leadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 lead requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests created from this IP, please try again after 15 minutes',
    },
  },
});
app.use('/api/v1/leads', leadsLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Main API Routes
app.use('/api/v1', apiRouter);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global Error Handler
app.use(globalErrorHandler);
