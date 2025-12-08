import { Router, Request, Response } from 'express';
import { readData, appendData } from '../storage';

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

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const users = readData('users') as User[];

    // Check if user already exists
    if (users.some((u: User) => u.email === email)) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Create new user
    const newUser = appendData('users', {
      email,
      password,
      name
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const users = readData('users') as User[];
    const user = users.find((u: User) => u.email === email && u.password === password);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all users endpoint (for debugging, remove in production)
router.get('/users', (_req: Request, res: Response) => {
  try {
    const users = readData('users');
    const usersWithoutPasswords = users.map((u: any) => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
