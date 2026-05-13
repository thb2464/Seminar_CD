const { Client } = require('pg');
const { startPostgresTestcontainer } = require('../helpers/postgres-testcontainer');

describe('PostgreSQL testcontainer', () => {
  let postgres;

  beforeAll(async () => {
    postgres = await startPostgresTestcontainer();
  }, 120000);

  afterAll(async () => {
    await postgres?.stop();
  }, 120000);

  it('provides the environment shape Strapi expects', async () => {
    const client = new Client({
      host: postgres.env.DATABASE_HOST,
      port: Number(postgres.env.DATABASE_PORT),
      database: postgres.env.DATABASE_NAME,
      user: postgres.env.DATABASE_USERNAME,
      password: postgres.env.DATABASE_PASSWORD,
    });

    await client.connect();
    const result = await client.query('SELECT current_database() AS database');
    await client.end();

    expect(result.rows).toEqual([{ database: 'content_test' }]);
  });
});
