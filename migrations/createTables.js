const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...\n');

    // Start transaction
    await client.query('BEGIN');

    // Drop existing tables if they exist (for clean install)
    console.log('📦 Dropping existing tables (if any)...');
    await client.query(`
      DROP TABLE IF EXISTS attachments CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS dashboard_results CASCADE;
      DROP TABLE IF EXISTS activities CASCADE;
      DROP TABLE IF EXISTS discharging_ports CASCADE;
      DROP TABLE IF EXISTS loading_ports CASCADE;
      DROP TABLE IF EXISTS buyers CASCADE;
      DROP TABLE IF EXISTS shippers CASCADE;
      DROP TABLE IF EXISTS pics CASCADE;
      DROP TABLE IF EXISTS vessels CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✅ Existing tables dropped\n');

    // Create users table
    console.log('📦 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create vessels table
    console.log('📦 Creating vessels table...');
    await client.query(`
      CREATE TABLE vessels (
        id SERIAL PRIMARY KEY,
        vessel_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Vessels table created');

    // Create PICs table
    console.log('📦 Creating PICs table...');
    await client.query(`
      CREATE TABLE pics (
        id SERIAL PRIMARY KEY,
        pic_name VARCHAR(100) NOT NULL UNIQUE,
        pic_code VARCHAR(50) NOT NULL UNIQUE,
        color_code VARCHAR(20) DEFAULT '#8B9FDE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PICs table created');

    // Create shippers table
    console.log('📦 Creating shippers table...');
    await client.query(`
      CREATE TABLE shippers (
        id SERIAL PRIMARY KEY,
        shipper_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Shippers table created');

    // Create buyers table
    console.log('📦 Creating buyers table...');
    await client.query(`
      CREATE TABLE buyers (
        id SERIAL PRIMARY KEY,
        buyer_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Buyers table created');

    // Create loading_ports table
    console.log('📦 Creating loading_ports table...');
    await client.query(`
      CREATE TABLE loading_ports (
        id SERIAL PRIMARY KEY,
        port_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Loading ports table created');

    // Create discharging_ports table
    console.log('📦 Creating discharging_ports table...');
    await client.query(`
      CREATE TABLE discharging_ports (
        id SERIAL PRIMARY KEY,
        port_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Discharging ports table created');

    // Create activities table
    console.log('📦 Creating activities table...');
    await client.query(`
      CREATE TABLE activities (
        id SERIAL PRIMARY KEY,
        vessel_id INTEGER REFERENCES vessels(id),
        pic_id INTEGER REFERENCES pics(id),
        shipper_id INTEGER REFERENCES shippers(id),
        buyer_id INTEGER REFERENCES buyers(id),
        loading_port_id INTEGER REFERENCES loading_ports(id),
        discharging_port_id INTEGER REFERENCES discharging_ports(id),
        created_by INTEGER REFERENCES users(id),
        
        ship_owner VARCHAR(255),
        stowage_plan VARCHAR(255),
        stowage_factor DECIMAL(10,2),
        ta_load_port VARCHAR(255),
        local_agent VARCHAR(255),
        
        inquiry_date TIMESTAMP,
        appointment_replied_date TIMESTAMP,
        
        eta_notice_shipper DATE,
        eta_notice_buyer DATE,
        eta_notice_ship_owner DATE,
        eta_notice_nominated_surveyor DATE,
        
        loading_receipt DATE,
        port_clearance_issued DATE,
        
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Activities table created');

    // Create dashboard_results table
    console.log('📦 Creating dashboard_results table...');
    await client.query(`
      CREATE TABLE dashboard_results (
        id SERIAL PRIMARY KEY,
        calculation_date DATE NOT NULL,
        result_type VARCHAR(100) NOT NULL,
        result_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(calculation_date, result_type)
      );
    `);
    console.log('✅ Dashboard results table created');

    // Create appointments table
    console.log('📦 Creating appointments table...');
    await client.query(`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
        appointment_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Appointments table created');

    // Create attachments table
    console.log('📦 Creating attachments table...');
    await client.query(`
      CREATE TABLE attachments (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Attachments table created');

    // Create indexes
    console.log('\n📦 Creating indexes...');
    await client.query(`
      CREATE INDEX idx_activities_vessel ON activities(vessel_id);
      CREATE INDEX idx_activities_pic ON activities(pic_id);
      CREATE INDEX idx_activities_status ON activities(status);
      CREATE INDEX idx_activities_created_by ON activities(created_by);
      CREATE INDEX idx_dashboard_results_date ON dashboard_results(calculation_date);
      CREATE INDEX idx_dashboard_results_type ON dashboard_results(result_type);
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_email ON users(email);
    `);
    console.log('✅ Indexes created');

    // Insert default admin user
    console.log('\n📦 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (username, email, password, full_name, role) 
      VALUES ($1, $2, $3, $4, $5)
    `, ['admin', 'admin@mlb.com', hashedPassword, 'Administrator', 'admin']);
    console.log('✅ Default admin user created');
    console.log('   👤 Username: admin');
    console.log('   🔑 Password: admin123');

    // Insert default PICs
    console.log('\n📦 Creating default PICs...');
    await client.query(`
      INSERT INTO pics (pic_name, pic_code, color_code) 
      VALUES 
        ('Alda', 'ALDA', '#8B9FDE'),
        ('Andri', 'ANDRI', '#F4A261'),
        ('Bayu', 'BAYU', '#E76F51')
    `);
    console.log('✅ Default PICs created (Alda, Andri, Bayu)');

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ ========================================');
    console.log('✅ DATABASE MIGRATION COMPLETED!');
    console.log('✅ ========================================\n');
    console.log('📊 Tables created:');
    console.log('   • users');
    console.log('   • vessels');
    console.log('   • pics');
    console.log('   • shippers');
    console.log('   • buyers');
    console.log('   • loading_ports');
    console.log('   • discharging_ports');
    console.log('   • activities');
    console.log('   • dashboard_results');
    console.log('   • appointments');
    console.log('   • attachments');
    console.log('\n👤 Default login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change password after first login!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed!');
    console.error('Error details:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
