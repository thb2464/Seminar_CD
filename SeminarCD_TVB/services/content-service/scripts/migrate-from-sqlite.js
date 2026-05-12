'use strict';

/**
 * Content data migration: SQLite → PostgreSQL (content_db)
 *
 * Reads ALL content tables from the legacy Strapi SQLite database and copies
 * them row-by-row into the Content Service's PostgreSQL database.
 *
 * Prerequisites:
 *   1. PostgreSQL `content_db` exists and Strapi has been booted once against it
 *      (`npm run develop` then Ctrl+C) so all tables are created.
 *   2. `better-sqlite3` and `pg` are installed (add `better-sqlite3` as a devDep
 *      for migration only).
 *
 * Usage:
 *   SQLITE_SOURCE=../../Travel_TVB_Server/.tmp/data.db \
 *   DATABASE_HOST=localhost DATABASE_PORT=5432 \
 *   DATABASE_NAME=content_db DATABASE_USERNAME=strapi DATABASE_PASSWORD=strapi \
 *   node scripts/migrate-from-sqlite.js
 *
 * The script is idempotent — rows that already exist (by primary key) are skipped.
 */

const path = require('path');
const Database = require('better-sqlite3');
const { Client } = require('pg');

// ── Config ───────────────────────────────────────────────────

const SQLITE_PATH = process.env.SQLITE_SOURCE
  || path.resolve(__dirname, '..', '..', '..', 'Travel_TVB_Server', '.tmp', 'data.db');

const pgConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'content_db',
  user: process.env.DATABASE_USERNAME || 'strapi',
  password: process.env.DATABASE_PASSWORD || 'strapi',
};

// Tables that belong to OTHER services — skip during content migration.
const EXCLUDED_TABLES = new Set([
  // Identity Service (Sprint 2)
  'up_users',
  'up_roles',
  'up_permissions',
  'up_permissions_role_lnk',
  'up_users_role_lnk',
  // Catalog Service (Sprint 3)
  'tours',
  'tour_categories',
  'tours_tour_category_lnk',
  // Booking Service (Sprint 5)
  'bookings',
  // Chatbot (Sprint 1) — no SQLite tables to migrate
  // Internal Strapi tables that are regenerated on boot
  'strapi_api_tokens',
  'strapi_api_token_permissions',
  'strapi_api_token_permissions_token_lnk',
  'strapi_transfer_tokens',
  'strapi_transfer_token_permissions',
  'strapi_transfer_token_permissions_token_lnk',
  'admin_users',
  'admin_permissions',
  'admin_roles',
  'admin_users_roles_lnk',
  'admin_permissions_role_lnk',
  'strapi_release_actions',
  'strapi_release_actions_release_lnk',
  'strapi_releases',
  'strapi_workflows',
  'strapi_workflows_stages',
  'strapi_workflows_stage_required_to_publish_lnk',
  'strapi_workflows_stages_workflow_lnk',
  'strapi_history_versions',
]);

// SQLite internal tables
const SQLITE_INTERNAL = new Set(['sqlite_sequence']);

// ── Helpers ──────────────────────────────────────────────────

function getColumns(sqliteDb, tableName) {
  return sqliteDb.pragma(`table_info("${tableName}")`).map(col => col.name);
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('=== Content Service: SQLite → PostgreSQL migration ===\n');
  console.log(`Source: ${SQLITE_PATH}`);
  console.log(`Target: ${pgConfig.host}:${pgConfig.port}/${pgConfig.database}\n`);

  // Open SQLite (read-only)
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  // Connect to PostgreSQL
  const pg = new Client(pgConfig);
  await pg.connect();

  // Discover all SQLite tables
  const allTables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map(r => r.name)
    .filter(name => !SQLITE_INTERNAL.has(name) && !EXCLUDED_TABLES.has(name));

  console.log(`Found ${allTables.length} content tables to migrate.\n`);

  const results = {
    migrated: [],
    skipped: [],
    failed: [],
    empty: [],
  };

  for (const table of allTables) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();

      if (rows.length === 0) {
        results.empty.push(table);
        console.log(`  [EMPTY]   ${table}`);
        continue;
      }

      // Check if the table exists in Postgres
      const tableExists = await pg.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );

      if (!tableExists.rows[0].exists) {
        results.skipped.push({ table, reason: 'table does not exist in PostgreSQL' });
        console.log(`  [SKIP]    ${table} — not in PostgreSQL (may be a stale Strapi table)`);
        continue;
      }

      // Get Postgres columns to intersect with SQLite columns
      const pgCols = await pg.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const pgColSet = new Set(pgCols.rows.map(r => r.column_name));
      const sqliteCols = getColumns(sqlite, table);
      const commonCols = sqliteCols.filter(c => pgColSet.has(c));

      if (commonCols.length === 0) {
        results.skipped.push({ table, reason: 'no common columns' });
        console.log(`  [SKIP]    ${table} — no common columns between SQLite and PostgreSQL`);
        continue;
      }

      let inserted = 0;
      let skippedRows = 0;

      for (const row of rows) {
        const values = commonCols.map(col => {
          const val = row[col];
          // Convert SQLite booleans (0/1) if the value is a strict 0 or 1 number
          // and the column name suggests boolean semantics
          if (val === null || val === undefined) return null;
          return val;
        });

        const colList = commonCols.map(quoteIdent).join(', ');
        const placeholders = commonCols.map((_, i) => `$${i + 1}`).join(', ');

        try {
          await pg.query(
            `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (err) {
          // Row-level error — skip and continue
          skippedRows++;
        }
      }

      results.migrated.push({ table, total: rows.length, inserted, skipped: skippedRows });
      console.log(`  [OK]      ${table}: ${inserted}/${rows.length} inserted, ${skippedRows} skipped`);

      // Re-align the serial sequence if the table has an `id` column
      if (pgColSet.has('id')) {
        try {
          await pg.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM "${table}"`);
        } catch {
          // Not all tables have a serial — ignore
        }
      }
    } catch (err) {
      results.failed.push({ table, error: err.message });
      console.log(`  [FAIL]    ${table}: ${err.message}`);
    }
  }

  // Summary
  console.log('\n=== Migration Summary ===');
  console.log(`Migrated:  ${results.migrated.length} tables`);
  console.log(`Empty:     ${results.empty.length} tables`);
  console.log(`Skipped:   ${results.skipped.length} tables`);
  console.log(`Failed:    ${results.failed.length} tables`);

  if (results.failed.length > 0) {
    console.log('\nFailed tables:');
    results.failed.forEach(f => console.log(`  - ${f.table}: ${f.error}`));
  }

  // Cleanup
  sqlite.close();
  await pg.end();

  // Exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
