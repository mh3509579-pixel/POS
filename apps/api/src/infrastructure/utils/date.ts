/**
 * Date helpers for SQL query construction.
 *
 * Why these exist: mysql2 serialises a JS `Date` to `'YYYY-MM-DD HH:mm:ss.SSS'`.
 * Comparing that against a MySQL `DATE(...)` expression (which yields
 * `'YYYY-MM-DD'`) is always false, so `WHERE DATE(created_at) = ?` with a
 * `Date` parameter silently returned zero rows. Always use a half-open range
 * with these helpers instead.
 */

/** Returns the local calendar day of `date` as `YYYY-MM-DD`. */
export function toDateOnly(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The next calendar day after `date`, as `YYYY-MM-DD` (exclusive upper bound). */
export function nextDateOnly(date: Date | string): string {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`);
  }
  d.setDate(d.getDate() + 1);
  return toDateOnly(d);
}

/**
 * Parses a user-supplied query-string date. Accepts `YYYY-MM-DD` or anything
 * `new Date()` understands. Returns null when the value is absent or invalid.
 */
export function parseQueryDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}