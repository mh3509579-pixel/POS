/** Shared query-parameter parsing so pagination is bounded everywhere. */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Clamps `limit`/`offset` into a safe range.
 *
 * The previous `parseInt(...) || 50` pattern was wrong in two ways: a negative
 * value passed straight through (`-5 || 50` is `-5`), and an unbounded value
 * let a caller request an entire table in one response.
 */
export function parsePagination(
  limitInput: unknown,
  offsetInput: unknown,
  defaults: { limit?: number; maxLimit?: number } = {}
): { limit: number; offset: number } {
  const defaultLimit = defaults.limit ?? DEFAULT_LIMIT;
  const maxLimit = defaults.maxLimit ?? MAX_LIMIT;

  const parsedLimit = Number.parseInt(String(limitInput ?? ''), 10);
  const parsedOffset = Number.parseInt(String(offsetInput ?? ''), 10);

  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, maxLimit) : defaultLimit;
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

  return { limit, offset };
}

/** Parses a positive integer path parameter such as `:id`. */
export function parseId(input: unknown): number | null {
  const value = Number.parseInt(String(input ?? ''), 10);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Returns the authenticated user's id.
 *
 * Controllers previously used `req.user?.userId || 1`, which silently recorded
 * every sale, purchase and return as belonging to user 1 whenever the auth
 * context was missing — corrupting the audit trail. Missing auth is a 401, not a
 * default value.
 */
export function requireUserId(req: object): number {
  const userId = (req as { user?: { userId?: number } }).user?.userId;

  if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
    const error = new Error('Not authenticated') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  return userId;
}