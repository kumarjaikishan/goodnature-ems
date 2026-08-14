const apiMonitor = require('../utils/apiMonitor');

const getApiStats = async (req, res, next) => {
  try {
    const stats = apiMonitor.getStats();
    return res.status(200).json(stats);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

const clearApiStats = async (req, res, next) => {
  try {
    apiMonitor.clearStats();
    return res.status(200).json({ message: 'API monitor stats cleared' });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

module.exports = { getApiStats, clearApiStats };
