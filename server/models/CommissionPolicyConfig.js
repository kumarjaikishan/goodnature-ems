const mongoose = require('mongoose');

const extraIncentiveItemSchema = new mongoose.Schema(
  {
    columnId: { type: String, default: '' },
    label: { type: String, default: '' },
    percent: { type: Number, default: 0, min: 0 },
    rewardTitle: { type: String, default: '' },
  },
  { _id: false }
);

const targetSlabSchema = new mongoose.Schema(
  {
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, default: null }, // null means unlimited (e.g. 2500000+)
    fixedCommissionPercent: { type: Number, default: null },
    targetIncentivePercent: { type: Number, required: true, min: 0 },
    rewardPercent: { type: Number, default: 0, min: 0 },
    rewardTitle: { type: String, default: '' }, // e.g. "Motorcycle", "Car", "Laptop", "Foreign Tour"
    label: { type: String, default: '' },
    extraIncentives: [extraIncentiveItemSchema],
  },
  { _id: false }
);

const extraColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: 'Reward / Extra Incentive' },
  },
  { _id: false }
);

const rolePolicySchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      enum: ['BUSINESS_ASSOCIATE', 'BUSINESS_PARTNER', 'BRANCH_PARTNER'],
      required: true,
    },
    fixedCommissionPercent: { type: Number, required: true, min: 0 },
    extraColumns: [extraColumnSchema],
    targetSlabs: [targetSlabSchema],
  },
  { _id: false }
);

const DEFAULT_PLOT_POLICY = {
  policyName: 'PLOT_SALE_OCT_DEC_2026',
  businessType: 'PLOT_SALE',
  validFrom: new Date('2026-10-01T00:00:00.000Z'),
  validTo: new Date('2026-12-31T23:59:59.999Z'),
  roles: [
    {
      roleName: 'BUSINESS_ASSOCIATE',
      fixedCommissionPercent: 5.0,
      targetSlabs: [
        { minAmount: 1, maxAmount: 499999, targetIncentivePercent: 2.0, label: '1 - 4,99,999' },
        { minAmount: 500000, maxAmount: 999999, targetIncentivePercent: 3.0, label: '5,00,000 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1249999, targetIncentivePercent: 4.0, label: '10,00,000 - 12,49,999' },
        { minAmount: 1250000, maxAmount: 1499999, targetIncentivePercent: 5.0, label: '12,50,000 - 14,99,999' },
        { minAmount: 1500000, maxAmount: 1749999, targetIncentivePercent: 6.0, label: '15,00,000 - 17,49,999' },
        { minAmount: 1750000, maxAmount: 1999999, targetIncentivePercent: 7.0, label: '17,50,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2499999, targetIncentivePercent: 8.0, label: '20,00,000 - 24,99,999' },
        { minAmount: 2500000, maxAmount: null, targetIncentivePercent: 10.0, label: '25,00,000+' },
      ],
    },
    {
      roleName: 'BUSINESS_PARTNER',
      fixedCommissionPercent: 2.0,
      targetSlabs: [
        { minAmount: 1, maxAmount: 999999, targetIncentivePercent: 0.10, label: '1 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, targetIncentivePercent: 0.15, label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2449999, targetIncentivePercent: 0.25, label: '20,00,000 - 24,49,999' },
        { minAmount: 2500000, maxAmount: 2999999, targetIncentivePercent: 0.40, label: '25,00,000 - 29,99,999' },
        { minAmount: 3000000, maxAmount: 3499999, targetIncentivePercent: 0.55, label: '30,00,000 - 34,99,999' },
        { minAmount: 3500000, maxAmount: 3999999, targetIncentivePercent: 0.70, label: '35,00,000 - 39,99,999' },
        { minAmount: 4000000, maxAmount: 4999999, targetIncentivePercent: 0.85, label: '40,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, targetIncentivePercent: 1.00, label: '50,00,000+' },
      ],
    },
    {
      roleName: 'BRANCH_PARTNER',
      fixedCommissionPercent: 0.0,
      targetSlabs: [
        { minAmount: 1, maxAmount: 999999, targetIncentivePercent: 0.0, label: '1 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, targetIncentivePercent: 0.0, label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2999999, targetIncentivePercent: 0.0, label: '20,00,000 - 29,99,999' },
        { minAmount: 3000000, maxAmount: 4999999, targetIncentivePercent: 0.0, label: '30,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, targetIncentivePercent: 0.0, label: '50,00,000+' },
      ],
    },
  ],
};

const DEFAULT_INVESTMENT_POLICY = {
  policyName: 'INVESTMENT_RD_FD_OCT_DEC_2026',
  businessType: 'INVESTMENT_RD_FD',
  validFrom: new Date('2026-10-01T00:00:00.000Z'),
  validTo: new Date('2026-12-31T23:59:59.999Z'),
  roles: [
    {
      roleName: 'BUSINESS_ASSOCIATE',
      fixedCommissionPercent: 2.50,
      targetSlabs: [
        { minAmount: 1, maxAmount: 499999, targetIncentivePercent: 1.00, label: '1 - 4,99,999' },
        { minAmount: 500000, maxAmount: 999999, targetIncentivePercent: 1.50, label: '5,00,000 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1249999, targetIncentivePercent: 2.00, label: '10,00,000 - 12,49,999' },
        { minAmount: 1250000, maxAmount: 1499999, targetIncentivePercent: 2.50, label: '12,50,000 - 14,99,999' },
        { minAmount: 1500000, maxAmount: 1749999, targetIncentivePercent: 3.00, label: '15,00,000 - 17,49,999' },
        { minAmount: 1750000, maxAmount: 1999999, targetIncentivePercent: 3.50, label: '17,50,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2499999, targetIncentivePercent: 4.00, label: '20,00,000 - 24,99,999' },
        { minAmount: 2500000, maxAmount: null, targetIncentivePercent: 5.00, label: '25,00,000+' },
      ],
    },
    {
      roleName: 'BUSINESS_PARTNER',
      fixedCommissionPercent: 1.00,
      targetSlabs: [
        { minAmount: 1, maxAmount: 999999, targetIncentivePercent: 0.050, label: '1 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, targetIncentivePercent: 0.075, label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2449999, targetIncentivePercent: 0.125, label: '20,00,000 - 24,49,999' },
        { minAmount: 2500000, maxAmount: 2999999, targetIncentivePercent: 0.200, label: '25,00,000 - 29,99,999' },
        { minAmount: 3000000, maxAmount: 3499999, targetIncentivePercent: 0.275, label: '30,00,000 - 34,99,999' },
        { minAmount: 3500000, maxAmount: 3999999, targetIncentivePercent: 0.350, label: '35,00,000 - 39,99,999' },
        { minAmount: 4000000, maxAmount: 4999999, targetIncentivePercent: 0.425, label: '40,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, targetIncentivePercent: 0.500, label: '50,00,000+' },
      ],
    },
    {
      roleName: 'BRANCH_PARTNER',
      fixedCommissionPercent: 0.0,
      targetSlabs: [
        { minAmount: 1, maxAmount: 999999, targetIncentivePercent: 0.0, label: '1 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, targetIncentivePercent: 0.0, label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2999999, targetIncentivePercent: 0.0, label: '20,00,000 - 29,99,999' },
        { minAmount: 3000000, maxAmount: 4999999, targetIncentivePercent: 0.0, label: '30,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, targetIncentivePercent: 0.0, label: '50,00,000+' },
      ],
    },
  ],
};

const DEFAULT_PLOT_PRODUCT_POLICY = {
  policyName: 'PLOT_PRODUCT_OCT_DEC_2026',
  businessType: 'PLOT_PRODUCT',
  validFrom: new Date('2026-10-01T00:00:00.000Z'),
  validTo: new Date('2026-12-31T23:59:59.999Z'),
  roles: [
    {
      roleName: 'BUSINESS_ASSOCIATE',
      fixedCommissionPercent: 2.50,
      targetSlabs: [
        { minAmount: 1, maxAmount: 499999, targetIncentivePercent: 1.00, label: '1 - 4,99,999' },
        { minAmount: 500000, maxAmount: 999999, targetIncentivePercent: 1.50, label: '5,00,000 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1249999, targetIncentivePercent: 2.00, label: '10,00,000 - 12,49,999' },
        { minAmount: 1250000, maxAmount: 1499999, targetIncentivePercent: 2.50, label: '12,50,000 - 14,99,999' },
        { minAmount: 1500000, maxAmount: 1749999, targetIncentivePercent: 3.00, label: '15,00,000 - 17,49,999' },
        { minAmount: 1750000, maxAmount: 1999999, targetIncentivePercent: 3.50, label: '17,50,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2499999, targetIncentivePercent: 4.00, label: '20,00,000 - 24,99,999' },
        { minAmount: 2500000, maxAmount: null, targetIncentivePercent: 5.00, label: '25,00,000+' },
      ],
    },
    {
      roleName: 'BUSINESS_PARTNER',
      fixedCommissionPercent: 1.00,
      targetSlabs: [
        { minAmount: 1, maxAmount: 999999, targetIncentivePercent: 0.050, label: '1 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, targetIncentivePercent: 0.075, label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2449999, targetIncentivePercent: 0.125, label: '20,00,000 - 24,49,999' },
        { minAmount: 2500000, maxAmount: 2999999, targetIncentivePercent: 0.200, label: '25,00,000 - 29,99,999' },
        { minAmount: 3000000, maxAmount: 3499999, targetIncentivePercent: 0.275, label: '30,00,000 - 34,99,999' },
        { minAmount: 3500000, maxAmount: 3999999, targetIncentivePercent: 0.350, label: '35,00,000 - 39,99,999' },
        { minAmount: 4000000, maxAmount: 4999999, targetIncentivePercent: 0.425, label: '40,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, targetIncentivePercent: 0.500, label: '50,00,000+' },
      ],
    },
    {
      roleName: 'BRANCH_PARTNER',
      fixedCommissionPercent: 0.0,
      targetSlabs: [
        { minAmount: 1, maxAmount: 999999, targetIncentivePercent: 0.0, label: '1 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, targetIncentivePercent: 0.0, label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2999999, targetIncentivePercent: 0.0, label: '20,00,000 - 29,99,999' },
        { minAmount: 3000000, maxAmount: 4999999, targetIncentivePercent: 0.0, label: '30,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, targetIncentivePercent: 0.0, label: '50,00,000+' },
      ],
    },
  ],
};

const commissionPolicyConfigSchema = new mongoose.Schema(
  {
    policyName: { type: String, required: true, unique: true },
    businessType: {
      type: String,
      enum: ['PLOT_SALE', 'INVESTMENT_RD_FD', 'PLOT_PRODUCT'],
      required: true,
    },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    roles: [rolePolicySchema],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

commissionPolicyConfigSchema.statics.getDefaultPlotPolicy = function () {
  return DEFAULT_PLOT_POLICY;
};

commissionPolicyConfigSchema.statics.getDefaultInvestmentPolicy = function () {
  return DEFAULT_INVESTMENT_POLICY;
};

commissionPolicyConfigSchema.statics.getDefaultPlotProductPolicy = function () {
  return DEFAULT_PLOT_PRODUCT_POLICY;
};

/**
 * Match a given business volume against role target slabs.
 */
commissionPolicyConfigSchema.statics.resolveSlab = function (policyData, roleName, volumeAmount) {
  const roleConfig = (policyData.roles || []).find(r => r.roleName === roleName);
  if (!roleConfig) {
    return {
      fixedPercent: 0,
      incentivePercent: 0,
      totalPercent: 0,
      slabLabel: 'No Policy',
      nextSlabMin: null,
      nextSlabIncentive: null,
    };
  }

  const defaultFixed = Number(roleConfig.fixedCommissionPercent) || 0;
  const vol = Math.max(0, Number(volumeAmount) || 0);

  const slabs = roleConfig.targetSlabs || [];
  let matchedSlab = null;
  let nextSlab = null;

  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const isMinOk = vol >= s.minAmount;
    const isMaxOk = s.maxAmount === null || vol <= s.maxAmount;
    if (isMinOk && isMaxOk) {
      matchedSlab = s;
      nextSlab = slabs[i + 1] || null;
      break;
    }
  }

  // If below minimum slab (e.g. 0 volume)
  if (!matchedSlab) {
    if (slabs.length > 0 && vol < slabs[0].minAmount) {
      nextSlab = slabs[0];
    } else if (slabs.length > 0 && vol > (slabs[slabs.length - 1].maxAmount || Infinity)) {
      matchedSlab = slabs[slabs.length - 1];
    }
  }

  const fixedPercent = matchedSlab && matchedSlab.fixedCommissionPercent != null && matchedSlab.fixedCommissionPercent !== ''
    ? Number(matchedSlab.fixedCommissionPercent)
    : defaultFixed;

  const baseIncentivePercent = matchedSlab ? Number(matchedSlab.targetIncentivePercent) || 0 : 0;

  // Extra / Reward incentives calculation
  let extraIncentivePercent = 0;
  let rewardTitles = [];

  if (matchedSlab) {
    if (matchedSlab.rewardPercent) {
      extraIncentivePercent += Number(matchedSlab.rewardPercent) || 0;
    }
    if (matchedSlab.rewardTitle && String(matchedSlab.rewardTitle).trim()) {
      rewardTitles.push(String(matchedSlab.rewardTitle).trim());
    }
    if (Array.isArray(matchedSlab.extraIncentives)) {
      matchedSlab.extraIncentives.forEach((item) => {
        const p = Number(item?.percent) || 0;
        extraIncentivePercent += p;
        const itemTitle = item?.rewardTitle ? String(item.rewardTitle).trim() : '';
        if (itemTitle && !rewardTitles.includes(itemTitle)) {
          rewardTitles.push(itemTitle);
        }
      });
    }
  }

  const totalIncentivePercent = +(baseIncentivePercent + extraIncentivePercent).toFixed(3);
  const totalPercent = +(fixedPercent + totalIncentivePercent).toFixed(3);

  return {
    fixedPercent,
    baseIncentivePercent,
    extraIncentivePercent,
    incentivePercent: totalIncentivePercent,
    totalPercent,
    slabLabel: matchedSlab ? matchedSlab.label : 'Below Min Target',
    rewardTitle: rewardTitles.join(', '),
    currentSlab: matchedSlab,
    nextSlab: nextSlab,
    distanceToNextSlab: nextSlab ? Math.max(0, nextSlab.minAmount - vol) : 0,
  };
};

module.exports = mongoose.model('CommissionPolicyConfig', commissionPolicyConfigSchema);
