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
    });
  }
  return pool;
}

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T[]>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const pool = await getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export async function beginTransaction(): Promise<mysql.PoolConnection> {
  const pool = await getPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

export async function commitTransaction(connection: mysql.PoolConnection): Promise<void> {
  await connection.commit();
  connection.release();
}

export async function rollbackTransaction(connection: mysql.PoolConnection): Promise<void> {
  await connection.rollback();
  connection.release();
}
