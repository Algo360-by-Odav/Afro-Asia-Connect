const { PrismaClient } = require('@prisma/client');
const { seedTestData } = require('./test-data');

async function globalSetup() {
  console.log('Running global test setup...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  });

  try {
    // Connect to database
    await prisma.$connect();
    console.log('Connected to test database');

    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL 
      }
    });

    // Seed test data
    await seedTestData(prisma);

    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = globalSetup;
