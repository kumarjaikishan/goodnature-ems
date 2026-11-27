import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Award, Sliders } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Subcomponents
import ProductSchemeRulesTab from './components/ProductSchemeRulesTab';
import CommissionPolicyMatrix from '../seriesMaster/components/CommissionPolicyMatrix';
import ProductEmiTenureSlabsTab from './components/ProductEmiTenureSlabsTab';

const VALID_TABS = ['schemes', 'incentives', 'emi_slabs'];

const PlanAndRatesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab synced with URL query (?tab=schemes|incentives|emi_slabs)
  const tabFromUrl = searchParams.get('tab');
  const initialTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'schemes';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl || !VALID_TABS.includes(tabFromUrl)) {
      setActiveTab('schemes');
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'schemes') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <SlidersHorizontal size={22} />
            </span>
            Plan &amp; Rates
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Configure customer returns, scheme rules matrix, target commission policies, and EMI tenure rate slabs.
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('schemes')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'schemes'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal size={16} /> Scheme Rules &amp; Returns Matrix
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('incentives')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'incentives'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={16} className="text-teal-700" /> Target &amp; Extra Incentive Policy
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('emi_slabs')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'emi_slabs'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={16} className="text-teal-700" /> EMI Tenure Slabs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'schemes' && (
        <ProductSchemeRulesTab />
      )}
      {activeTab === 'incentives' && (
        <CommissionPolicyMatrix
          initialBusinessType="PLOT_PRODUCT"
          showTypeToggle={false}
          hideFixedCommission={true}
          title="Target Incentive & Extra Incentive Policy"
          subtitle="Configure period closing collection target slabs, tiered performance incentive %, and milestone rewards for Business Associates, Business Partners, and Branch Partners across all sales (Plot Bookings & Investment Bookings)."
        />
      )}
      {activeTab === 'emi_slabs' && (
        <ProductEmiTenureSlabsTab />
      )}
    </div>
  );
};

export default PlanAndRatesPage;
