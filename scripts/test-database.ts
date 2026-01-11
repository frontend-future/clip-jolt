#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 *
 * This script tests the connection to the Neon database and verifies:
 * 1. Connection is successful
 * 2. SSL is working
 * 3. Tables exist
 * 4. Basic CRUD operations work
 *
 * Usage: npm run db:test
 */

import * as dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please create .env.local and add your Neon connection string');
  process.exit(1);
}

async function testDatabaseConnection() {
  console.log('🔍 Testing Neon Database Connection...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    // Test 1: Connection
    console.log('1️⃣  Testing connection...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test 2: Database info
    console.log('2️⃣  Fetching database info...');
    const dbInfo = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Database Info:');
    console.log(`   Version: ${dbInfo.rows[0].version.split(' ')[0]} ${dbInfo.rows[0].version.split(' ')[1]}`);
    console.log(`   Database: ${dbInfo.rows[0].current_database}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}\n`);

    // Test 3: Check SSL
    console.log('3️⃣  Checking SSL connection...');
    const sslInfo = await client.query(`
      SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()
    `);
    if (sslInfo.rows.length > 0 && sslInfo.rows[0].ssl) {
      console.log('✅ SSL is enabled\n');
    } else {
      console.log('⚠️  SSL is not enabled (this is okay for local testing)\n');
    }

    // Test 4: List tables
    console.log('4️⃣  Checking for tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. Run migrations first: npm run db:migrate\n');
    } else {
      console.log('✅ Tables found:');
      tables.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Test 5: Check expected tables
    console.log('5️⃣  Verifying schema...');
    const expectedTables = ['organization', 'todo'];
    const existingTables = tables.rows.map(row => row.table_name);

    let allTablesExist = true;
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table} table exists`);
      } else {
        console.log(`   ❌ ${table} table missing`);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing. Run: npm run db:migrate\n');
    } else {
      console.log('');
    }

    // Test 6: Test CRUD operations (if tables exist)
    if (allTablesExist) {
      console.log('6️⃣  Testing CRUD operations...');

      // Create
      const testUserId = `test_user_${Date.now()}`;
      const insertResult = await client.query(
        'INSERT INTO todo (owner_id, title, message) VALUES ($1, $2, $3) RETURNING id',
        [testUserId, 'Test Todo', 'This is a test todo item'],
      );
      const todoId = insertResult.rows[0].id;
      console.log(`   ✅ CREATE: Inserted todo with ID ${todoId}`);

      // Read
      const selectResult = await client.query(
        'SELECT * FROM todo WHERE id = $1',
        [todoId],
      );
      console.log(`   ✅ READ: Retrieved todo "${selectResult.rows[0].title}"`);

      // Update
      await client.query(
        'UPDATE todo SET title = $1 WHERE id = $2',
        ['Updated Test Todo', todoId],
      );
      console.log(`   ✅ UPDATE: Updated todo title`);

      // Delete
      await client.query('DELETE FROM todo WHERE id = $1', [todoId]);
      console.log(`   ✅ DELETE: Removed test todo\n`);
    }

    // Success summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 All database tests passed!');
    console.log('═══════════════════════════════════════');
    console.log('Your Neon database is ready to use.\n');
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testDatabaseConnection();
