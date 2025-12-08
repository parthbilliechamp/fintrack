import { Router, Request, Response } from 'express';
import { User } from '../database/models';
import logger from '../logger';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    logger.debug('Registration attempt', { email, name });

    // Validation
    if (!email || !password || !name) {
      logger.warn('Registration failed: missing required fields', { email });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('Registration failed: user already exists', { email });
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Create new user (password will be hashed by pre-save hook)
    const newUser = new User({
      email,
      password,
      name
    });
    await newUser.save();

    logger.info('User registered successfully', { userId: newUser._id, email });
    
    // Return user without password
    const userResponse: Record<string, any> = newUser.toJSON();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Registration failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    logger.debug('Login attempt', { email });

    // Validation
    if (!email || !password) {
      logger.warn('Login failed: missing credentials', { email });
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn('Login failed: invalid credentials', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed: invalid credentials', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    logger.info('User logged in successfully', { userId: user._id, email });
    
    // Return user without password
    const userResponse: Record<string, any> = user.toJSON();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (error) {
    logger.error('Login failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all users endpoint (for debugging, remove in production)
router.get('/users', async (_req: Request, res: Response) => {
  try {
    logger.debug('Fetching all users');
    const users = await User.find().select('-password');
    logger.info('Users fetched successfully', { count: users.length });
    res.status(200).json(users);
  } catch (error) {
    logger.error('Failed to fetch users', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
