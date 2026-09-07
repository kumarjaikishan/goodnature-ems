const mongoose = require('mongoose');

const kisanLedgerSchema = new mongoose.Schema(
  {
    agreementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KisanLandAgreement',
      required: true,
      index: true,
    },
    agreementNumber: {
      type: String,
      required: true,
      trim: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    farmerName: {
      type: String,
      required: true,
      trim: true,
    },
    farmerMobile: {
      type: String,
      default: '',
      trim: true,
    },
    // CREDIT = Land purchase value / due to farmer (+); DEBIT = Payment given to farmer (-)
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    runningBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'AGREEMENT_VALUE', 'OTHER'],
      default: 'CASH',
    },
    transactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    receiptNumber: {
      type: String,
      default: '',
      trim: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

kisanLedgerSchema.index({ agreementId: 1, date: 1 });
kisanLedgerSchema.index({ farmerName: 1 });

module.exports = mongoose.model('KisanLedger', kisanLedgerSchema);
