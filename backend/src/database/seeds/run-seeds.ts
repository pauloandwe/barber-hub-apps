import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { seedBusiness } from './business.seed';
import { seedProfiles } from './profiles.seed';

// Load env variables
dotenv.config();

async function runSeeds() {
  try {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'barber_hub',
      password: process.env.DATABASE_PASSWORD || 'barber_hub_password',
      database: process.env.DATABASE_NAME || 'barber_hub_db',
      entities: [path.join(__dirname, '../entities/*.entity{.ts,.js}')],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
    console.log('✓ Database connection established\n');

    // Run seeds in order
    console.log('Running seeds...\n');
    await seedBusiness(dataSource);
    console.log();
    await seedProfiles(dataSource);
    console.log();

    await dataSource.destroy();
    console.log('✓ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
