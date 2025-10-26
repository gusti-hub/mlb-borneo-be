require('dotenv').config();
const { createTables } = require('./createTables');
const pool = require('../config/database');

const runMigrations = async () => {
  try {
    console.log('🚀 Starting database migration...');
    await createTables();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
