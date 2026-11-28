const mongoose = require('mongoose');

const esslSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    pin: {
        type: String,
        required: true
    },

    timestamp: {
        type: String,
        required: true
    },

    status: {
        type: Number, // 0 = check-in, 1 = check-out
        required: true
    },

    verifyMode: {
        type: Number
    },

    raw: {
        type: String // optional: store original raw log
    }

}, { timestamps: true });

// Keep only the last 200 raw ESSL log entries per company (or globally if no companyId)
esslSchema.post('save', async function (doc) {
    try {
        const filter = doc.companyId ? { companyId: doc.companyId } : {};
        const keepIds = await this.constructor
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(200)
            .select('_id')
            .lean();
        if (keepIds.length === 200) {
            await this.constructor.deleteMany({
                ...filter,
                _id: { $nin: keepIds.map((d) => d._id) }
            });
        }
    } catch (err) {
        console.error('Error pruning EsslLogs:', err);
    }
});

const Essl = mongoose.model("EsslLogs", esslSchema);
module.exports = Essl;