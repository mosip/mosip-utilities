/**
 * Run all SQL migrations in order (001_*.sql, 002_*.sql, ...).
 * Use: npm run migrate (from backend directory).
 * Requires RDS_* env vars in .env. Run once per environment (local, staging, prod).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db/dbPool');

async function runMigrations() {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s)`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${file}`);
    try {
      await pool.query(sql);
      console.log(`✓ Successfully ran ${file}`);
    } catch (error) {
      console.error(`✗ Error running ${file}:`, error.message);
      throw error;
    }
  }

  console.log('All migrations completed successfully!');
  await pool.end();
}

runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
