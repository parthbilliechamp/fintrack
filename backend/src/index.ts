import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import logger, { requestLogger, errorLogger } from './logger';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger); // Add request logging middleware

// Import routes
import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import investmentRoutes from './routes/investments';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investments', investmentRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  logger.debug('Health check requested');
  res.json({ status: 'Backend is running!' });
});

// Error logging middleware (must be before error handler)
app.use(errorLogger);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: Function) => {
  logger.error('Unhandled error', { 
    message: err.message, 
    status: err.status || 500 
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server started`, { port: PORT, url: `http://localhost:${PORT}` });
});
