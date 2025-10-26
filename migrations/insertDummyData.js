const pool = require('../config/database');

const insertDummyData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Inserting dummy data...\n');

    await client.query('BEGIN');

    // Insert Vessels
    console.log('📦 Creating vessels...');
    await client.query(`
      INSERT INTO vessels (vessel_name) VALUES
        ('MV OCEAN STAR'),
        ('MV PACIFIC DREAM'),
        ('MV ASIA PEARL'),
        ('MV BORNEO GLORY'),
        ('MV JAVA PRINCE'),
        ('MV KALIMANTAN QUEEN'),
        ('MV SULAWESI KING'),
        ('MV SUMATERA PRIDE'),
        ('MV BALI SPIRIT'),
        ('MV LOMBOK WAVE')
      ON CONFLICT (vessel_name) DO NOTHING;
    `);

    // Insert Shippers
    console.log('📦 Creating shippers...');
    await client.query(`
      INSERT INTO shippers (shipper_name) VALUES
        ('PT Indo Coal Mining'),
        ('PT Asia Resources'),
        ('PT Global Trading'),
        ('PT Pacific Minerals'),
        ('PT Java Energy'),
        ('PT Borneo Resources'),
        ('PT Kalimantan Mining')
      ON CONFLICT DO NOTHING;
    `);

    // Insert Buyers
    console.log('📦 Creating buyers...');
    await client.query(`
      INSERT INTO buyers (buyer_name) VALUES
        ('China Steel Corp'),
        ('Japan Energy Ltd'),
        ('Korea Power Co'),
        ('Taiwan Industries'),
        ('Singapore Trading'),
        ('India Coal Import'),
        ('Thailand Power')
      ON CONFLICT DO NOTHING;
    `);

    // Insert Loading Ports
    console.log('📦 Creating loading ports...');
    await client.query(`
      INSERT INTO loading_ports (port_name) VALUES
        ('Balikpapan'),
        ('Samarinda'),
        ('Banjarmasin'),
        ('Tarakan'),
        ('Tanjung Perak'),
        ('Palembang'),
        ('Teluk Bayur')
      ON CONFLICT DO NOTHING;
    `);

    // Insert Discharging Ports
    console.log('📦 Creating discharging ports...');
    await client.query(`
      INSERT INTO discharging_ports (port_name) VALUES
        ('Shanghai'),
        ('Tokyo'),
        ('Busan'),
        ('Kaohsiung'),
        ('Singapore'),
        ('Mumbai'),
        ('Bangkok')
      ON CONFLICT DO NOTHING;
    `);

    // Get IDs for foreign keys
    const vessels = await client.query('SELECT id, vessel_name FROM vessels');
    const pics = await client.query('SELECT id, pic_name FROM pics');
    const shippers = await client.query('SELECT id FROM shippers');
    const buyers = await client.query('SELECT id FROM buyers');
    const loadingPorts = await client.query('SELECT id FROM loading_ports');
    const dischargingPorts = await client.query('SELECT id FROM discharging_ports');
    const users = await client.query('SELECT id FROM users LIMIT 1');

    // Insert Activities (30 records with varied status)
    console.log('📦 Creating activities...');
    
    const statuses = ['completed', 'active', 'pending'];
    const currentDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const vesselId = vessels.rows[i % vessels.rows.length].id;
      const picId = pics.rows[i % pics.rows.length].id;
      const shipperId = shippers.rows[i % shippers.rows.length].id;
      const buyerId = buyers.rows[i % buyers.rows.length].id;
      const loadingPortId = loadingPorts.rows[i % loadingPorts.rows.length].id;
      const dischargingPortId = dischargingPorts.rows[i % dischargingPorts.rows.length].id;
      const status = statuses[i % statuses.length];
      const userId = users.rows[0].id;

      // Random dates in last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const inquiryDate = new Date(currentDate);
      inquiryDate.setDate(inquiryDate.getDate() - daysAgo);

      await client.query(`
        INSERT INTO activities (
          vessel_id, pic_id, shipper_id, buyer_id, 
          loading_port_id, discharging_port_id, created_by,
          ship_owner, stowage_plan, stowage_factor,
          inquiry_date, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        vesselId, picId, shipperId, buyerId,
        loadingPortId, dischargingPortId, userId,
        'PT Shipping Lines', 'Standard', (Math.random() * 2 + 1).toFixed(2),
        inquiryDate, status, `Shipment ${i + 1} - ${status} status`
      ]);
    }

    await client.query('COMMIT');

    console.log('✅ Dummy data inserted successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${vessels.rows.length} vessels`);
    console.log(`   • ${pics.rows.length} PICs`);
    console.log(`   • ${shippers.rows.length} shippers`);
    console.log(`   • ${buyers.rows.length} buyers`);
    console.log(`   • ${loadingPorts.rows.length} loading ports`);
    console.log(`   • ${dischargingPorts.rows.length} discharging ports`);
    console.log(`   • 30 activities`);
    console.log('\n✅ Ready to use!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error inserting dummy data:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { insertDummyData };
