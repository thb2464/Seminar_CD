import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitCatalogSchema1715515300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tour_categories',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'document_id', type: 'varchar', length: '255', isNullable: false },
          { name: 'locale', type: 'varchar', length: '10', default: "'vi'", isNullable: false },
          { name: 'slug', type: 'varchar', length: '255', isNullable: false },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'published_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'tour_categories',
      new TableIndex({
        name: 'idx_tour_categories_document_locale',
        columnNames: ['document_id', 'locale'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'tour_categories',
      new TableIndex({
        name: 'idx_tour_categories_slug_locale',
        columnNames: ['slug', 'locale'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tours',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'document_id', type: 'varchar', length: '255', isNullable: false },
          { name: 'locale', type: 'varchar', length: '10', default: "'vi'", isNullable: false },
          { name: 'slug', type: 'varchar', length: '255', isNullable: false },
          { name: 'tour_name', type: 'varchar', length: '500', isNullable: false },
          { name: 'short_description', type: 'text', isNullable: true },
          { name: 'description', type: 'jsonb', isNullable: true },
          { name: 'region', type: 'varchar', length: '50', isNullable: true },
          { name: 'location', type: 'varchar', length: '255', isNullable: true },
          { name: 'departure_location', type: 'varchar', length: '255', isNullable: true },
          { name: 'price', type: 'bigint', isNullable: true },
          { name: 'original_price', type: 'bigint', isNullable: true },
          { name: 'child_price', type: 'bigint', isNullable: true },
          { name: 'duration_days', type: 'integer', isNullable: true },
          { name: 'duration_nights', type: 'integer', isNullable: true },
          { name: 'max_participants', type: 'integer', isNullable: true },
          { name: 'rating', type: 'numeric', precision: 3, scale: 2, isNullable: true },
          { name: 'review_count', type: 'integer', isNullable: true },
          { name: 'transport_type', type: 'varchar', length: '50', isNullable: true },
          { name: 'is_featured', type: 'boolean', default: false, isNullable: false },
          { name: 'highlights', type: 'jsonb', default: "'[]'::jsonb", isNullable: false },
          { name: 'itinerary', type: 'jsonb', isNullable: true },
          { name: 'gallery', type: 'jsonb', default: "'[]'::jsonb", isNullable: false },
          { name: 'featured_image_url', type: 'text', isNullable: true },
          { name: 'tour_category_id', type: 'integer', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'published_at', type: 'timestamptz', isNullable: true },
          { name: 'deleted_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tours',
      new TableForeignKey({
        name: 'fk_tours_tour_category',
        columnNames: ['tour_category_id'],
        referencedTableName: 'tour_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndices('tours', [
      new TableIndex({
        name: 'idx_tours_document_locale',
        columnNames: ['document_id', 'locale'],
        isUnique: true,
      }),
      new TableIndex({ name: 'idx_tours_slug_locale', columnNames: ['slug', 'locale'] }),
      new TableIndex({ name: 'idx_tours_region', columnNames: ['region'] }),
      new TableIndex({ name: 'idx_tours_featured', columnNames: ['is_featured'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('tours', 'fk_tours_tour_category');
    await queryRunner.dropIndex('tours', 'idx_tours_featured');
    await queryRunner.dropIndex('tours', 'idx_tours_region');
    await queryRunner.dropIndex('tours', 'idx_tours_slug_locale');
    await queryRunner.dropIndex('tours', 'idx_tours_document_locale');
    await queryRunner.dropTable('tours');
    await queryRunner.dropIndex('tour_categories', 'idx_tour_categories_slug_locale');
    await queryRunner.dropIndex('tour_categories', 'idx_tour_categories_document_locale');
    await queryRunner.dropTable('tour_categories');
  }
}
