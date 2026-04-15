const mongoose = require('mongoose');

const esslSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
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

const Essl = mongoose.model("EsslLogs", esslSchema);
module.exports = Essl;