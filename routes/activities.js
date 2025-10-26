const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// GET all activities
router.get('/', async (req, res) => {
  try {
    const { vessel, pic, status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        a.*,
        v.vessel_name,
        p.pic_name,
        p.pic_code,
        s.shipper_name,
        b.buyer_name,
        lp.port_name as loading_port_name,
        dp.port_name as discharging_port_name
      FROM activities a
      LEFT JOIN vessels v ON a.vessel_id = v.id
      LEFT JOIN pics p ON a.pic_id = p.id
      LEFT JOIN shippers s ON a.shipper_id = s.id
      LEFT JOIN buyers b ON a.buyer_id = b.id
      LEFT JOIN loading_ports lp ON a.loading_port_id = lp.id
      LEFT JOIN discharging_ports dp ON a.discharging_port_id = dp.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (vessel) {
      query += ` AND v.vessel_name ILIKE $${paramIndex}`;
      params.push(`%${vessel}%`);
      paramIndex++;
    }
    
    if (pic) {
      query += ` AND p.pic_code = $${paramIndex}`;
      params.push(pic);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// GET single activity by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        a.*,
        v.vessel_name,
        p.pic_name,
        p.pic_code,
        s.shipper_name,
        b.buyer_name,
        lp.port_name as loading_port_name,
        dp.port_name as discharging_port_name
      FROM activities a
      LEFT JOIN vessels v ON a.vessel_id = v.id
      LEFT JOIN pics p ON a.pic_id = p.id
      LEFT JOIN shippers s ON a.shipper_id = s.id
      LEFT JOIN buyers b ON a.buyer_id = b.id
      LEFT JOIN loading_ports lp ON a.loading_port_id = lp.id
      LEFT JOIN discharging_ports dp ON a.discharging_port_id = dp.id
      WHERE a.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Get appointments
    const appointmentsQuery = 'SELECT * FROM appointments WHERE activity_id = $1 ORDER BY appointment_date';
    const appointments = await pool.query(appointmentsQuery, [id]);
    
    // Get attachments
    const attachmentsQuery = 'SELECT * FROM attachments WHERE activity_id = $1 ORDER BY created_at DESC';
    const attachments = await pool.query(attachmentsQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        appointments: appointments.rows,
        attachments: attachments.rows
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
});

// POST create new activity
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      vessel_name,
      pic_code,
      shipper_name,
      buyer_name,
      loading_port_name,
      discharging_port_name,
      ship_owner,
      stowage_plan,
      stowage_factor,
      ta_load_port,
      local_agent,
      inquiry_date,
      appointment_replied_date,
      eta_notice_shipper,
      eta_notice_buyer,
      eta_notice_ship_owner,
      eta_notice_nominated_surveyor,
      loading_receipt,
      port_clearance_issued,
      appointments = []
    } = req.body;
    
    // Insert or get vessel
    let vesselResult = await client.query(
      'INSERT INTO vessels (vessel_name) VALUES ($1) ON CONFLICT (vessel_name) DO UPDATE SET vessel_name = $1 RETURNING id',
      [vessel_name]
    );
    const vesselId = vesselResult.rows[0].id;
    
    // Get PIC
    const picResult = await client.query('SELECT id FROM pics WHERE pic_code = $1', [pic_code]);
    const picId = picResult.rows[0]?.id;
    
    // Insert or get shipper
    let shipperResult = await client.query(
      'INSERT INTO shippers (shipper_name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
      [shipper_name]
    );
    if (shipperResult.rows.length === 0) {
      shipperResult = await client.query('SELECT id FROM shippers WHERE shipper_name = $1', [shipper_name]);
    }
    const shipperId = shipperResult.rows[0]?.id;
    
    // Insert or get buyer
    let buyerResult = await client.query(
      'INSERT INTO buyers (buyer_name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
      [buyer_name]
    );
    if (buyerResult.rows.length === 0) {
      buyerResult = await client.query('SELECT id FROM buyers WHERE buyer_name = $1', [buyer_name]);
    }
    const buyerId = buyerResult.rows[0]?.id;
    
    // Insert or get loading port
    let loadingPortResult = await client.query(
      'INSERT INTO loading_ports (port_name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
      [loading_port_name]
    );
    if (loadingPortResult.rows.length === 0) {
      loadingPortResult = await client.query('SELECT id FROM loading_ports WHERE port_name = $1', [loading_port_name]);
    }
    const loadingPortId = loadingPortResult.rows[0]?.id;
    
    // Insert or get discharging port
    let dischargingPortResult = await client.query(
      'INSERT INTO discharging_ports (port_name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
      [discharging_port_name]
    );
    if (dischargingPortResult.rows.length === 0) {
      dischargingPortResult = await client.query('SELECT id FROM discharging_ports WHERE port_name = $1', [discharging_port_name]);
    }
    const dischargingPortId = dischargingPortResult.rows[0]?.id;
    
    // Insert activity
    const activityQuery = `
      INSERT INTO activities (
        vessel_id, pic_id, shipper_id, buyer_id, loading_port_id, discharging_port_id,
        ship_owner, stowage_plan, stowage_factor, ta_load_port, local_agent,
        inquiry_date, appointment_replied_date,
        eta_notice_shipper, eta_notice_buyer, eta_notice_ship_owner, eta_notice_nominated_surveyor,
        loading_receipt, port_clearance_issued
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `;
    
    // Convert empty strings to null for date fields
    const activityResult = await client.query(activityQuery, [
      vesselId, picId, shipperId, buyerId, loadingPortId, dischargingPortId,
      ship_owner || null, 
      stowage_plan || null, 
      stowage_factor || null, 
      ta_load_port || null, 
      local_agent || null,
      inquiry_date || null, 
      appointment_replied_date || null,
      eta_notice_shipper || null, 
      eta_notice_buyer || null, 
      eta_notice_ship_owner || null, 
      eta_notice_nominated_surveyor || null,
      loading_receipt || null, 
      port_clearance_issued || null
    ]);
    
    const activityId = activityResult.rows[0].id;
    
    // Insert appointments if any
    if (appointments && appointments.length > 0) {
      for (const appointment of appointments) {
        await client.query(
          'INSERT INTO appointments (activity_id, appointment_date, notes) VALUES ($1, $2, $3)',
          [activityId, appointment.date, appointment.notes]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { id: activityId }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// PUT update activity
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Handle simple fields
    const simpleFields = [
      'ship_owner', 'stowage_plan', 'stowage_factor', 'ta_load_port', 'local_agent',
      'inquiry_date', 'appointment_replied_date',
      'eta_notice_shipper', 'eta_notice_buyer', 'eta_notice_ship_owner', 'eta_notice_nominated_surveyor',
      'loading_receipt', 'port_clearance_issued', 'status'
    ];
    
    for (const field of simpleFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        // Convert empty string to null for date/optional fields
        values.push(updateData[field] === '' ? null : updateData[field]);
        paramIndex++;
      }
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (fields.length > 0) {
      values.push(id);
      const updateQuery = `UPDATE activities SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
      await client.query(updateQuery, values);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// DELETE activity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM activities WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
});

module.exports = router;
