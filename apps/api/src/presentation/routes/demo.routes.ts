import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../infrastructure/config/env.js';

const router = Router();

const DEMO_USERS: Record<string, { password: string; user: any }> = {
  mazhar: {
    password: 'maz615260',
    user: {
      id: 1,
      username: 'mazhar',
      email: 'mazhar@hussainsons.com',
      full_name: 'Mazhar Hussain',
      phone: '+92-300-1111111',
      role_id: 1,
      role_name: 'SUPER_ADMIN',
      is_active: true,
    },
  },
  admin: {
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@hussainsons.com',
      full_name: 'System Administrator',
      phone: '+92-300-1111111',
      role_id: 1,
      role_name: 'SUPER_ADMIN',
      is_active: true,
    },
  },
};

router.post('/demo-login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ status: 'error', message: 'Username and password are required' });
    return;
  }

  const demoUser = DEMO_USERS[username.toLowerCase()];

  if (!demoUser || demoUser.password !== password) {
    res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign(
    {
      userId: demoUser.user.id,
      username: demoUser.user.username,
      role_id: demoUser.user.role_id,
    },
    env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );

  res.json({
    status: 'success',
    data: {
      user: demoUser.user,
      token,
    },
  });
});

router.get('/demo-check', (_req: Request, res: Response) => {
  res.json({ status: 'success', message: 'Demo mode active', demo: true });
});

export { router as demoRoutes };
