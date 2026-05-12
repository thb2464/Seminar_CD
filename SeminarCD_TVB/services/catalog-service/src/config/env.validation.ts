import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),

  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().default('catalog'),
  DATABASE_PASSWORD: Joi.string().default('catalog'),
  DATABASE_NAME: Joi.string().default('catalog_db'),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),

  RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672/'),
  CATALOG_EVENTS_EXCHANGE: Joi.string().default('catalog.events'),

  SQLITE_MIGRATION_SOURCE: Joi.string().optional(),
});
