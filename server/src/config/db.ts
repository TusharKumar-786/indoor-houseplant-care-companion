import { Pool, QueryResult, QueryResultRow, types } from 'pg';
import { config } from './env';

// Return PostgreSQL DATE (OID 1082) as raw 'YYYY-MM-DD' string to avoid timezone day shifts
types.setTypeParser(1082, (val: string) => val);

const isProduction = config.nodeEnv === 'production';
const isSupabase = config.db.connectionString.includes('supabase') || config.db.connectionString.includes('pooler.supabase');

export const pool = new Pool({
  connectionString: config.db.connectionString,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  ssl: isProduction || isSupabase ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development' && duration > 100) {
    console.warn(`Slow query (${duration}ms):`, text);
  }
  return res;
};

export const getClient = () => pool.connect();
