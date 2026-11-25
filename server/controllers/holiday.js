const holidaymodal = require('../models/holiday');
const dayjs = require('dayjs');

const VALID_TYPES = ['National', 'Religious', 'Public', 'Other'];

const addholiday = async (req, res) => {
    let { name, fromDate, toDate, type, description } = req.body;

    if (!name?.trim() || !fromDate || !toDate) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const parsedFrom = dayjs(fromDate);
    const parsedTo = dayjs(toDate);
    if (!parsedFrom.isValid() || !parsedTo.isValid()) {
        return res.status(400).json({ message: 'Invalid date format' });
    }
    if (parsedTo.isBefore(parsedFrom, 'day')) {
        return res.status(400).json({ message: 'To Date cannot be earlier than From Date' });
    }

    try {
        fromDate = parsedFrom.format('YYYY-MM-DD');
        toDate = parsedTo.format('YYYY-MM-DD');
        const safeType = VALID_TYPES.includes(type) ? type : 'Public';
        const holiday = new holidaymodal({
            userid: req.user.id,
            name: name.trim(),
            description: description?.trim() || '',
            fromDate,
            toDate,
            type: safeType
        });
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
        const deleted = await holidaymodal.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        res.status(200).json({ message: 'Holiday Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
const updateholiday = async (req, res) => {
    let { holidayId, name, fromDate, toDate, type, description } = req.body;
    if (!holidayId || !name?.trim() || !fromDate || !toDate) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const parsedFrom = dayjs(fromDate);
    const parsedTo = dayjs(toDate);
    if (!parsedFrom.isValid() || !parsedTo.isValid()) {
        return res.status(400).json({ message: 'Invalid date format' });
    }
    if (parsedTo.isBefore(parsedFrom, 'day')) {
        return res.status(400).json({ message: 'To Date cannot be earlier than From Date' });
    }

    try {
        fromDate = parsedFrom.format('YYYY-MM-DD');
        toDate = parsedTo.format('YYYY-MM-DD');
        const safeType = VALID_TYPES.includes(type) ? type : 'Public';
        const updated = await holidaymodal.findByIdAndUpdate(
            holidayId,
            {
                name: name.trim(),
                fromDate,
                toDate,
                type: safeType,
                description: description?.trim() || ''
            },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        res.json({ message: 'Holiday Updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getholidays = async (req, res) => {
    try {
        const holidays = await holidaymodal.find().sort({ fromDate: -1 }).lean();
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
        const existing = await holidaymodal.find({}, 'name fromDate toDate').lean();
        const existingKeys = new Set(
            existing.map(h => `${(h.name || '').trim().toLowerCase()}|${h.fromDate}|${h.toDate}`)
        );

        const docs = [];
        let skippedInvalid = 0;
        let skippedDuplicates = 0;

        for (const h of holidays) {
            const cleanName = (h.name || '').trim();
            const parsedFrom = dayjs(h.fromDate);
            const parsedTo = dayjs(h.toDate || h.fromDate);

            if (!cleanName || !parsedFrom.isValid() || !parsedTo.isValid() || parsedTo.isBefore(parsedFrom, 'day')) {
                skippedInvalid++;
                continue;
            }

            const fromStr = parsedFrom.format('YYYY-MM-DD');
            const toStr = parsedTo.format('YYYY-MM-DD');
            const key = `${cleanName.toLowerCase()}|${fromStr}|${toStr}`;

            if (existingKeys.has(key)) {
                skippedDuplicates++;
                continue;
            }
            existingKeys.add(key);

            docs.push({
                userid: req.user.id,
                name: cleanName,
                fromDate: fromStr,
                toDate: toStr,
                type: VALID_TYPES.includes(h.type) ? h.type : 'Other',
                description: (h.description || '').trim(),
            });
        }

        if (docs.length === 0) {
            return res.status(400).json({
                message: skippedDuplicates > 0
                    ? `All ${skippedDuplicates} holiday(s) already exist`
                    : 'No valid holiday rows to import'
            });
        }

        const result = await holidaymodal.insertMany(docs, { ordered: false });
        const parts = [`${result.length} holiday(s) imported successfully`];
        if (skippedDuplicates > 0) parts.push(`${skippedDuplicates} duplicate(s) skipped`);
        if (skippedInvalid > 0) parts.push(`${skippedInvalid} invalid row(s) skipped`);
        res.json({ message: parts.join(' • ') });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during import' });
    }
};

module.exports = { addholiday, getholidays, updateholiday, deleteholiday, bulkImportHolidays };