import type { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export function getPostgresPool(): Pool | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  // Check if native PostgreSQL configuration is provided
  const hasPgConfig = Boolean(
    process.env.DATABASE_URL ||
    (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE)
  );

  if (!hasPgConfig) {
    return null;
  }

  if (!pool) {
    try {
      const nodeRequire = eval('require');
      const { Pool: PgPool } = nodeRequire('pg');
      const config: PoolConfig = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.PGHOST || 'localhost',
            port: parseInt(process.env.PGPORT || '5432', 10),
            user: process.env.PGUSER || 'examroot',
            password: process.env.PGPASSWORD || '',
            database: process.env.PGDATABASE || 'examportal',
            ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          };

      pool = new PgPool(config);

      pool?.on('error', (err: any) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
      });
    } catch (e) {
      console.error('Failed to load pg module:', e);
      return null;
    }
  }

  return pool;
}

export async function queryPostgres<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getPostgresPool();
  if (!p) {
    throw new Error('PostgreSQL pool not configured');
  }
  const res = await p.query(text, params);
  return res.rows as T[];
}
