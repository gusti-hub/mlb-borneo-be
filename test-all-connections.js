require('dotenv').config();
const { Pool } = require('pg');

const testConnections = async () => {
  console.log('🔍 Testing multiple connection methods...\n');

  const configs = [
    {
      name: 'Direct Connection (Session Mode)',
      config: {
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.bvpumfyuffeifkjuwsvn',
        password: '949qCoumru03DBMG',
      }
    },
    {
      name: 'Connection Pooling (Transaction Mode)',
      config: {
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.bvpumfyuffeifkjuwsvn',
        password: '949qCoumru03DBMG',
      }
    },
    {
      name: 'Direct Connection with SSL',
      config: {
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.bvpumfyuffeifkjuwsvn',
        password: '949qCoumru03DBMG',
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Connection Pooling with SSL',
      config: {
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.bvpumfyuffeifkjuwsvn',
        password: '949qCoumru03DBMG',
        ssl: { rejectUnauthorized: false }
      }
    }
  ];

  for (const test of configs) {
    console.log(`📡 Testing: ${test.name}`);
    console.log(`   Port: ${test.config.port}, SSL: ${test.config.ssl ? 'Yes' : 'No'}`);
    
    const pool = new Pool(test.config);
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as time');
      console.log(`   ✅ SUCCESS! Server time: ${result.rows[0].time}`);
      client.release();
      await pool.end();
      
      console.log(`\n🎉 WORKING CONFIGURATION FOUND!`);
      console.log(`Use this in your .env:\n`);
      console.log(`DB_HOST=${test.config.host}`);
      console.log(`DB_PORT=${test.config.port}`);
      console.log(`DB_NAME=${test.config.database}`);
      console.log(`DB_USER=${test.config.user}`);
      console.log(`DB_PASSWORD=${test.config.password}`);
      console.log(`DB_SSL=${test.config.ssl ? 'true' : 'false'}`);
      
      process.exit(0);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      await pool.end();
    }
    console.log('');
  }

  console.log('❌ All connection methods failed!');
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check if Supabase project is active (not paused)');
  console.log('2. Verify password is correct');
  console.log('3. Check if your IP is whitelisted in Supabase');
  console.log('4. Try connecting from Supabase dashboard SQL Editor first');
  
  process.exit(1);
};

testConnections();
