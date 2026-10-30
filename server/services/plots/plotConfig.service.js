const PlotRateConfiguration = require('../../models/PlotRateConfiguration');
const CommissionPolicyConfig = require('../../models/CommissionPolicyConfig');
const InvestmentSchemeConfig = require('../../models/InvestmentSchemeConfig');

class PlotConfigService {
  calculatePlotMultiplier(plotOrData, rateConfig) {
    if (plotOrData?.premiumHeads && Array.isArray(plotOrData.premiumHeads) && plotOrData.premiumHeads.length > 0) {
      const totalExtra = plotOrData.premiumHeads.reduce((sum, h) => sum + (Math.max(0, Number(h.extraPercent)) || 0), 0);
      return 1 + (totalExtra / 100);
    }
    if (plotOrData?.defaultPremiumHeads && Array.isArray(plotOrData.defaultPremiumHeads) && plotOrData.defaultPremiumHeads.length > 0) {
      const totalExtra = plotOrData.defaultPremiumHeads.reduce((sum, h) => sum + (Math.max(0, Number(h.extraPercent)) || 0), 0);
      return 1 + (totalExtra / 100);
    }
    if (plotOrData?.plotType === 'CORNER' || plotOrData?.defaultPlotType === 'CORNER') {
      const cornerExtra = rateConfig?.cornerExtraPercent !== undefined ? rateConfig.cornerExtraPercent : 20;
      return 1 + (cornerExtra / 100);
    }
    return 1;
  }

  calculatePlotTotalPremiumPercent(plotOrData, rateConfig) {
    if (plotOrData?.premiumHeads && Array.isArray(plotOrData.premiumHeads) && plotOrData.premiumHeads.length > 0) {
      return plotOrData.premiumHeads.reduce((sum, h) => sum + (Math.max(0, Number(h.extraPercent)) || 0), 0);
    }
    if (plotOrData?.defaultPremiumHeads && Array.isArray(plotOrData.defaultPremiumHeads) && plotOrData.defaultPremiumHeads.length > 0) {
      return plotOrData.defaultPremiumHeads.reduce((sum, h) => sum + (Math.max(0, Number(h.extraPercent)) || 0), 0);
    }
    if (plotOrData?.plotType === 'CORNER' || plotOrData?.defaultPlotType === 'CORNER') {
      return rateConfig?.cornerExtraPercent !== undefined ? rateConfig.cornerExtraPercent : 20;
    }
    return 0;
  }

  // ── RATE CONFIGURATION ──────────────────────────────────────────
  async getRateConfig() {
    let config = await PlotRateConfiguration.findOne({ status: 'active' });
    if (!config) {
      config = new PlotRateConfiguration({
        baseSqFtRate: 1000,
        cornerExtraPercent: 20,
        premiumHeads: PlotRateConfiguration.getDefaultPremiumHeads(),
        interestRatePercent: 10.88,
        dpGracePeriodDays: 15,
        emiGracePeriodDays: 15,
        lateFineGraceDays: 15,
        lateFineFrequency: 'YEARLY',
        lateFineRate: 24,
        lateFineDailyPercent: 24 / 365,
        rateSlabs: PlotRateConfiguration.getDefaultRateSlabs(),
        emiTenureAdjustments: PlotRateConfiguration.getDefaultEmiTenureAdjustments(),
      });
      await config.save();
    } else {
      let needsSave = false;
      if (!config.rateSlabs || config.rateSlabs.length === 0) {
        config.rateSlabs = PlotRateConfiguration.getDefaultRateSlabs();
        needsSave = true;
      }
      if (!config.emiTenureAdjustments || config.emiTenureAdjustments.length === 0) {
        config.emiTenureAdjustments = PlotRateConfiguration.getDefaultEmiTenureAdjustments();
        needsSave = true;
      }
      if (!config.premiumHeads || config.premiumHeads.length === 0) {
        config.premiumHeads = PlotRateConfiguration.getDefaultPremiumHeads();
        needsSave = true;
      }
      if (config.interestRatePercent === undefined || config.interestRatePercent === null) {
        config.interestRatePercent = 10.88;
        needsSave = true;
      }
      if (config.dpGracePeriodDays === undefined || config.dpGracePeriodDays === null) {
        config.dpGracePeriodDays = config.lateFineGraceDays ?? 15;
        needsSave = true;
      }
      if (config.emiGracePeriodDays === undefined || config.emiGracePeriodDays === null) {
        config.emiGracePeriodDays = config.lateFineGraceDays ?? 15;
        needsSave = true;
      }
      if (config.lateFineGraceDays === undefined || config.lateFineGraceDays === null) {
        config.lateFineGraceDays = 15;
        needsSave = true;
      }
      if (config.lateFineFrequency === undefined || config.lateFineFrequency === null) {
        config.lateFineFrequency = 'YEARLY';
        needsSave = true;
      }
      if (config.lateFineRate === undefined || config.lateFineRate === null) {
        config.lateFineRate = 24;
        needsSave = true;
      }
      if (config.lateFineDailyPercent === undefined || config.lateFineDailyPercent === null) {
        config.lateFineDailyPercent = 24 / 365;
        needsSave = true;
      }
      if (needsSave) {
        await config.save();
      }
    }
    const configObj = config.toObject ? config.toObject() : { ...config };
    try {
      const schemeConfig = await InvestmentSchemeConfig.findOne({ status: 'active' }).lean();
      if (schemeConfig && Array.isArray(schemeConfig.slabs)) {
        configObj.schemeSlabs = schemeConfig.slabs.map((s) => ({
          planName: s.planName || '',
          planType:
            s.planType ||
            (Number(s.rdMaturityPercent) === 0 && Number(s.fdMaturityPercent) === 0
              ? 'REGISTRY_SALE'
              : 'INVESTMENT_BUYBACK'),
          annualInterestRate: s.annualInterestRate ?? s.rdAnnualInterestRate ?? 10.5,
          rdAnnualInterestRate: s.rdAnnualInterestRate ?? s.annualInterestRate ?? 10.5,
          fdAnnualInterestRate: s.fdAnnualInterestRate ?? s.annualInterestRate ?? 10.5,
          tenureMonths: s.tenureMonths,
          rdMaturityPercent: s.rdMaturityPercent,
          fdMaturityPercent: s.fdMaturityPercent,
          rdPromoterCommissionPercent: Number(s.rdPromoterCommissionPercent ?? 4.0),
          fdPromoterCommissionPercent: Number(s.fdPromoterCommissionPercent ?? 5.0),
          bpRdCommissionPercent: Number(s.bpRdCommissionPercent ?? 1.0),
          bpFdCommissionPercent: Number(s.bpFdCommissionPercent ?? 1.0),
          branchRdCommissionPercent: Number(s.branchRdCommissionPercent ?? 0),
          branchFdCommissionPercent: Number(s.branchFdCommissionPercent ?? 0),
          developerCommissionPercent: Number(s.developerCommissionPercent ?? 1.0),
          showInAddBooking: Boolean(s.showInAddBooking),
        }));
      }
    } catch (err) {
      console.error('Error attaching schemeSlabs to rateConfig:', err);
    }
    return configObj;
  }

  async updateRateConfig(data) {
    let config = await PlotRateConfiguration.findOne({ status: 'active' });
    if (!config) {
      config = new PlotRateConfiguration(data);
    } else {
      config.baseSqFtRate = data.baseSqFtRate ?? config.baseSqFtRate;
      config.cornerExtraPercent = data.cornerExtraPercent ?? config.cornerExtraPercent;
      if (data.premiumHeads && Array.isArray(data.premiumHeads)) {
        config.premiumHeads = data.premiumHeads.map(h => ({
          name: (h.name || '').trim(),
          extraPercent: Math.max(0, Number(h.extraPercent) || 0),
          description: h.description || '',
        })).filter(h => h.name);
      }
      config.interestRatePercent = data.interestRatePercent !== undefined ? Number(data.interestRatePercent) : (config.interestRatePercent ?? 10.88);
      if (data.dpGracePeriodDays !== undefined) {
        config.dpGracePeriodDays = Math.max(0, Number(data.dpGracePeriodDays) || 0);
      }
      if (data.emiGracePeriodDays !== undefined) {
        config.emiGracePeriodDays = Math.max(0, Number(data.emiGracePeriodDays) || 0);
        config.lateFineGraceDays = config.emiGracePeriodDays;
      } else if (data.lateFineGraceDays !== undefined) {
        config.lateFineGraceDays = Math.max(0, Number(data.lateFineGraceDays) || 0);
        config.emiGracePeriodDays = config.lateFineGraceDays;
      }
      if (data.lateFineFrequency !== undefined) {
        config.lateFineFrequency = ['DAILY', 'MONTHLY', 'YEARLY'].includes(data.lateFineFrequency) ? data.lateFineFrequency : 'YEARLY';
      }
      if (data.lateFineRate !== undefined) {
        config.lateFineRate = Math.max(0, Number(data.lateFineRate) || 0);
        if (config.lateFineFrequency === 'YEARLY') {
          config.lateFineDailyPercent = config.lateFineRate / 365;
        } else if (config.lateFineFrequency === 'MONTHLY') {
          config.lateFineDailyPercent = config.lateFineRate / 30;
        } else {
          config.lateFineDailyPercent = config.lateFineRate;
        }
      } else if (data.lateFineDailyPercent !== undefined) {
        config.lateFineDailyPercent = Math.max(0, Number(data.lateFineDailyPercent) || 0);
      }
      if (data.rateSlabs && Array.isArray(data.rateSlabs)) {
        config.rateSlabs = data.rateSlabs;
      }
      if (data.emiTenureAdjustments && Array.isArray(data.emiTenureAdjustments)) {
        config.emiTenureAdjustments = data.emiTenureAdjustments
          .filter(a => Number(a.tenureMonths) >= 0)
          .map(a => ({
            tenureMonths: Number(a.tenureMonths),
            action: a.action === 'DEDUCT' ? 'DEDUCT' : 'ADD',
            percentage: Math.max(0, Math.min(100, Number(a.percentage) || 0)),
          }))
          .sort((a, b) => a.tenureMonths - b.tenureMonths);
      }
    }
    await config.save();

    // Sync global defaults to series masters
    const PlotSeriesMaster = require('../../models/PlotSeriesMaster');
    await PlotSeriesMaster.updateMany(
      {},
      {
        $set: {
          dpGracePeriodDays: config.dpGracePeriodDays,
          emiGracePeriodDays: config.emiGracePeriodDays,
          gracePeriodDays: config.emiGracePeriodDays,
          lateFineRate: config.lateFineRate,
          lateFineFrequency: config.lateFineFrequency,
          lateFineDailyPercent: config.lateFineDailyPercent,
        }
      }
    );

    return config;
  }

  // ── COMMISSION POLICY CONFIGURATION ─────────────────────────────
  async getCommissionPolicy(businessType = 'PLOT_PRODUCT') {
    const defaultData = CommissionPolicyConfig.getDefaultCommissionPolicy();
    let policy = await CommissionPolicyConfig.findOne({
      businessType: { $in: [businessType, 'PLOT_PRODUCT', 'PLOT_SALE'] },
      status: 'active',
    }).sort({ updatedAt: -1 });

    if (!policy) {
      policy = new CommissionPolicyConfig({ ...defaultData, businessType, status: 'active' });
      await policy.save();
      return policy;
    }

    // Auto-migrate legacy policies if they don't match the new scale (1 - 1,99,999 @ 1.0%)
    const baRole = (policy.roles || []).find((r) => r.roleName === 'BUSINESS_ASSOCIATE');
    const isLegacySlab = !baRole || !Array.isArray(baRole.targetSlabs) || baRole.targetSlabs.length !== 6 || baRole.targetSlabs[0]?.maxAmount !== 199999;

    if (isLegacySlab) {
      policy.roles = defaultData.roles;
      policy.policyName = defaultData.policyName;
      await policy.save();

      await CommissionPolicyConfig.updateMany(
        { status: 'active' },
        { $set: { roles: defaultData.roles } }
      );
    }

    return policy;
  }

  async updateCommissionPolicy(businessType = 'PLOT_PRODUCT', data) {
    const defaultData = CommissionPolicyConfig.getDefaultCommissionPolicy();
    const policyData = {
      policyName: data.policyName || defaultData.policyName,
      validFrom: data.validFrom !== undefined ? data.validFrom : defaultData.validFrom,
      validTo: data.validTo !== undefined ? data.validTo : defaultData.validTo,
      roles: data.roles || defaultData.roles,
      status: 'active',
    };

    // Keep all policy collections (PLOT_PRODUCT, PLOT_SALE, INVESTMENT_RD_FD) completely synced to this single unified policy
    const businessTypesToSync = ['PLOT_PRODUCT', 'PLOT_SALE', 'INVESTMENT_RD_FD'];
    let primaryPolicy = null;

    for (const bType of businessTypesToSync) {
      let pol = await CommissionPolicyConfig.findOne({ businessType: bType, status: 'active' });
      if (!pol) {
        pol = new CommissionPolicyConfig({ ...policyData, businessType: bType });
      } else {
        pol.policyName = `${policyData.policyName}_${bType}`;
        if (policyData.validFrom !== undefined) pol.validFrom = policyData.validFrom;
        if (policyData.validTo !== undefined) pol.validTo = policyData.validTo;
        if (policyData.roles) pol.roles = policyData.roles;
      }
      await pol.save();
      if (bType === businessType || !primaryPolicy) {
        primaryPolicy = pol;
      }
    }

    return primaryPolicy;
  }
}

module.exports = new PlotConfigService();
