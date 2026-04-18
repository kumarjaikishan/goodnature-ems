const EsslEvent = require('../models/esslEvent');

const logEsslEvent = async ({ companyId, employeeId, empId, employeeName, event, type = 'Success' }) => {
    try {
        const newEvent = new EsslEvent({
            companyId,
            employeeId,
            empId,
            employeeName,
            event,
            type,
            timestamp: new Date()
        });
        await newEvent.save();

        // Optional: Keep only last 100 events per company to prevent db bloat if needed
        // await EsslEvent.deleteMany({ companyId, _id: { $nin: await EsslEvent.find({ companyId }).sort({ createdAt: -1 }).limit(100).select('_id') } });
        
    } catch (error) {
        console.error('Error logging ESSL event:', error);
    }
};

module.exports = { logEsslEvent };
