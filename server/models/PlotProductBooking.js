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
    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
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
    plotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plot',
      required: false,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotProject',
      default: null,
      index: true,
    },
    projectName: {
      type: String,
      trim: true,
      default: '',
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
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    branchPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    landSourcing: [
      {
        sourceType: {
          type: String,
          default: 'AGREEMENT',
        },
        agreementId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'KisanLandAgreement',
        },
        agreementNumber: String,
        parcelId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        deedId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        deedNumber: String,
        mauja: String,
        thanaNumber: String,
        khataNumber: String,
        khesraNumber: String,
        allocatedSqFt: Number,
        allocatedDismil: Number,
      },
    ],
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
      northSouth: Number,
      eastWest: Number,
      totalAreaSqFt: Number,
      unit: String,
      dimensionLabel: String,
    },
    planName: {
      type: String,
      trim: true,
      default: '',
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
      default: 24,
    },
    promoterCommissionPercent: {
      type: Number,
      min: 0,
    },
    developerCommissionPercent: {
      type: Number,
      min: 0,
    },
    bpCommissionPercent: {
      type: Number,
      min: 0,
    },
    branchCommissionPercent: {
      type: Number,
      min: 0,
    },
    rdMaturityPercent: {
      type: Number,
      default: 0,
    },
    fdMaturityPercent: {
      type: Number,
      default: 0,
    },
    annualInterestRate: {
      type: Number,
      default: 0,
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
    downpaymentDays: {
      type: Number,
      default: 90,
      min: 0,
    },
    downpaymentMonths: {
      type: Number,
      default: 3,
      min: 0,
    },
    emiFrequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    installmentCount: {
      type: Number,
      default: 24,
      min: 1,
    },
    dpType: {
      type: String,
      enum: ['PERCENT', 'FLAT', 'SQFT_RATE'],
      default: 'PERCENT',
    },
    dpVal: {
      type: Number,
      default: 0,
    },
    emiPrincipalAmount: {
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
    refundStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'PROCESSED'],
      default: 'NONE',
    },
    refundSettlementType: {
      type: String,
      enum: ['INTEREST_RETURN', 'DEDUCTION_PENALTY', 'NONE'],
      default: 'NONE',
    },
    refundDeductionType: {
      type: String,
      enum: ['PERCENT', 'FLAT'],
      default: 'PERCENT',
    },
    refundDeductionPercent: {
      type: Number,
      default: 0,
    },
    refundInterestRate: {
      type: Number,
      default: 0,
    },
    refundInterestAmount: {
      type: Number,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDeduction: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
      default: null,
    },
    refundNotes: {
      type: String,
      default: '',
    },
    refundVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
    },
    refundPayments: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        paymentMode: { type: String, default: 'CASH' },
        transactionReference: { type: String, default: '' },
        remarks: { type: String, default: '' },
        voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
        voucherNumber: { type: String, default: '' },
        paymentLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', default: null },
        paymentLedgerName: { type: String, default: '' },
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    commissionReversed: {
      type: Boolean,
      default: false,
    },
    commissionReversalDate: {
      type: Date,
      default: null,
    },
    commissionReversalCount: {
      type: Number,
      default: 0,
    },
    commissionReversalAmount: {
      type: Number,
      default: 0,
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
