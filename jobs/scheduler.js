const cron = require('node-cron');
const dashboardService = require('../services/dashboardService');

// Jalankan kalkulasi setiap hari jam 2 pagi
const scheduleCalculations = () => {
  // Cron format: detik menit jam hari bulan hari_minggu
  // '0 2 * * *' = setiap hari jam 2:00 pagi
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Scheduled calculation started at:', new Date().toISOString());
    try {
      await dashboardService.runAllCalculations();
      console.log('✅ Scheduled calculation completed');
    } catch (error) {
      console.error('❌ Scheduled calculation failed:', error);
    }
  });

  console.log('📅 Dashboard calculation scheduler initialized (runs daily at 2:00 AM)');
};

module.exports = { scheduleCalculations };
