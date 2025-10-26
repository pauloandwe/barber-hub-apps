import { createConnection } from 'typeorm';
import * as path from 'path';
import { seedBusiness } from './business.seed';

async function runSeeds() {
  try {
    const dataSource = new (require('typeorm')).DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'barber_hub',
      password: process.env.DATABASE_PASSWORD || 'barber_hub_password',
      database: process.env.DATABASE_NAME || 'barber_hub_db',
      entities: [path.join(__dirname, '../entities/*.entity{.ts,.js}')],
      synchronize: true,
    });

    await dataSource.initialize();
    console.log('Database connection established');

    // Run seeds
    await seedBusiness(dataSource);

    await dataSource.destroy();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
