/**
 * One-shot migration script: copy users from the legacy Strapi SQLite database
 * into the new Identity Service PostgreSQL.
 *
 * Usage:
 *   npm run build
 *   node dist/database/migrate-from-sqlite.js
 *
 * Or via ts-node:
 *   npx ts-node src/database/migrate-from-sqlite.ts
 *
 * Idempotent — re-running keeps existing rows and inserts only new ones. Preserves
 * the SQLite `id` so existing JWTs (issued before cut-over) continue to map to the
 * same user after Sprint 2 ships.
 */
import 'reflect-metadata';
import * as path from 'path';

import Database from 'better-sqlite3';

import { AppDataSource } from './data-source';
import { User } from '../users/user.entity';

interface StrapiUserRow {
  id: number;
  username: string;
  email: string;
  password: string | null;
  provider: string | null;
  confirmed: number | null;
  blocked: number | null;
  full_name?: string | null;
  fullName?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MigrationResult {
  totalRead: number;
  inserted: number;
  skipped: number;
  failed: { id: number; reason: string }[];
}

const STRAPI_USER_TABLE = 'up_users';

export async function migrateUsersFromSqlite(sqlitePath: string): Promise<MigrationResult> {
  const absolute = path.resolve(sqlitePath);
  const sqlite = new Database(absolute, { readonly: true, fileMustExist: true });

  try {
    const rows = sqlite.prepare(`SELECT * FROM ${STRAPI_USER_TABLE}`).all() as StrapiUserRow[];
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const repo = AppDataSource.getRepository(User);
    const result: MigrationResult = {
      totalRead: rows.length,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    for (const row of rows) {
      try {
        if (!row.password) {
          result.failed.push({ id: row.id, reason: 'missing password hash' });
          continue;
        }
        const existing = await repo.findOne({ where: { id: row.id } });
        if (existing) {
          result.skipped += 1;
          continue;
        }
        await repo.insert({
          id: row.id,
          username: row.username,
          email: row.email,
          password: row.password,
          provider: row.provider ?? 'local',
          confirmed: Boolean(row.confirmed),
          blocked: Boolean(row.blocked),
          fullName: row.full_name ?? row.fullName ?? null,
          phone: row.phone ?? null,
          role: (row.role as User['role']) ?? 'authenticated',
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
          updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        });
        result.inserted += 1;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        result.failed.push({ id: row.id, reason });
      }
    }

    if (rows.length > 0) {
      // Re-align the sequence so the next inserted user gets a fresh id.
      const maxId = Math.max(...rows.map((r) => r.id));
      await AppDataSource.query(
        `SELECT setval(pg_get_serial_sequence('users', 'id'), $1, true)`,
        [maxId],
      );
    }

    return result;
  } finally {
    sqlite.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function main(): Promise<void> {
  const source = process.env.SQLITE_MIGRATION_SOURCE ?? '../../Travel_TVB_Server/.tmp/data.db';
  const result = await migrateUsersFromSqlite(source);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (result.failed.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('migration failed', err);
    process.exit(2);
  });
}
