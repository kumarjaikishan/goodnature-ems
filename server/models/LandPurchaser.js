const mongoose = require('mongoose');

const landPurchaserSchema = new mongoose.Schema(
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
      uppercase: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
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

landPurchaserSchema.index({ isDefault: -1 });
landPurchaserSchema.index({ name: 1 });

module.exports = mongoose.model('LandPurchaser', landPurchaserSchema);
