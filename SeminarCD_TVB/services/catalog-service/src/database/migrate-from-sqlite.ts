/**
 * One-shot migration: copy tours from the legacy Strapi SQLite
 * database into the new Catalog Service PostgreSQL.
 *
 * Usage:
 *   npm run build
 *   node dist/database/migrate-from-sqlite.js
 *
 * Or via ts-node:
 *   npx ts-node src/database/migrate-from-sqlite.ts
 *
 * Strapi 5 stores each locale variant as a separate row sharing a
 * `document_id`. We preserve that grouping verbatim — F3.4 reads tours by
 * `(document_id, locale)`, and the AI Chatbot's vector store already keys
 * chunks by language + slug, so no reshape is needed.
 *
 * Highlights, itinerary, and gallery are stored as JSONB in the destination
 * even though Strapi keeps them in separate component tables. We read them
 * back via the link tables and fold them into one row per tour.
 */
import 'reflect-metadata';
import * as path from 'path';

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { AppDataSource } from './data-source';
import { Tour, TourHighlight, GalleryImage } from '../catalog/entities/tour.entity';

export interface MigrationResult {
  tours: { read: number; inserted: number; skipped: number; failed: number };
  errors: { table: 'tours'; id: number; reason: string }[];
}

interface SqliteRow {
  [key: string]: unknown;
}

const HIGHLIGHTS_COMPONENT_PREFIX = 'components_card_tour_highlights';
const HIGHLIGHTS_LINK_TABLE = 'tours_cmps';

export async function migrateCatalogFromSqlite(sqlitePath: string): Promise<MigrationResult> {
  const absolute = path.resolve(sqlitePath);
  const sqlite = new Database(absolute, { readonly: true, fileMustExist: true });

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const result: MigrationResult = {
      tours: { read: 0, inserted: 0, skipped: 0, failed: 0 },
      errors: [],
    };

    await migrateTours(sqlite, result);

    return result;
  } finally {
    sqlite.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function migrateTours(sqlite: DatabaseType, result: MigrationResult): Promise<void> {
  if (!tableExists(sqlite, 'tours')) {
    return;
  }

  const rows = sqlite.prepare(`SELECT * FROM tours`).all() as SqliteRow[];
  result.tours.read = rows.length;

  const highlightsByTour = readHighlights(sqlite);
  const repo = AppDataSource.getRepository(Tour);

  for (const row of rows) {
    try {
      const id = Number(row.id);
      if (!Number.isFinite(id)) {
        throw new Error('missing id');
      }
      const existing = await repo.findOne({ where: { id } });
      if (existing) {
        result.tours.skipped += 1;
        continue;
      }
      await repo.insert({
        id,
        documentId: String(row.document_id ?? `legacy-tour-${id}`),
        locale: (row.locale as Tour['locale']) ?? 'vi',
        slug: String(row.slug ?? `legacy-${id}`),
        tourName: String(row.Tour_Name ?? row.tour_name ?? `Tour ${id}`),
        shortDescription: stringOrNull(row.Short_Description ?? row.short_description ?? null),
        description: parseJson(row.Description ?? row.description) as QueryDeepPartialEntity<Tour>['description'],
        region: (stringOrNull(row.Region ?? row.region) as Tour['region']) ?? null,
        location: stringOrNull(row.Location ?? row.location),
        departureLocation: stringOrNull(row.Departure_Location ?? row.departure_location),
        price: numberOrNull(row.Price ?? row.price),
        originalPrice: numberOrNull(row.Original_Price ?? row.original_price),
        childPrice: numberOrNull(row.Child_Price ?? row.child_price),
        durationDays: numberOrNull(row.Duration_Days ?? row.duration_days),
        durationNights: numberOrNull(row.Duration_Nights ?? row.duration_nights),
        maxParticipants: numberOrNull(row.Max_Participants ?? row.max_participants),
        rating: numberOrNull(row.Rating ?? row.rating),
        reviewCount: numberOrNull(row.Review_Count ?? row.review_count),
        transportType:
          (stringOrNull(row.Transport_Type ?? row.transport_type) as Tour['transportType']) ?? null,
        isFeatured: Boolean(row.Is_Featured ?? row.is_featured ?? false),
        highlights: highlightsByTour.get(id) ?? [],
        itinerary: parseJson(row.Itinerary ?? row.itinerary) as QueryDeepPartialEntity<Tour>['itinerary'],
        gallery: [] satisfies GalleryImage[], // Gallery URLs come from Strapi's `files` join; out of scope for the seminar.
        featuredImageUrl: stringOrNull(row.featured_image_url),
        publishedAt: dateOrNull(row.published_at),
        createdAt: dateOrNull(row.created_at) ?? new Date(),
        updatedAt: dateOrNull(row.updated_at) ?? new Date(),
        deletedAt: null,
      });
      result.tours.inserted += 1;
    } catch (err) {
      result.tours.failed += 1;
      result.errors.push({
        table: 'tours',
        id: Number(row.id) || -1,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await alignSequence('tours', rows);
}

function readHighlights(sqlite: DatabaseType): Map<number, TourHighlight[]> {
  const map = new Map<number, TourHighlight[]>();
  if (!tableExists(sqlite, HIGHLIGHTS_LINK_TABLE)) {
    return map;
  }
  // Strapi component link tables follow the shape:
  //   entity_id INTEGER, cmp_id INTEGER, component_type TEXT, field TEXT, order INTEGER
  // The component_type pins which component table to read from.
  let rows: SqliteRow[];
  try {
    rows = sqlite
      .prepare(
        `SELECT entity_id, cmp_id FROM ${HIGHLIGHTS_LINK_TABLE}
         WHERE component_type LIKE 'card.tour-highlight%'
         ORDER BY entity_id, "order"`,
      )
      .all() as SqliteRow[];
  } catch {
    return map;
  }
  if (rows.length === 0) {
    return map;
  }

  // Discover the matching component table — name varies across Strapi versions.
  const componentTable = listTables(sqlite).find((name) =>
    name.startsWith(HIGHLIGHTS_COMPONENT_PREFIX),
  );
  if (!componentTable) {
    return map;
  }

  for (const row of rows) {
    const tourId = Number(row.entity_id);
    const cmpId = Number(row.cmp_id);
    if (!Number.isFinite(tourId) || !Number.isFinite(cmpId)) continue;
    const cmp = sqlite
      .prepare(`SELECT * FROM ${componentTable} WHERE id = ?`)
      .get(cmpId) as SqliteRow | undefined;
    if (!cmp) continue;
    const highlight: TourHighlight = {
      title: String(cmp.Title ?? cmp.title ?? ''),
      description: stringOrUndefined(cmp.Description ?? cmp.description),
      iconUrl: stringOrUndefined(cmp.Icon_Url ?? cmp.icon_url),
    };
    if (!highlight.title) continue;
    const bucket = map.get(tourId) ?? [];
    bucket.push(highlight);
    map.set(tourId, bucket);
  }
  return map;
}

function tableExists(sqlite: DatabaseType, name: string): boolean {
  const row = sqlite
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .get(name);
  return Boolean(row);
}

function listTables(sqlite: DatabaseType): string[] {
  return (sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as SqliteRow[])
    .map((row) => String(row.name));
}

async function alignSequence(table: string, rows: SqliteRow[]): Promise<void> {
  if (rows.length === 0) return;
  const max = rows.reduce((acc, row) => Math.max(acc, Number(row.id) || 0), 0);
  if (max <= 0) return;
  await AppDataSource.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), $2, true)`,
    [table, max],
  );
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length === 0 ? null : str;
}

function stringOrUndefined(value: unknown): string | undefined {
  const out = stringOrNull(value);
  return out ?? undefined;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function dateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const date = new Date(value as string);
  return Number.isFinite(date.getTime()) ? date : null;
}

function parseJson(value: unknown): unknown | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const source = process.env.SQLITE_MIGRATION_SOURCE ?? '../../Travel_TVB_Server/.tmp/data.db';
  const result = await migrateCatalogFromSqlite(source);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) {
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
