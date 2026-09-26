const mongoose = require('mongoose');

const purchaserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Purchaser / Buyer name is required'],
      trim: true,
    },
    contact: {
      type: String,
      default: '',
      trim: true,
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
    },
    aadhaarNumber: {
      type: String,
      default: '',
      trim: true,
    },
    panNumber: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    guardianName: {
      type: String,
      default: '',
      trim: true,
    },
    relation: {
      type: String,
      default: 'Father',
      trim: true,
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
    },
    aadhaarNumber: {
      type: String,
      default: '',
      trim: true,
    },
    panNumber: {
      type: String,
      default: '',
      trim: true,
    },
    sharePercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    address: {
      type: String,
      default: '',
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      branch: { type: String, default: '' },
    },
  },
  { _id: true }
);

const landParcelSchema = new mongoose.Schema(
  {
    mauja: {
      type: String,
      required: true,
      trim: true,
    },
    thanaNumber: {
      type: String,
      default: '',
      trim: true,
    },
    khataNumber: {
      type: String,
      required: true,
      trim: true,
    },
    khesraNumber: {
      type: String,
      required: true,
      trim: true, // Plot No / Khasra No
    },
    jamabandiNumber: {
      type: String,
      default: '',
      trim: true,
    },
    chaudhi: {
      north: { type: String, default: '' },
      south: { type: String, default: '' },
      east: { type: String, default: '' },
      west: { type: String, default: '' },
    },
    // Area: 1 Dismil = 435.6 Sq Ft
    araziDismil: {
      type: Number,
      required: true,
      min: 0.001,
    },
    totalSqFt: {
      type: Number,
      required: true,
      min: 0.01,
    },
    ratePerDismil: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratePerSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Parcel-level registration & stock counters
    registeredDismil: {
      type: Number,
      default: 0,
      min: 0,
    },
    registeredSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    unregisteredAgreedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    unregisteredAllocatedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    unregisteredAvailableSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocatedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const landAttachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      default: 'Agreement Scan',
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const deedParcelAllocationSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    mauja: { type: String, default: '' },
    khataNumber: { type: String, default: '' },
    khesraNumber: { type: String, default: '' },
    thanaNumber: { type: String, default: '' },
    jamabandiNumber: { type: String, default: '' },
    chaudhi: {
      north: { type: String, default: '' },
      south: { type: String, default: '' },
      east: { type: String, default: '' },
      west: { type: String, default: '' },
    },
    registeredDismil: {
      type: Number,
      required: true,
      min: 0,
    },
    registeredSqFt: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const registryDeedSchema = new mongoose.Schema(
  {
    deedNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    deedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    subRegistrarOffice: {
      type: String,
      default: '',
      trim: true,
    },
    registeredDismil: {
      type: Number,
      required: true,
      min: 0,
    },
    registeredSqFt: {
      type: Number,
      required: true,
      min: 0,
    },
    allocatedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Multi-parcel attribution within this deed
    parcels: [deedParcelAllocationSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'FULLY_ALLOCATED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    remarks: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const kisanLandAgreementSchema = new mongoose.Schema(
  {
    agreementNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    agreementDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    agreementEndDate: {
      type: Date,
      default: null,
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
    // Multi-Parcel Land Particulars (One or more)
    landParcels: [landParcelSchema],

    // Legacy Fallback / Primary Parcel info for fast queries
    mauja: {
      type: String,
      default: '',
      trim: true,
    },
    thanaNumber: {
      type: String,
      default: '',
      trim: true,
    },
    khataNumber: {
      type: String,
      default: '',
      trim: true,
    },
    khesraNumber: {
      type: String,
      default: '',
      trim: true,
    },
    jamabandiNumber: {
      type: String,
      default: '',
      trim: true,
    },
    // Overall Land Area: 1 Dismil = 435.6 Sq Ft
    araziDismil: {
      type: Number,
      required: true,
      min: 0.001,
      default: 0,
    },
    totalSqFt: {
      type: Number,
      required: true,
      min: 0.01,
      default: 0,
    },
    ratePerDismil: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAgreementAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Farmers / Kisans list (One or more)
    farmers: [farmerSchema],

    // Buyers / Purchasers list (One or more)
    purchasers: [purchaserSchema],

    // Document & File Attachments (Unlimited)
    attachments: [landAttachmentSchema],

    // Registry Deeds converted from this Agreement
    registryDeeds: [registryDeedSchema],

    // Total Registered Area
    totalRegisteredDismil: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRegisteredSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Unregistered (Agreement Only) Land Stock
    unregisteredAgreedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    unregisteredAllocatedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    unregisteredAvailableSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Total Agreement Stock Pool (Registered + Unregistered)
    totalAllocatedSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAvailableSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PARTIALLY_REGISTERED', 'FULLY_REGISTERED', 'CLOSED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    remarks: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

kisanLandAgreementSchema.index({ mauja: 1 });
kisanLandAgreementSchema.index({ khataNumber: 1, khesraNumber: 1 });
kisanLandAgreementSchema.index({ 'landParcels.mauja': 1 });
kisanLandAgreementSchema.index({ 'landParcels.khataNumber': 1, 'landParcels.khesraNumber': 1 });
kisanLandAgreementSchema.index({ status: 1 });
kisanLandAgreementSchema.index({ 'registryDeeds.deedNumber': 1 });

module.exports = mongoose.model('KisanLandAgreement', kisanLandAgreementSchema);

