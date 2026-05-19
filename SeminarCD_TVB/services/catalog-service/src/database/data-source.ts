import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Tour } from '../catalog/entities/tour.entity';

loadEnv();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'catalog',
  password: process.env.DATABASE_PASSWORD ?? 'catalog',
  database: process.env.DATABASE_NAME ?? 'catalog_db',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  entities: [Tour],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
};

export const AppDataSource = new DataSource(dataSourceOptions);
