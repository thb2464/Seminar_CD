import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3003),
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),

  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().default('payment'),
  DATABASE_PASSWORD: Joi.string().default('payment'),
  DATABASE_NAME: Joi.string().default('payment_db'),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),

  RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672/'),
  PAYMENT_EVENTS_EXCHANGE: Joi.string().default('payment.events'),
  BOOKING_EVENTS_EXCHANGE: Joi.string().default('booking.events'),

  VNPAY_TMN_CODE: Joi.string().optional(),
  VNPAY_HASH_SECRET: Joi.string().optional(),
  VNPAY_URL: Joi.string().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNPAY_API_URL: Joi.string().default('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'),
  VNPAY_RETURN_URL: Joi.string().default('http://localhost:8000/api/payments/vnpay-return'),
});
