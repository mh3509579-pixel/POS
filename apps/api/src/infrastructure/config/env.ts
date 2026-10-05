import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-change-in-production');

/**
 * A missing or weak JWT secret means anyone can forge a token for an
 * administrator (Agent.md section 8: "Never commit secrets", "All important
 * permissions MUST be checked on the backend"). Fail loudly at boot rather
 * than silently signing tokens with a publicly-known value.
 */
if (isProduction && JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be set to a random value of at least 32 characters when NODE_ENV=production. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

export const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV,
  IS_PRODUCTION: isProduction,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'hussain_pharmacy_pos',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  /** Frontend origin allowed by CORS. Required in production. */
  FRONTEND_URL: process.env.FRONTEND_URL || '',
};