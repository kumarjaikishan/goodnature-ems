const mongoose = require('mongoose');

const installmentSubSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidDate: {
      type: Date,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotReceipt',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE'],
      default: 'PENDING',
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    lateFine: {
      type: Number,
      default: 0,
    },
    lateFinePaid: {
      type: Number,
      default: 0,
    },
    lateFineRebate: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const collectionTransactionSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    principalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFinePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFineRebate: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMode: {
      type: String,
      default: 'cash',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    installmentNumbers: [Number],
    remarks: {
      type: String,
      default: '',
    },
    collectedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true, timestamps: true }
);

const plotProductBookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotProduct',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotCustomer',
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAreaSqFt: {
      type: Number,
      default: 0,
    },
    dimensionsSnapshot: {
      north: Number,
      south: Number,
      east: Number,
      west: Number,
      unit: String,
      dimensionLabel: String,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
      default: 24,
    },
    paymentType: {
      type: String,
      enum: ['FULL_PAYMENT', 'MONTHLY_INSTALLMENT'],
      default: 'MONTHLY_INSTALLMENT',
    },
    downPayment: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyEmi: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLateFinePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLateFineRebate: {
      type: Number,
      default: 0,
      min: 0,
    },
    installments: [installmentSubSchema],
    collections: [collectionTransactionSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.PlotProductBooking || mongoose.model('PlotProductBooking', plotProductBookingSchema);
