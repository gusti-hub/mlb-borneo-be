const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');

// GET dashboard data (dari hasil kalkulasi yang tersimpan)
router.get('/data', async (req, res) => {
  try {
    const { date } = req.query; // optional: specific date
    
    const picPoints = await dashboardService.getCalculationResults('pic_points', date);
    const shipperTrend = await dashboardService.getCalculationResults('shipper_trend', date);
    const loadingPortTrend = await dashboardService.getCalculationResults('loading_port_trend', date);
    
    res.json({
      success: true,
      data: {
        picPoints: picPoints || [],
        shipperTrend: shipperTrend || [],
        loadingPortTrend: loadingPortTrend || []
      },
      calculationDate: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// POST trigger kalkulasi manual (ad-hoc dari frontend)
router.post('/calculate', async (req, res) => {
  try {
    console.log('🔄 Manual calculation triggered from frontend');
    const result = await dashboardService.runAllCalculations();
    
    res.json({
      success: true,
      message: 'Dashboard calculation completed successfully',
      result
    });
  } catch (error) {
    console.error('Error in manual calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate dashboard data',
      error: error.message
    });
  }
});

// GET PIC performance detail
router.get('/pic/:picId/performance', async (req, res) => {
  try {
    const { picId } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(Date.now() - 30*24*60*60*1000);
    const end = endDate || new Date();
    
    const performance = await dashboardService.calculatePICPerformance(picId, start, end);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching PIC performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PIC performance',
      error: error.message
    });
  }
});

module.exports = router;
