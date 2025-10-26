require('dotenv').config();
const pool = require('../config/database');

const testConnection = async () => {
  console.log('🔍 Testing database connection...\n');
  
  console.log('Configuration:');
  console.log('  Host:', process.env.DB_HOST || 'NOT SET');
  console.log('  Port:', process.env.DB_PORT || 'NOT SET');
  console.log('  Database:', process.env.DB_NAME || 'NOT SET');
  console.log('  User:', process.env.DB_USER || 'NOT SET');
  console.log('  Password:', process.env.DB_PASSWORD ? '********' : 'NOT SET');
  console.log('  SSL:', process.env.DB_SSL || 'NOT SET');
  console.log('');

  try {
    console.log('⏳ Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!\n');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query test successful!');
    console.log('   Server time:', result.rows[0].current_time);
    
    // Check tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n📊 Existing tables:');
    if (tables.rows.length === 0) {
      console.log('   No tables found. Run migration first!');
    } else {
      tables.rows.forEach(row => {
        console.log('   •', row.tablename);
      });
    }
    
    client.release();
    
    console.log('\n✅ Database is ready!');
    console.log('👉 You can now run: npm run migrate');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if .env file exists and has correct values');
    console.error('   2. Verify database credentials from Supabase dashboard');
    console.error('   3. Make sure to use Connection Pooling port (6543)');
    console.error('   4. Check if DB_SSL=true is set');
    console.error('   5. Verify your IP is not blocked by Supabase');
    
    process.exit(1);
  }
};

testConnection();
