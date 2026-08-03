const cron = require('node-cron');
const plotsService = require('../services/plots.service');

const initPlotHoldScheduler = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[PlotHoldScheduler] Running hold auto-expiry check...');
      await plotsService.expireHoldBookings();
    } catch (error) {
      console.error('[PlotHoldScheduler] Error running hold auto-expiry check:', error);
    }
  });
};

module.exports = { initPlotHoldScheduler };
