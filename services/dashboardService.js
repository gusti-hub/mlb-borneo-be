const pool = require('../config/database');

class DashboardService {
  
  // Kalkulasi poin PIC berdasarkan aktivitas
  async calculatePICPoints(startDate, endDate) {
    const query = `
      SELECT 
        p.pic_name,
        p.pic_code,
        p.color_code,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_count,
        COUNT(*) as total_activities
      FROM pics p
      LEFT JOIN activities a ON p.id = a.pic_id 
        AND a.created_at BETWEEN $1 AND $2
      GROUP BY p.id, p.pic_name, p.pic_code, p.color_code
      ORDER BY completed_count DESC;
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    // Calculate points (completed = 5 points, active = 3 points, pending = 1 point)
    const picPoints = result.rows.map(row => ({
      pic_name: row.pic_name,
      pic_code: row.pic_code,
      color_code: row.color_code,
      points: (row.completed_count * 5) + (row.active_count * 3) + (row.pending_count * 1),
      completed: row.completed_count,
      active: row.active_count,
      pending: row.pending_count,
      total: row.total_activities
    }));
    
    return picPoints;
  }

  // Trend shipper/trader
  async calculateShipperTrend(startDate, endDate) {
    const query = `
      SELECT 
        s.shipper_name,
        COUNT(*) as transaction_count,
        EXTRACT(MONTH FROM a.created_at) as month
      FROM shippers s
      JOIN activities a ON s.id = a.shipper_id
      WHERE a.created_at BETWEEN $1 AND $2
      GROUP BY s.id, s.shipper_name, EXTRACT(MONTH FROM a.created_at)
      ORDER BY transaction_count DESC;
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Trend loading port
  async calculateLoadingPortTrend(startDate, endDate) {
    const query = `
      SELECT 
        lp.port_name,
        COUNT(*) as usage_count,
        EXTRACT(MONTH FROM a.created_at) as month
      FROM loading_ports lp
      JOIN activities a ON lp.id = a.loading_port_id
      WHERE a.created_at BETWEEN $1 AND $2
      GROUP BY lp.id, lp.port_name, EXTRACT(MONTH FROM a.created_at)
      ORDER BY usage_count DESC;
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Performance operation per PIC
  async calculatePICPerformance(picId, startDate, endDate) {
    const query = `
      SELECT 
        v.vessel_name,
        a.inquiry_date,
        a.appointment_replied_date,
        a.eta_notice_shipper,
        a.loading_receipt,
        a.port_clearance_issued,
        EXTRACT(EPOCH FROM (a.appointment_replied_date - a.inquiry_date))/3600 as inquiry_duration_hours,
        EXTRACT(EPOCH FROM (a.loading_receipt - a.eta_notice_shipper))/86400 as eta_to_loading_days
      FROM activities a
      JOIN vessels v ON a.vessel_id = v.id
      WHERE a.pic_id = $1 
        AND a.created_at BETWEEN $2 AND $3
      ORDER BY a.created_at DESC;
    `;
    
    const result = await pool.query(query, [picId, startDate, endDate]);
    return result.rows;
  }

  // Simpan hasil kalkulasi ke database
  async saveCalculationResults(calculationType, data) {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      INSERT INTO dashboard_results (calculation_date, result_type, result_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (calculation_date, result_type) 
      DO UPDATE SET result_data = $3, created_at = CURRENT_TIMESTAMP;
    `;
    
    await pool.query(query, [today, calculationType, JSON.stringify(data)]);
  }

  // Ambil hasil kalkulasi dari database
  async getCalculationResults(calculationType, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT result_data 
      FROM dashboard_results 
      WHERE calculation_date = $1 AND result_type = $2;
    `;
    
    const result = await pool.query(query, [targetDate, calculationType]);
    
    if (result.rows.length > 0) {
      return result.rows[0].result_data;
    }
    
    return null;
  }

  // Jalankan semua kalkulasi dan simpan hasilnya
  async runAllCalculations() {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      console.log('🔄 Running dashboard calculations...');

      // Calculate PIC Points
      const picPoints = await this.calculatePICPoints(thirtyDaysAgo, today);
      await this.saveCalculationResults('pic_points', picPoints);
      console.log('✅ PIC Points calculated');

      // Calculate Shipper Trend
      const shipperTrend = await this.calculateShipperTrend(thirtyDaysAgo, today);
      await this.saveCalculationResults('shipper_trend', shipperTrend);
      console.log('✅ Shipper Trend calculated');

      // Calculate Loading Port Trend
      const loadingPortTrend = await this.calculateLoadingPortTrend(thirtyDaysAgo, today);
      await this.saveCalculationResults('loading_port_trend', loadingPortTrend);
      console.log('✅ Loading Port Trend calculated');

      console.log('✅ All calculations completed successfully');
      
      return {
        success: true,
        message: 'All dashboard calculations completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in calculations:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();
