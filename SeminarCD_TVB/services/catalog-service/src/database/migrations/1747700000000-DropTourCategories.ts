import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the `tour_categories` table and the `tours.tour_category_id` column.
 *
 * Background: the legacy Strapi monolith carried a tour_categories table whose
 * rows the SQLite migration dumped in unchanged. The seed shipped 9 nameless
 * rows that surfaced on the public UI as useless "Category 1..9" filter chips
 * (no tour ever pointed at any of them). The category taxonomy is now
 * region-based, derived from the existing `tours.region` enum column.
 *
 * Safe: every existing row has `tour_category_id = NULL`, the FK is
 * `ON DELETE SET NULL`, and nothing in the application reads the column.
 */
export class DropTourCategories1747700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the FK so we can drop the column.
    const fkRow: { constraint_name: string }[] = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tours'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'fk_tours_tour_category'
    `);
    if (fkRow.length > 0) {
      await queryRunner.query(`ALTER TABLE "tours" DROP CONSTRAINT "fk_tours_tour_category"`);
    }

    // 2. Drop the now-orphaned column.
    await queryRunner.query(`ALTER TABLE "tours" DROP COLUMN IF EXISTS "tour_category_id"`);

    // 3. Drop the table + its indexes.
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tour_categories_slug_locale"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tour_categories_document_locale"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tour_categories"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate enough of the structure to satisfy a rollback. Existing rows
    // can't be recovered — the data is gone for good.
    await queryRunner.query(`
      CREATE TABLE "tour_categories" (
        "id" SERIAL PRIMARY KEY,
        "document_id" varchar(255) NOT NULL,
        "locale" varchar(10) NOT NULL DEFAULT 'vi',
        "slug" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "published_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_tour_categories_document_locale" ON "tour_categories" ("document_id", "locale")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tour_categories_slug_locale" ON "tour_categories" ("slug", "locale")`,
    );
    await queryRunner.query(`ALTER TABLE "tours" ADD COLUMN "tour_category_id" integer`);
    await queryRunner.query(`
      ALTER TABLE "tours"
        ADD CONSTRAINT "fk_tours_tour_category"
        FOREIGN KEY ("tour_category_id") REFERENCES "tour_categories"("id")
        ON DELETE SET NULL
    `);
  }
}
