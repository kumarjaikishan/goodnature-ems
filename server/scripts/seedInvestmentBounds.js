const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function updateConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goodnature-ems');
    const InvestmentSchemeConfig = require('../models/InvestmentSchemeConfig');
    
    let cfg = await InvestmentSchemeConfig.findOne({ status: 'active' });
    if (!cfg) {
      cfg = new InvestmentSchemeConfig({ status: 'active' });
    }
    cfg.minRdAmount = 2000;
    cfg.rdStepAmount = 1000;
    cfg.minFdAmount = 50000;
    cfg.fdStepAmount = 1000;
    await cfg.save();

    console.log('Successfully saved InvestmentSchemeConfig:');
    console.log('minRdAmount:', cfg.minRdAmount);
    console.log('rdStepAmount:', cfg.rdStepAmount);
    console.log('minFdAmount:', cfg.minFdAmount);
    console.log('fdStepAmount:', cfg.fdStepAmount);
  } catch (err) {
    console.error('Error updating config:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateConfig();
