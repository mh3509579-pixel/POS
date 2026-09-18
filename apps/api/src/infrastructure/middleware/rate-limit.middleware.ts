import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function clearRateLimitStore(): void {
  Object.keys(store).forEach((key) => delete store[key]);
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function createRateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }

    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[key].count++;

    if (store[key].count > max) {
      res.status(429).json({
        status: 'error',
        message,
      });
      return;
    }

    next();
  };
}

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many API requests, please try again later.',
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many login attempts, please try again later.',
});
