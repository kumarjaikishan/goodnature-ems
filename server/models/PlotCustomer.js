const mongoose = require('mongoose');

const plotCustomerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  address: {
    type: String,
    default: '',
  },
  currentAddress: {
    type: String,
    default: '',
  },
  permanentAddress: {
    type: String,
    default: '',
  },
  sameAsCurrentAddress: {
    type: Boolean,
    default: false,
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  pincode: {
    type: String,
    default: '',
  },
  fatherOrHusbandName: {
    type: String,
    default: '',
  },
  relationType: {
    type: String,
    default: 'Son of',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  },
  age: {
    type: Number,
  },
  dob: {
    type: String,
    default: '',
  },
  occupation: {
    type: String,
    default: '',
  },
  panCard: {
    type: String,
    default: '',
  },
  aadhaarCard: {
    type: String,
    default: '',
  },
  nomineeName: {
    type: String,
    default: '',
  },
  nomineeRelation: {
    type: String,
    default: '',
  },
  nomineeAge: {
    type: Number,
  },
  // Bank Details
  accountHolderName: {
    type: String,
    default: '',
  },
  bankName: {
    type: String,
    default: '',
  },
  bankBranch: {
    type: String,
    default: '',
  },
  accountNumber: {
    type: String,
    default: '',
  },
  photo: {
    type: String,
    default: '',
  },
  signature: {
    type: String,
    default: '',
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

plotCustomerSchema.virtual('customerCode').get(function () {
  return this.customerId;
});
plotCustomerSchema.set('toJSON', { virtuals: true });
plotCustomerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PlotCustomer', plotCustomerSchema);
