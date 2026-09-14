const mongoose = require('mongoose');

const kisanSellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Farmer / Seller name is required'],
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
      uppercase: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      branch: { type: String, default: '' },
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
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

kisanSellerSchema.index({ name: 1 });
kisanSellerSchema.index({ mobile: 1 });
kisanSellerSchema.index({ aadhaarNumber: 1 });
kisanSellerSchema.index({ panNumber: 1 });

module.exports = mongoose.model('KisanSeller', kisanSellerSchema);
