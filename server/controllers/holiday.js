const holidaymodal = require('../models/holiday');
const dayjs = require('dayjs');

const addholiday = async (req, res) => {
    let { name, fromDate, toDate, type, description } = req.body;

    if (!name || !fromDate || !toDate) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        fromDate = dayjs(fromDate).format('YYYY-MM-DD');
        toDate = dayjs(toDate).format('YYYY-MM-DD');
        const holiday = new holidaymodal({ companyId:req.user.companyId , userid: req.user.id, name, description, fromDate, toDate, type });
        await holiday.save();
        res.json({ message: 'Holiday added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
const deleteholiday = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Id is required' });
    }
    try {
        await holidaymodal.findByIdAndDelete(id);
        res.status(200).json({ message: 'Holiday Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
const updateholiday = async (req, res) => {
    let { holidayId, name, fromDate, toDate, type, description } = req.body;
    if (!holidayId || !name || !fromDate || !toDate) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        fromDate = dayjs(fromDate).format('YYYY-MM-DD');
        toDate = dayjs(toDate).format('YYYY-MM-DD');
        const companyid = await holidaymodal.findByIdAndUpdate(holidayId, { name, fromDate, toDate, type, description })
        res.json({ message: 'Holiday Updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getholidays = async (req, res) => {
    try {
        const holidays = await holidaymodal.find({ companyId: req.user.companyId }).sort({fromDate:-1});
        res.json({ holidays });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
const bulkImportHolidays = async (req, res) => {
    const { holidays } = req.body;

    if (!Array.isArray(holidays) || holidays.length === 0) {
        return res.status(400).json({ message: 'No holiday data provided' });
    }

    try {
        const docs = holidays.map(h => ({
            companyId: req.user.companyId,
            userid: req.user.id,
            name: h.name,
            fromDate: dayjs(h.fromDate).format('YYYY-MM-DD'),
            toDate: dayjs(h.toDate || h.fromDate).format('YYYY-MM-DD'),
            type: ['National', 'Religious', 'Public', 'Other'].includes(h.type) ? h.type : 'Other',
            description: h.description || '',
        }));

        const result = await holidaymodal.insertMany(docs, { ordered: false });
        res.json({ message: `${result.length} holiday(s) imported successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during import' });
    }
};

module.exports = { addholiday, getholidays, updateholiday, deleteholiday, bulkImportHolidays };