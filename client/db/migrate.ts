import fs from 'fs';
import path from 'path';
import { pool } from './pool';

/**
 * Tiny migration runner: executes new .sql files in ./migrations in
 * alphabetical order and records which files have already run.
 *
 * Run with: npm run migrate
 *
 * IMPORTANT: there is no ledger of which migrations have already run, and the
 * existing migration is written with `CREATE TABLE IF NOT EXISTS`. So editing
 * 001_create_tables.sql to add a column does NOTHING on an existing database -
 * the table is already there, the statement is skipped, and you still get
 * "Applied 1 migration(s)." as if it worked.
 *
 * To change the schema, add a NEW file (002_your_change.sql) with an
 * `ALTER TABLE` / `CREATE TABLE` of its own. If you'd rather rewrite 001, wipe
 * the database first with `docker compose down -v` and re-run ./setup.sh.
 *
 * This is deliberately minimal. If you outgrow it, a real migration tool
 * (node-pg-migrate, Knex, Drizzle, ...) is fair game.
 */
async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Older copies of the project had no migration ledger. Detect their current
  // schema once so adding the ledger does not rerun migrations already applied.
  await pool.query(`
    INSERT INTO schema_migrations (filename)
    SELECT '001_create_tables.sql'
    WHERE to_regclass('public.restaurants') IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
  await pool.query(`
    INSERT INTO schema_migrations (filename)
    SELECT '002_add_visits.sql'
    WHERE EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'visits' AND column_name = 'restaurant_id'
    )
    ON CONFLICT DO NOTHING
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  let appliedCount = 0;
  for (const file of files) {
    const applied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );
    if (applied.rows.length > 0) {
      console.log(`Skipping migration: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    await pool.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [file]
    );
    appliedCount++;
  }

  console.log(`Applied ${appliedCount} new migration(s).`);
}

migrate()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    pool.end().finally(() => process.exit(1));
  });
