import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Rate limiting is controlled by an explicit opt-out rather than by NODE_ENV.
 *
 * The previous check (`NODE_ENV === 'development'`) disabled all rate limiting
 * whenever NODE_ENV was unset, and env.ts defaults NODE_ENV to 'development',
 * so any deployment that forgot to set the variable had no protection at all.
 */
function isRateLimitDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMIT === 'true';
}

export function clearRateLimitStore(): void {
  store.clear();
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
    if (isRateLimitDisabled()) {
      next();
      return;
    }

    const now = Date.now();

    // Opportunistic eviction so the in-memory store cannot grow without bound.
    if (store.size > 10000) {
      for (const [key, entry] of store) {
        if (now > entry.resetTime) store.delete(key);
      }
    }

    // Key authenticated users by id so one busy terminal cannot exhaust the
    // quota for everyone behind the same NAT/proxy IP.
    const authUser = (req as Request & { user?: { userId?: number } }).user;
    const key =
      authUser?.userId != null
        ? `u:${authUser.userId}`
        : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;

    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    entry.count++;

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      res.status(429).json({ status: 'error', message });
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
  max: 20,
  message: 'Too many login attempts, please try again later.',
});