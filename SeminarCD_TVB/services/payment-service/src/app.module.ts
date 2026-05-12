import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { VnpayTransactionModule } from './vnpay-transaction/vnpay-transaction.module';
import { RefundRequestModule } from './refund-request/refund-request.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          formatters: {
            level: (label) => ({ level: label }),
            bindings: () => ({ service_name: 'payment-service' }),
          },
          customLogLevel: (_req, res, err) => {
            if (err || res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
          transport:
            config.get<string>('NODE_ENV') === 'development'
              ? { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } }
              : undefined,
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        ssl:
          config.get<boolean>('DATABASE_SSL') === true ? { rejectUnauthorized: false } : false,
        entities: [],
        synchronize: config.get<boolean>('DATABASE_SYNCHRONIZE') === true,
        autoLoadEntities: true,
      }),
    }),
    PaymentModule,
    VnpayTransactionModule,
    RefundRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
