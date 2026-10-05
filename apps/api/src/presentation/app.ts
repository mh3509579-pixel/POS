import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { routes } from './routes/index.js';
import { apiRateLimit, authRateLimit } from '../infrastructure/middleware/rate-limit.middleware.js';
import { sanitizeInput } from '../infrastructure/middleware/validation.middleware.js';
import { env } from '../infrastructure/config/env.js';

const app = express();

// Behind Vercel/nginx there is exactly one trusted proxy hop. Without this,
// req.ip is the proxy for every request, which makes per-IP rate limiting
// throttle the entire pharmacy at once.
app.set('trust proxy', 1);

app.use(helmet());

/**
 * In production CORS must be restricted to a known frontend origin.
 * `cors` treats an undefined `origin` as "*", and combined with
 * `credentials: true` that lets any site read authenticated API responses.
 */
if (env.IS_PRODUCTION && !env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL must be set when NODE_ENV=production to enable CORS safely');
}

const allowedOrigins = env.IS_PRODUCTION
  ? [env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// 1mb is ample for a POS payload; 10mb only widens the DoS surface.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);
app.use('/api', apiRateLimit);

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({ message: "Hussain Son's Pharmacy POS API" });
});

app.use(errorHandler);

export default app;