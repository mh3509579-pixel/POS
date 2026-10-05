import { NextFunction, Request, Response } from 'express';
import { env } from '../../infrastructure/config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

interface MysqlError extends Error {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  /** Set by body-parser (e.g. entity.parse.failed). */
  type?: string;
}

export function errorHandler(
  err: AppError & MysqlError,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // If a response has already started, express requires delegating to the
  // default handler; writing again would throw ERR_HTTP_HEADERS_SENT.
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Internal server error';

  // Malformed JSON from body-parser is a client error, not a server fault.
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  }

  // Map the database errors that are genuinely caused by the client so the UI
  // gets a meaningful message instead of a generic 500.
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      statusCode = 409;
      message = 'A record with these details already exists';
      break;
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      statusCode = 400;
      message = 'Referenced record does not exist';
      break;
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      statusCode = 409;
      message = 'This record is referenced by other records and cannot be changed';
      break;
    case 'ER_DATA_TRUNCATED':
    case 'WARN_DATA_TRUNCATED':
      statusCode = 400;
      message = 'One of the supplied values is not allowed';
      break;
    case 'ECONNREFUSED':
    case 'PROTOCOL_CONNECTION_LOST':
      statusCode = 503;
      message = 'Database is unavailable';
      break;
    default:
      break;
  }

  console.error('[API Error]', statusCode, err.message, err.stack);

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(!env.IS_PRODUCTION && { stack: err.stack }),
  });
}