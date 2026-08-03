const cron = require('node-cron');
const plotsService = require('../services/plots.service');

const initPlotPayoutScheduler = () => {
  // Run every hour or daily. Let's run every hour to make sure it catches any missed dates immediately.
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[PlotPayoutScheduler] Running weekly payout accrual check...');
      await plotsService.payoutCronJobLogic();
    } catch (error) {
      console.error('[PlotPayoutScheduler] Error running weekly payout accrual:', error);
    }
  });
};

module.exports = { initPlotPayoutScheduler };
