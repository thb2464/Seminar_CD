const { PostgreSqlContainer } = require('@testcontainers/postgresql');

async function startPostgresTestcontainer() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('content_test')
    .withUsername('strapi')
    .withPassword('strapi')
    .start();

  const env = {
    NODE_ENV: 'test',
    DATABASE_CLIENT: 'postgres',
    DATABASE_HOST: container.getHost(),
    DATABASE_PORT: container.getPort().toString(),
    DATABASE_NAME: container.getDatabase(),
    DATABASE_USERNAME: container.getUsername(),
    DATABASE_PASSWORD: container.getPassword(),
    DATABASE_SSL: 'false',
  };
  const previousEnv = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);

  return {
    container,
    env,
    stop: async () => {
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

module.exports = { startPostgresTestcontainer };
