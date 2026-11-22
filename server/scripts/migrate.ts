import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from server/.env if present
dotenv.config();

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  // Find init.sql and seed-demo.sql relative to script or cwd
  const candidates = [
    path.join(__dirname, '../../db'),
    path.join(process.cwd(), '../db'),
    path.join(process.cwd(), 'db'),
  ];

  let dbDir = candidates.find((dir) => fs.existsSync(path.join(dir, 'init.sql')));
  if (!dbDir) {
    console.error('Could not locate db/init.sql in expected paths.');
    process.exit(1);
  }

  const initSqlPath = path.join(dbDir, 'init.sql');
  const seedSqlPath = path.join(dbDir, 'seed-demo.sql');

  const client = new Client({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === 'production' && !databaseUrl.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database for migration.');

    console.log(`Executing schema initialization from: ${initSqlPath}`);
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);
    console.log('Database schema and plant library initialized successfully.');

    const shouldSeed =
      process.env.SEED_DEMO === 'true' || process.argv.includes('--seed');

    if (shouldSeed) {
      if (fs.existsSync(seedSqlPath)) {
        console.log(`Seeding demo data from: ${seedSqlPath}`);
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        await client.query(seedSql);
        console.log('Demo seed data populated successfully.');
      } else {
        console.warn(`Seed file not found at ${seedSqlPath}, skipping demo seed.`);
      }
    }

    await client.end();
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error.message || error);
    try {
      await client.end();
    } catch {
      // ignore client end error on failure
    }
    process.exit(1);
  }
}

runMigration();
