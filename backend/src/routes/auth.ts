import { Router, Request, Response } from 'express';
import { readData, appendData } from '../storage';
import logger from '../logger';

const router = Router();

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}

// Register endpoint
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    logger.debug('Registration attempt', { email, name });

    // Validation
    if (!email || !password || !name) {
      logger.warn('Registration failed: missing required fields', { email });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const users = readData('users') as User[];

    // Check if user already exists
    if (users.some((u: User) => u.email === email)) {
      logger.warn('Registration failed: user already exists', { email });
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Create new user
    const newUser = appendData('users', {
      email,
      password,
      name
    });

    logger.info('User registered successfully', { userId: newUser.id, email });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error('Registration failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    logger.debug('Login attempt', { email });

    // Validation
    if (!email || !password) {
      logger.warn('Login failed: missing credentials', { email });
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const users = readData('users') as User[];
    const user = users.find((u: User) => u.email === email && u.password === password);

    if (!user) {
      logger.warn('Login failed: invalid credentials', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    logger.info('User logged in successfully', { userId: user.id, email });
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Login failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all users endpoint (for debugging, remove in production)
router.get('/users', (_req: Request, res: Response) => {
  try {
    logger.debug('Fetching all users');
    const users = readData('users');
    const usersWithoutPasswords = users.map((u: any) => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    logger.info('Users fetched successfully', { count: usersWithoutPasswords.length });
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    logger.error('Failed to fetch users', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
