import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

const projectRoot = process.cwd();

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'barber_hub',
  password: process.env.DATABASE_PASSWORD || 'barber_hub_password',
  database: process.env.DATABASE_NAME || 'barber_hub_db',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(projectRoot, 'src/database/entities/*.entity{.ts,.js}')],
  migrations: [path.join(projectRoot, 'src/database/migrations/*{.ts,.js}')],
  migrationsRun: false,
  subscribers: [],
});
