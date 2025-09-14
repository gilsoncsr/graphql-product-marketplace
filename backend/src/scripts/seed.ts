import { databaseService } from '../lib/database';
import { logger } from '../lib/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Connect to database
    await databaseService.connect();

    // Read and execute init.sql
    const initSql = readFileSync(join(__dirname, '../../db/init.sql'), 'utf8');
    await databaseService.executeQuery(initSql);
    logger.info('Init SQL executed successfully');

    // Read and execute seed.sql
    const seedSql = readFileSync(join(__dirname, '../../db/seed.sql'), 'utf8');
    await databaseService.executeQuery(seedSql);
    logger.info('Seed SQL executed successfully');

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error({ error }, 'Database seeding failed');
    throw error;
  } finally {
    await databaseService.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Seeding failed');
      process.exit(1);
    });
}

export { seedDatabase };
