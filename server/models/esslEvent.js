const mongoose = require('mongoose');

const esslEventSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    empId: {
        type: String
    },
    employeeName: {
        type: String
    },
    event: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Success', 'Warning', 'Error', 'Ignored'],
        default: 'Success'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const EsslEvent = mongoose.model("EsslEvent", esslEventSchema);
module.exports = EsslEvent;
