import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { CatalogModule } from './catalog/catalog.module';
import { Tour } from './catalog/entities/tour.entity';
import { TourCategory } from './catalog/entities/tour-category.entity';
import { envValidationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';

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
            bindings: () => ({ service_name: 'catalog-service' }),
          },
          customLogLevel: (_req, res, err) => {
            if (err || res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
          customProps: (req) => ({
            trace_id:
              typeof req.headers['x-trace-id'] === 'string'
                ? req.headers['x-trace-id']
                : 'unknown',
          }),
          autoLogging: { ignore: (req) => req.url === '/health' },
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
        entities: [Tour, TourCategory],
        synchronize: config.get<boolean>('DATABASE_SYNCHRONIZE') === true,
        autoLoadEntities: true,
      }),
    }),
    HealthModule,
    CatalogModule,
  ],
})
export class AppModule {}
