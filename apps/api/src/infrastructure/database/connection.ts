import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

let pool: mysql.Pool | null = null;

export async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: ['DATE', 'DATETIME'],
    });
  }
  return pool;
}

/**
 * Every helper below accepts an optional `connection`.
 *
 * CRITICAL: when a transaction is started you MUST pass its connection into
 * every subsequent read/write. `pool.execute()` always checks out its own
 * pooled connection with autocommit on, so calls that omit the connection are
 * committed immediately and cannot be rolled back.
 */
function resolve(connection?: mysql.PoolConnection): mysql.Pool | mysql.PoolConnection {
  return connection ?? pool!;
}

export async function query<T>(
  sql: string,
  params?: any[],
  connection?: mysql.PoolConnection
): Promise<T> {
  const executor = connection ?? (await getPool());
  const [rows] = await executor.execute(sql, params);
  return rows as T;
}

export async function queryOne<T>(
  sql: string,
  params?: any[],
  connection?: mysql.PoolConnection
): Promise<T | null> {
  const results = await query<T[]>(sql, params, connection);
  return results.length > 0 ? results[0] : null;
}

export async function execute(
  sql: string,
  params?: any[],
  connection?: mysql.PoolConnection
): Promise<mysql.ResultSetHeader> {
  const executor = resolve(connection) as mysql.PoolConnection | mysql.Pool;
  const [result] = await executor.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export async function beginTransaction(): Promise<mysql.PoolConnection> {
  const activePool = await getPool();
  const connection = await activePool.getConnection();
  await connection.beginTransaction();
  return connection;
}

export async function commitTransaction(connection: mysql.PoolConnection): Promise<void> {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
}

export async function rollbackTransaction(connection: mysql.PoolConnection): Promise<void> {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
}

/**
 * Runs `work` inside a single transaction, guaranteeing that every statement
 * executed through the provided `tx` helpers is committed or rolled back
 * together. The connection is always released, even on failure.
 */
export async function withTransaction<T>(
  work: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  const connection = await beginTransaction();
  try {
    const result = await work({
      query: <R>(sql: string, params?: any[]) => query<R>(sql, params, connection),
      queryOne: <R>(sql: string, params?: any[]) => queryOne<R>(sql, params, connection),
      execute: (sql: string, params?: any[]) => execute(sql, params, connection),
      raw: connection,
    });
    await commitTransaction(connection);
    return result;
  } catch (error) {
    await rollbackTransaction(connection);
    throw error;
  }
}

export interface TransactionContext {
  query<R>(sql: string, params?: any[]): Promise<R>;
  queryOne<R>(sql: string, params?: any[]): Promise<R | null>;
  execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader>;
  raw: mysql.PoolConnection;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}