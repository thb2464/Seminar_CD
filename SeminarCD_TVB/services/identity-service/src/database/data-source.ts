import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { User } from '../users/user.entity';

loadEnv();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'identity',
  password: process.env.DATABASE_PASSWORD ?? 'identity',
  database: process.env.DATABASE_NAME ?? 'identity_db',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  entities: [User],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
};

export const AppDataSource = new DataSource(dataSourceOptions);
