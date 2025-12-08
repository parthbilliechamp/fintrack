import express, { Express, Request, Response } from 'express';
import cors from 'cors';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
  res.json({ status: 'Backend is running!' });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: Function) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
