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

const extraSlabSchema = new mongoose.Schema(
  {
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, default: null }, // null means unlimited (e.g. 5000000+)
    extraIncentivePercent: { type: Number, default: 0, min: 0 },
    rewardTitle: { type: String, default: '' }, // e.g. "Motorcycle", "Car", "Laptop", "Foreign Tour"
    label: { type: String, default: '' },
    extraIncentives: [extraIncentiveItemSchema],
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
    extraSlabs: [extraSlabSchema],
  },
  { _id: false }
);

const UNIFIED_COMMISSION_POLICY = {
  policyName: 'COMMISSION_POLICY_2026',
  businessType: 'PLOT_PRODUCT',
  validFrom: new Date('2026-10-01T00:00:00.000Z'),
  validTo: new Date('2026-12-31T23:59:59.999Z'),
  roles: [
    {
      roleName: 'BUSINESS_ASSOCIATE',
      fixedCommissionPercent: 0.0,
      extraColumns: [
        { id: 'col_reward_1', label: 'Reward / Extra Incentive' }
      ],
      targetSlabs: [
        { minAmount: 1, maxAmount: 199999, targetIncentivePercent: 1.0, label: '1 - 1,99,999' },
        { minAmount: 200000, maxAmount: 299999, targetIncentivePercent: 1.2, label: '2,00,000 - 2,99,999' },
        { minAmount: 300000, maxAmount: 399999, targetIncentivePercent: 1.4, label: '3,00,000 - 3,99,999' },
        { minAmount: 400000, maxAmount: 499999, targetIncentivePercent: 1.6, label: '4,00,000 - 4,99,999' },
        { minAmount: 500000, maxAmount: 599999, targetIncentivePercent: 1.8, label: '5,00,000 - 5,99,999' },
        { minAmount: 600000, maxAmount: null, targetIncentivePercent: 2.0, label: '6,00,000 & Above' },
      ],
      extraSlabs: [
        {
          minAmount: 1,
          maxAmount: 799999,
          extraIncentivePercent: 0.5,
          rewardTitle: 'Motorcycle / Laptop',
          label: '1 - 7,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.5, rewardTitle: 'Motorcycle / Laptop' }],
        },
        {
          minAmount: 800000,
          maxAmount: 1199999,
          extraIncentivePercent: 0.6,
          rewardTitle: 'Goa / Thailand Tour',
          label: '8,00,000 - 11,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.6, rewardTitle: 'Goa / Thailand Tour' }],
        },
        {
          minAmount: 1200000,
          maxAmount: 1599999,
          extraIncentivePercent: 0.7,
          rewardTitle: 'Luxury Car / Gold Fund',
          label: '12,00,000 - 15,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.7, rewardTitle: 'Luxury Car / Gold Fund' }],
        },
        {
          minAmount: 1600000,
          maxAmount: 1999999,
          extraIncentivePercent: 0.8,
          rewardTitle: 'Executive Bonus',
          label: '16,00,000 - 19,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.8, rewardTitle: 'Executive Bonus' }],
        },
        {
          minAmount: 2000000,
          maxAmount: 2399999,
          extraIncentivePercent: 0.9,
          rewardTitle: 'Leadership Bonus',
          label: '20,00,000 - 23,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.9, rewardTitle: 'Leadership Bonus' }],
        },
        {
          minAmount: 2400000,
          maxAmount: null,
          extraIncentivePercent: 1.0,
          rewardTitle: 'Crown Director Club',
          label: '24,00,000 & Above',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 1.0, rewardTitle: 'Crown Director Club' }],
        },
      ],
    },
    {
      roleName: 'BUSINESS_PARTNER',
      fixedCommissionPercent: 0.0,
      extraColumns: [
        { id: 'col_reward_1', label: 'Reward / Extra Incentive' }
      ],
      targetSlabs: [
        { minAmount: 1, maxAmount: 399999, targetIncentivePercent: 0.5, label: '1 - 3,99,999' },
        { minAmount: 400000, maxAmount: 599999, targetIncentivePercent: 0.6, label: '4,00,000 - 5,99,999' },
        { minAmount: 600000, maxAmount: 799999, targetIncentivePercent: 0.7, label: '6,00,000 - 7,99,999' },
        { minAmount: 800000, maxAmount: 999999, targetIncentivePercent: 0.8, label: '8,00,000 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1199999, targetIncentivePercent: 0.9, label: '10,00,000 - 11,99,999' },
        { minAmount: 1200000, maxAmount: null, targetIncentivePercent: 1.0, label: '12,00,000 & Above' },
      ],
      extraSlabs: [
        {
          minAmount: 1,
          maxAmount: 1599999,
          extraIncentivePercent: 0.25,
          rewardTitle: 'Foreign Tour',
          label: '1 - 15,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.25, rewardTitle: 'Foreign Tour' }],
        },
        {
          minAmount: 1600000,
          maxAmount: 2399999,
          extraIncentivePercent: 0.30,
          rewardTitle: 'SUV / Luxury Car',
          label: '16,00,000 - 23,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.30, rewardTitle: 'SUV / Luxury Car' }],
        },
        {
          minAmount: 2400000,
          maxAmount: 3199999,
          extraIncentivePercent: 0.35,
          rewardTitle: 'Flat / Villa Bonus',
          label: '24,00,000 - 31,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.35, rewardTitle: 'Flat / Villa Bonus' }],
        },
        {
          minAmount: 3200000,
          maxAmount: 3999999,
          extraIncentivePercent: 0.40,
          rewardTitle: 'Partner Elite Shield',
          label: '32,00,000 - 39,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.40, rewardTitle: 'Partner Elite Shield' }],
        },
        {
          minAmount: 4000000,
          maxAmount: 4799999,
          extraIncentivePercent: 0.45,
          rewardTitle: 'Partner Sovereign Award',
          label: '40,00,000 - 47,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.45, rewardTitle: 'Partner Sovereign Award' }],
        },
        {
          minAmount: 4800000,
          maxAmount: null,
          extraIncentivePercent: 0.50,
          rewardTitle: 'Chairman Circle Partner',
          label: '48,00,000 & Above',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.50, rewardTitle: 'Chairman Circle Partner' }],
        },
      ],
    },
    {
      roleName: 'BRANCH_PARTNER',
      fixedCommissionPercent: 0.0,
      extraColumns: [
        { id: 'col_reward_1', label: 'Reward / Extra Incentive' }
      ],
      targetSlabs: [
        { minAmount: 1, maxAmount: 799999, targetIncentivePercent: 0.5, label: '1 - 7,99,999' },
        { minAmount: 800000, maxAmount: 1199999, targetIncentivePercent: 0.6, label: '8,00,000 - 11,99,999' },
        { minAmount: 1200000, maxAmount: 1599999, targetIncentivePercent: 0.7, label: '12,00,000 - 15,99,999' },
        { minAmount: 1600000, maxAmount: 1999999, targetIncentivePercent: 0.8, label: '16,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 2399999, targetIncentivePercent: 0.9, label: '20,00,000 - 23,99,999' },
        { minAmount: 2400000, maxAmount: null, targetIncentivePercent: 1.0, label: '24,00,000 & Above' },
      ],
      extraSlabs: [
        {
          minAmount: 1,
          maxAmount: 3199999,
          extraIncentivePercent: 0.25,
          rewardTitle: 'Branch Product Trophy',
          label: '1 - 31,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.25, rewardTitle: 'Branch Product Trophy' }],
        },
        {
          minAmount: 3200000,
          maxAmount: 4799999,
          extraIncentivePercent: 0.30,
          rewardTitle: 'Branch Star Trophy & Bonus',
          label: '32,00,000 - 47,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.30, rewardTitle: 'Branch Star Trophy & Bonus' }],
        },
        {
          minAmount: 4800000,
          maxAmount: 6499999,
          extraIncentivePercent: 0.35,
          rewardTitle: 'Regional Top Branch Trophy',
          label: '48,00,000 - 64,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.35, rewardTitle: 'Regional Top Branch Trophy' }],
        },
        {
          minAmount: 6500000,
          maxAmount: 7999999,
          extraIncentivePercent: 0.40,
          rewardTitle: 'Excellence Shield',
          label: '65,00,000 - 79,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.40, rewardTitle: 'Excellence Shield' }],
        },
        {
          minAmount: 8000000,
          maxAmount: 9999999,
          extraIncentivePercent: 0.45,
          rewardTitle: 'State Leadership Trophy',
          label: '80,00,000 - 99,99,999',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.45, rewardTitle: 'State Leadership Trophy' }],
        },
        {
          minAmount: 10000000,
          maxAmount: null,
          extraIncentivePercent: 0.50,
          rewardTitle: 'National Champion Branch Award',
          label: '1,00,00,000 & Above',
          extraIncentives: [{ columnId: 'col_reward_1', label: 'Reward / Extra Incentive', percent: 0.50, rewardTitle: 'National Champion Branch Award' }],
        },
      ],
    },
  ],
};

const DEFAULT_PLOT_POLICY = UNIFIED_COMMISSION_POLICY;
const DEFAULT_INVESTMENT_POLICY = UNIFIED_COMMISSION_POLICY;
const DEFAULT_PLOT_PRODUCT_POLICY = UNIFIED_COMMISSION_POLICY;

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

commissionPolicyConfigSchema.statics.getDefaultCommissionPolicy = function () {
  return UNIFIED_COMMISSION_POLICY;
};

commissionPolicyConfigSchema.statics.getDefaultPlotPolicy = function () {
  return UNIFIED_COMMISSION_POLICY;
};

commissionPolicyConfigSchema.statics.getDefaultInvestmentPolicy = function () {
  return UNIFIED_COMMISSION_POLICY;
};

commissionPolicyConfigSchema.statics.getDefaultPlotProductPolicy = function () {
  return UNIFIED_COMMISSION_POLICY;
};

/**
 * Match a given business volume against role target or extra slabs.
 * @param {Object} policyData
 * @param {String} roleName
 * @param {Number} volumeAmount
 * @param {Boolean} isExtra - true if resolving for Extra Incentive / Campaign rewards closing
 */
commissionPolicyConfigSchema.statics.resolveSlab = function (policyData, roleName, volumeAmount, isExtra = false) {
  const roleConfig = (policyData.roles || []).find(r => r.roleName === roleName);
  if (!roleConfig) {
    return {
      fixedPercent: 0,
      baseIncentivePercent: 0,
      extraIncentivePercent: 0,
      incentivePercent: 0,
      totalPercent: 0,
      slabLabel: 'No Policy',
      rewardTitle: '',
      nextSlabMin: null,
      nextSlabIncentive: null,
    };
  }

  const defaultFixed = Number(roleConfig.fixedCommissionPercent) || 0;
  const vol = Math.max(0, Number(volumeAmount) || 0);

  // Slabs array based on whether this is an Extra Incentive or Target Incentive resolution
  const slabs = (isExtra && Array.isArray(roleConfig.extraSlabs) && roleConfig.extraSlabs.length > 0)
    ? roleConfig.extraSlabs
    : (roleConfig.targetSlabs || []);

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

  // If below minimum slab or beyond maximum slab
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

  const baseIncentivePercent = matchedSlab ? (Number(matchedSlab.targetIncentivePercent) || 0) : 0;

  // Extra / Reward incentives calculation
  let extraIncentivePercent = 0;
  let rewardTitles = [];

  if (matchedSlab) {
    if (matchedSlab.rewardTitle && String(matchedSlab.rewardTitle).trim()) {
      rewardTitles.push(String(matchedSlab.rewardTitle).trim());
    }

    if (Array.isArray(matchedSlab.extraIncentives) && matchedSlab.extraIncentives.length > 0) {
      matchedSlab.extraIncentives.forEach((item) => {
        const p = Number(item?.percent) || 0;
        extraIncentivePercent += p;
        const itemTitle = item?.rewardTitle ? String(item.rewardTitle).trim() : '';
        if (itemTitle && !rewardTitles.includes(itemTitle)) {
          rewardTitles.push(itemTitle);
        }
      });
    } else {
      if (matchedSlab.extraIncentivePercent != null) {
        extraIncentivePercent = Number(matchedSlab.extraIncentivePercent) || 0;
      } else if (matchedSlab.rewardPercent != null) {
        extraIncentivePercent = Number(matchedSlab.rewardPercent) || 0;
      }
    }
  }

  const effectiveIncentivePercent = isExtra ? extraIncentivePercent : baseIncentivePercent;
  const totalPercent = +(fixedPercent + effectiveIncentivePercent).toFixed(3);

  const formatSlabRange = (s) => {
    if (!s) return 'Below Min Target';
    const minVal = Number(s.minAmount || 0);
    const minStr = `₹${minVal.toLocaleString('en-IN')}`;
    if (s.maxAmount === null || s.maxAmount === '' || s.maxAmount === undefined || s.maxAmount === 'unlimited') {
      return `${minStr} & Above`;
    }
    const maxVal = Number(s.maxAmount);
    return `${minStr} - ₹${maxVal.toLocaleString('en-IN')}`;
  };

  return {
    fixedPercent,
    baseIncentivePercent,
    extraIncentivePercent,
    incentivePercent: effectiveIncentivePercent,
    totalPercent,
    slabLabel: formatSlabRange(matchedSlab),
    rewardTitle: rewardTitles.join(', '),
    currentSlab: matchedSlab,
    nextSlab: nextSlab,
    distanceToNextSlab: nextSlab ? Math.max(0, nextSlab.minAmount - vol) : 0,
  };
};

module.exports = mongoose.model('CommissionPolicyConfig', commissionPolicyConfigSchema);
