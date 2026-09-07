const mongoose = require('mongoose');

const landStockLedgerSchema = new mongoose.Schema(
  {
    agreementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KisanLandAgreement',
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['AGREEMENT', 'REGISTRY_DEED'],
      required: true,
      default: 'AGREEMENT',
    },
    deedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    deedNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      default: null,
      index: true,
    },
    bookingNumber: {
      type: String,
      trim: true,
      default: '',
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    plotNumber: {
      type: String,
      trim: true,
      default: '',
    },
    transactionType: {
      type: String,
      enum: [
        'INITIAL_AGREEMENT',
        'REGISTRY_CONVERSION',
        'BOOKING_ALLOCATION',
        'BOOKING_RESTRUCTURING_DELTA',
        'BOOKING_CANCELLATION_RESTORE',
        'MANUAL_ADJUSTMENT',
      ],
      required: true,
    },
    // Direction: 'CREDIT' adds available stock (+), 'DEBIT' reduces available stock (-)
    entryType: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    dismil: {
      type: Number,
      required: true,
    },
    sqFt: {
      type: Number,
      required: true,
    },
    runningAvailableSqFt: {
      type: Number,
      required: true,
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
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

landStockLedgerSchema.index({ agreementId: 1, createdAt: -1 });
landStockLedgerSchema.index({ deedNumber: 1 });
landStockLedgerSchema.index({ bookingNumber: 1 });

module.exports = mongoose.model('LandStockLedger', landStockLedgerSchema);
