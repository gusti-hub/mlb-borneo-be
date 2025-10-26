require('dotenv').config();
const { insertDummyData } = require('./insertDummyData');

const run = async () => {
  try {
    console.log('🚀 Starting dummy data insertion...\n');
    await insertDummyData();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
};

run();
