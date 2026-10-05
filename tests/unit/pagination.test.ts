import { describe, it, expect } from 'vitest';
import {
  parsePagination,
  parseId,
  requireUserId,
} from '../../apps/api/src/infrastructure/utils/pagination';

describe('parsePagination', () => {
  it('falls back to defaults when nothing is supplied', () => {
    expect(parsePagination(undefined, undefined)).toEqual({ limit: 50, offset: 0 });
  });

  // The original `parseInt(x) || 50` let a negative limit straight through,
  // producing `LIMIT -5` and a database error.
  it('replaces a negative limit with the default', () => {
    expect(parsePagination('-5', '0').limit).toBe(50);
  });

  it('replaces a negative offset with zero', () => {
    expect(parsePagination('10', '-20').offset).toBe(0);
  });

  // Without a ceiling, `?limit=999999` returned the entire table.
  it('caps the limit at the maximum', () => {
    expect(parsePagination('999999', '0').limit).toBe(200);
  });

  it('replaces non-numeric input with the default', () => {
    expect(parsePagination('abc', 'xyz')).toEqual({ limit: 50, offset: 0 });
  });

  it('honours a custom default and honours a limit under the cap', () => {
    expect(parsePagination(undefined, undefined, { limit: 10 })).toEqual({ limit: 10, offset: 0 });
    expect(parsePagination('25', '30')).toEqual({ limit: 25, offset: 30 });
  });

  it('accepts numeric strings (query params are always strings)', () => {
    expect(parsePagination('20', '40')).toEqual({ limit: 20, offset: 40 });
  });
});

describe('parseId', () => {
  it('parses a valid id', () => {
    expect(parseId('42')).toBe(42);
  });

  it('rejects zero, negatives, NaN and non-numeric ids', () => {
    expect(parseId('0')).toBeNull();
    expect(parseId('-3')).toBeNull();
    expect(parseId('abc')).toBeNull();
    expect(parseId(undefined)).toBeNull();
  });
});

describe('requireUserId', () => {
  it('returns the authenticated user id', () => {
    expect(requireUserId({ user: { userId: 7 } })).toBe(7);
  });

  // Previously these call sites used `req.user?.userId || 1`, which silently
  // booked every sale and purchase against user 1.
  it('throws a 401 instead of defaulting to user 1 when unauthenticated', () => {
    expect(() => requireUserId({})).toThrow('Not authenticated');

    try {
      requireUserId({ user: { userId: 0 } });
      throw new Error('expected a throw');
    } catch (error: any) {
      expect(error.statusCode).toBe(401);
    }
  });
});