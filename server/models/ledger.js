const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // Optional for employee ledgers
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For sponsor ledgers
  kisanSellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'KisanSeller' }, // For Kisan / Seller ledgers
  assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For user personal cash ledgers
  empId: { type: String }, // Human readable ID for employee ledgers, sponsorCode, or account number
  name: { type: String, required: true },
  profileImage: { type: String },
  ledgerType: { 
    type: String, 
    enum: ['employee', 'custom', 'sponsor', 'kisan', 'bank', 'user_cash'], 
    default: 'custom' 
  },
  // Bank Account Specific Fields
  bankName: { type: String, trim: true, default: '' },
  accountNumber: { type: String, trim: true, default: '' },
  ifscCode: { type: String, trim: true, uppercase: true, default: '' },
  branchName: { type: String, trim: true, default: '' },
  accountType: { 
    type: String, 
    enum: ['CURRENT', 'SAVINGS', 'OVERDRAFT', 'CASH', 'OTHER'], 
    default: 'CURRENT' 
  },
  openingBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isVoucherLedger: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Creator/Owner
  // Summary field for quick access (Running Balance)
  advance: { type: Number, default: 0 }
}, { timestamps: true });

ledgerSchema.index({ employeeId: 1 });
ledgerSchema.index({ sponsorId: 1 });
ledgerSchema.index({ kisanSellerId: 1 });
ledgerSchema.index({ assignedUserId: 1 });
ledgerSchema.index({ ledgerType: 1, status: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
