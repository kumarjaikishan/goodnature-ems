const Essl = require('../models/essllivelogs');
const EsslEvent = require('../models/esslEvent');

// ==========================================
// DEVELOPER ESSL MONITORING & BULK DELETION
// ==========================================
const getEsslLogsDeveloper = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const filter = {};
        if (search) {
            filter.$or = [
                { pin: { $regex: search, $options: 'i' } },
                { raw: { $regex: search, $options: 'i' } },
                { timestamp: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, logs] = await Promise.all([
            Essl.countDocuments(filter),
            Essl.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            limit,
            logs
        });
    } catch (error) {
        console.error("Error fetching ESSL logs for developer:", error);
        return next({ status: 500, message: error.message });
    }
};

const getEsslEventsDeveloper = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const type = req.query.type || '';

        const filter = {};
        if (type && type !== 'all') {
            filter.type = type;
        }
        if (search) {
            filter.$or = [
                { empId: { $regex: search, $options: 'i' } },
                { employeeName: { $regex: search, $options: 'i' } },
                { event: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, events] = await Promise.all([
            EsslEvent.countDocuments(filter),
            EsslEvent.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            limit,
            events
        });
    } catch (error) {
        console.error("Error fetching ESSL events for developer:", error);
        return next({ status: 500, message: error.message });
    }
};

const bulkDeleteEsslLogs = async (req, res, next) => {
    try {
        const { ids, deleteAll } = req.body;

        if (deleteAll) {
            const result = await Essl.deleteMany({});
            return res.status(200).json({
                success: true,
                message: `All ${result.deletedCount} ESSL logs deleted successfully.`,
                deletedCount: result.deletedCount
            });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of log IDs to delete." });
        }

        const result = await Essl.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} ESSL log(s) deleted successfully.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting ESSL logs:", error);
        return next({ status: 500, message: error.message });
    }
};

const bulkDeleteEsslEvents = async (req, res, next) => {
    try {
        const { ids, deleteAll } = req.body;

        if (deleteAll) {
            const result = await EsslEvent.deleteMany({});
            return res.status(200).json({
                success: true,
                message: `All ${result.deletedCount} ESSL events deleted successfully.`,
                deletedCount: result.deletedCount
            });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of event IDs to delete." });
        }

        const result = await EsslEvent.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} ESSL event(s) deleted successfully.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting ESSL events:", error);
        return next({ status: 500, message: error.message });
    }
};

module.exports = {
    getEsslLogsDeveloper,
    getEsslEventsDeveloper,
    bulkDeleteEsslLogs,
    bulkDeleteEsslEvents
};

