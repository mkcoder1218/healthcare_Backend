import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mental_health_db',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

export default {
  query,
  pool,
}; 