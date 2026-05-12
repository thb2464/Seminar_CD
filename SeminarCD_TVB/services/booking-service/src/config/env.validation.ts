import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3002),
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),

  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().default('booking'),
  DATABASE_PASSWORD: Joi.string().default('booking'),
  DATABASE_NAME: Joi.string().default('booking_db'),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),

  RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672/'),
  BOOKING_EVENTS_EXCHANGE: Joi.string().default('booking.events'),

  CATALOG_SERVICE_URL: Joi.string().default('http://localhost:3001'),
});
