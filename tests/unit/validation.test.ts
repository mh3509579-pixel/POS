import { describe, it, expect, vi } from 'vitest';
import { validate, ValidationSchema } from '../../apps/api/src/infrastructure/middleware/validation.middleware';

describe('Validation Middleware', () => {
  it('should validate required fields', () => {
    const schema: ValidationSchema = {
      name: { required: true, type: 'string' },
    };

    const mockReq = { body: {} } as any;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const mockNext = vi.fn();

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([expect.stringContaining('name is required')]),
      })
    );
  });

  it('should pass valid data', () => {
    const schema: ValidationSchema = {
      name: { required: true, type: 'string' },
    };

    const mockReq = { body: { name: 'Test' } } as any;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const mockNext = vi.fn();

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate string length', () => {
    const schema: ValidationSchema = {
      username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
    };

    const mockReq = { body: { username: 'ab' } } as any;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const mockNext = vi.fn();

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
