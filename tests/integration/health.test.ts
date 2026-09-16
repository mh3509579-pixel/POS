import { describe, it, expect } from 'vitest';
import { healthCheck } from '../../apps/api/src/presentation/controllers/health.controller.js';
import { createMockRequest, createMockResponse } from '../helpers/test-utils.js';

describe('Health Check Endpoint', () => {
  it('should return status ok', () => {
    const req = createMockRequest();
    const res = createMockResponse();

    healthCheck(req, res as never);

    expect(res.statusCode).toBe(200);
    const body = res.getJsonBody();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('hussain-pharmacy-pos-api');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
  });
});
