import { Request, Response } from 'express';

export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hussain-pharmacy-pos-api',
    version: '0.1.0',
  });
}
