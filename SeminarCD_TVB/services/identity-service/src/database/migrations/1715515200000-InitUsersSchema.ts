import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitUsersSchema1715515200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'username', type: 'varchar', length: '100', isNullable: false },
          { name: 'email', type: 'varchar', length: '255', isNullable: false },
          { name: 'password', type: 'varchar', length: '255', isNullable: false },
          { name: 'provider', type: 'varchar', length: '50', default: "'local'", isNullable: false },
          { name: 'confirmed', type: 'boolean', default: false, isNullable: false },
          { name: 'blocked', type: 'boolean', default: false, isNullable: false },
          { name: 'full_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'phone', type: 'varchar', length: '30', isNullable: true },
          { name: 'role', type: 'varchar', length: '30', default: "'authenticated'", isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_username" ON "users" (LOWER("username"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_email" ON "users" (LOWER("email"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'idx_users_email');
    await queryRunner.dropIndex('users', 'idx_users_username');
    await queryRunner.dropTable('users');
  }
}
