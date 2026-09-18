import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Search, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none font-medium';

export const StepCustomer = ({
  nextStep,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  selectCustomer,
  selectedCustomer,
  setSelectedCustomer,
  setForm,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClear = () => {
    setSearchQuery('');
    if (setSelectedCustomer) setSelectedCustomer(null);
    if (setSearchResults) setSearchResults([]);
    setShowDropdown(false);
    setForm((f) => ({ ...f, customerId: '', sponsorId: '' }));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCustomerSelect = (cust) => {
    selectCustomer(cust);
    setShowDropdown(false);
    if (setSearchResults) setSearchResults([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(true);
    if (selectedCustomer && val.trim().toLowerCase() !== selectedCustomer.name?.trim().toLowerCase()) {
      if (setSelectedCustomer) setSelectedCustomer(null);
      setForm((f) => ({ ...f, customerId: '', sponsorId: '' }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <h3 className="text-base font-bold text-slate-800">1. Select Plot Customer</h3>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/plots/customers/new"
            className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <UserPlus size={14} /> Register Customer
          </Link>
          <Button variant="primary" size="sm" onClick={nextStep} endIcon={ChevronRight}>
            Next: Choose Plot
          </Button>
        </div>
      </div>

      {/* Customer Search Bar */}
      <div className="relative" ref={containerRef}>
        <label className={labelCls}>Search Existing Customer</label>
        <div className="relative">
          <input
            ref={inputRef}
            className={`${inputCls} pl-10 pr-10`}
            placeholder="Search by name, customer ID, or mobile number..."
            value={searchQuery}
            onFocus={() => {
              if (!selectedCustomer && searchResults && searchResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            onChange={handleInputChange}
          />
          <Search size={18} className="text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          {(searchQuery || selectedCustomer) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
              title="Clear customer selection"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Dropdown Results */}
        {showDropdown && !selectedCustomer && searchResults && searchResults.length > 0 && (
          <div className="absolute z-30 top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
            {searchResults.map((cust) => (
              <div
                key={cust._id}
                onClick={() => handleCustomerSelect(cust)}
                className="p-3 hover:bg-teal-50/70 cursor-pointer flex items-center justify-between text-xs transition"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{cust.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {cust.customerCode || cust.customerId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 font-medium block">{cust.mobile}</span>
                  <span className="text-[10px] text-teal-700 font-bold uppercase">
                    {cust.sponsorId?.name ? `Sponsor: ${cust.sponsorId.name}` : 'Direct Customer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Customer Card Preview */}
      {selectedCustomer ? (
        <div className="bg-teal-50/50 border border-teal-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</h4>
              <p className="text-xs text-teal-700 font-mono font-bold">
                {selectedCustomer.customerCode || selectedCustomer.customerId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-600 font-medium">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Mobile</span>
              <span className="font-semibold text-slate-800">{selectedCustomer.mobile}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Sponsor / Agent</span>
              <span className="font-semibold text-slate-800">
                {selectedCustomer.sponsorId
                  ? `${selectedCustomer.sponsorId.name} (${selectedCustomer.sponsorId.sponsorCode || ''})`
                  : 'Direct (Company)'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg font-bold ml-auto cursor-pointer flex items-center gap-1 transition"
            >
              <X size={14} /> Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-300 p-8 rounded-xl text-center">
          <p className="text-xs text-slate-500 font-medium">
            No customer selected. Search and select a registered customer above, or click "Register Customer".
          </p>
        </div>
      )}
    </div>
  );
};
