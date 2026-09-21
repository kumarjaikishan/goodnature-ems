const PlotRateConfiguration = require('../../models/PlotRateConfiguration');
const CommissionPolicyConfig = require('../../models/CommissionPolicyConfig');

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
      });
      await config.save();
    } else {
      let needsSave = false;
      if (!config.rateSlabs || config.rateSlabs.length === 0) {
        config.rateSlabs = PlotRateConfiguration.getDefaultRateSlabs();
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
    return config;
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
  async getCommissionPolicy(businessType = 'PLOT_SALE') {
    let policy = await CommissionPolicyConfig.findOne({ businessType, status: 'active' });
    const defaultData = businessType === 'PLOT_SALE'
      ? CommissionPolicyConfig.getDefaultPlotPolicy()
      : businessType === 'PLOT_PRODUCT'
      ? CommissionPolicyConfig.getDefaultPlotProductPolicy()
      : CommissionPolicyConfig.getDefaultInvestmentPolicy();

    if (!policy) {
      policy = new CommissionPolicyConfig(defaultData);
      await policy.save();
    } else {
      // Auto-migrate: ensure BRANCH_PARTNER exists if policy was saved previously
      const hasBranchPartner = (policy.roles || []).some((r) => r.roleName === 'BRANCH_PARTNER');
      if (!hasBranchPartner) {
        const branchPartnerDefault = defaultData.roles.find((r) => r.roleName === 'BRANCH_PARTNER');
        if (branchPartnerDefault) {
          policy.roles.push(branchPartnerDefault);
          await policy.save();
        }
      }
    }
    return policy;
  }

  async updateCommissionPolicy(businessType = 'PLOT_SALE', data) {
    let policy = await CommissionPolicyConfig.findOne({ businessType, status: 'active' });
    if (!policy) {
      policy = new CommissionPolicyConfig({ ...data, businessType, status: 'active' });
    } else {
      if (data.policyName) policy.policyName = data.policyName;
      if (data.validFrom !== undefined) policy.validFrom = data.validFrom;
      if (data.validTo !== undefined) policy.validTo = data.validTo;
      if (data.roles) policy.roles = data.roles;
    }
    await policy.save();
    return policy;
  }
}

module.exports = new PlotConfigService();
