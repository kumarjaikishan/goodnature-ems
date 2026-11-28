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

        // Keep only the last 200 events per company to prevent DB bloat
        const filter = companyId ? { companyId } : {};
        const keepIds = await EsslEvent.find(filter)
            .sort({ createdAt: -1 })
            .limit(200)
            .select('_id')
            .lean();
        if (keepIds.length === 200) {
            await EsslEvent.deleteMany({ ...filter, _id: { $nin: keepIds.map((d) => d._id) } });
        }
        
    } catch (error) {
        console.error('Error logging ESSL event:', error);
    }
};

module.exports = { logEsslEvent };
