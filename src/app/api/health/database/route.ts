import { NextResponse } from 'next/server';
import { Client } from 'pg';

import { Env } from '@/libs/Env';

/**
 * Database Health Check Endpoint
 *
 * GET /api/health/database
 *
 * Returns the status of the database connection.
 * Safe to call anytime - doesn't modify data.
 */
export async function GET() {
  const startTime = Date.now();

  // Check if DATABASE_URL is configured
  if (!Env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: 'not_configured',
        message: 'DATABASE_URL is not set. Using in-memory database (PGlite).',
        database: 'pglite',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }

  // Test connection to Neon
  const client = new Client({
    connectionString: Env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Get database info
    const result = await client.query(`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        pg_database_size(current_database()) as size_bytes
    `);

    const info = result.rows[0];
    const responseTime = Date.now() - startTime;

    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    await client.end();

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      database: 'neon',
      connection: {
        database: info.database,
        user: info.user,
        version: info.version.split(' ')[1],
        responseTime: `${responseTime}ms`,
      },
      schema: {
        tables: tables.rows.map(row => row.table_name),
        tableCount: tables.rows.length,
      },
      storage: {
        sizeBytes: Number.parseInt(info.size_bytes),
        sizeMB: (Number.parseInt(info.size_bytes) / 1024 / 1024).toFixed(2),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await client.end();

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Database connection failed',
        database: 'neon',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
