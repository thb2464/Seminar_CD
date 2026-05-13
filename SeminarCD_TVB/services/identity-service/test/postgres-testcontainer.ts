import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, DataSourceOptions } from 'typeorm';

export interface PostgresTestEnvironmentOptions {
  database: string;
  username: string;
  password: string;
  entities: NonNullable<DataSourceOptions['entities']>;
}

export interface PostgresTestEnvironment {
  container: StartedPostgreSqlContainer;
  dataSource: DataSource;
  stop: () => Promise<void>;
}

export async function startPostgresTestEnvironment(
  options: PostgresTestEnvironmentOptions,
): Promise<PostgresTestEnvironment> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase(options.database)
    .withUsername(options.username)
    .withPassword(options.password)
    .start();

  const env = {
    NODE_ENV: 'test',
    DATABASE_HOST: container.getHost(),
    DATABASE_PORT: container.getPort().toString(),
    DATABASE_USER: container.getUsername(),
    DATABASE_PASSWORD: container.getPassword(),
    DATABASE_NAME: container.getDatabase(),
    DATABASE_SSL: 'false',
    DATABASE_SYNCHRONIZE: 'true',
  };
  const previousEnv = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);

  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT),
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: false,
    entities: options.entities,
    synchronize: true,
    dropSchema: true,
  };
  const dataSource = await new DataSource(dataSourceOptions).initialize();

  return {
    container,
    dataSource,
    stop: async () => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      await container.stop();
      for (const [key, value] of previousEnv.entries()) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}
