import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useApi } from '../../utils/useApi';
import { HiOutlineArrowLeft, HiCheckCircle, HiOutlineUserPlus } from 'react-icons/hi2';
import { CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

const PlotCustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    sponsorId: '',
    name: '',
    email: '',
    mobile: '',
    password: '',
    gender: 'Male',
    age: '',
    relationType: 'Son of',
    fatherOrHusbandName: '',
    currentAddress: '',
    permanentAddress: '',
    sameAsCurrentAddress: false,
    aadhaarCard: '',
    panCard: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeAge: '',
    // Bank Details
    accountHolderName: '',
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    ifscCode: '',
  };

  const [formState, setFormState] = useState(initialFormState);
  const { request, loading: submitLoading } = useApi();

  useEffect(() => {
    fetchSponsors();
    if (isEdit) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchSponsors = async () => {
    try {
      const res = await apiClient({
        url: 'plots/sponsors',
      });
      setSponsors(res.data || res.sponsors || res || []);
    } catch (err) {
      console.error('Failed to load sponsors:', err);
    }
  };

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient({
        url: `plots/customers/${id}`,
      });
      const customer = res.data || res.customer || res;
      if (customer && customer._id) {
        setFormState({
          sponsorId: customer.sponsorId?._id || customer.sponsorId || '',
          name: customer.name || '',
          email: customer.email || '',
          mobile: customer.mobile || '',
          password: '',
          gender: customer.gender || 'Male',
          age: customer.age || '',
          relationType: customer.relationType || 'Son of',
          fatherOrHusbandName: customer.fatherOrHusbandName || '',
          currentAddress: customer.currentAddress || customer.address || '',
          permanentAddress: customer.permanentAddress || customer.address || '',
          sameAsCurrentAddress: customer.sameAsCurrentAddress || false,
          aadhaarCard: formatAadhaar(customer.aadhaarCard || ''),
          panCard: customer.panCard || '',
          nomineeName: customer.nomineeName || '',
          nomineeRelation: customer.nomineeRelation || '',
          nomineeAge: customer.nomineeAge || '',
          accountHolderName: customer.accountHolderName || '',
          bankName: customer.bankName || '',
          bankBranch: customer.bankBranch || '',
          accountNumber: customer.accountNumber || '',
          ifscCode: customer.ifscCode || '',
        });
      }
    } catch (err) {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  // ── Formatters ──
  const handleMobileChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormState((prev) => ({ ...prev, mobile: digitsOnly }));
  };

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleAadhaarChange = (e) => {
    const formatted = formatAadhaar(e.target.value);
    setFormState((prev) => ({ ...prev, aadhaarCard: formatted }));
  };

  const handleCurrentAddressChange = (val) => {
    setFormState((prev) => ({
      ...prev,
      currentAddress: val,
      permanentAddress: prev.sameAsCurrentAddress ? val : prev.permanentAddress,
    }));
  };

  const handleSameAddressToggle = (checked) => {
    setFormState((prev) => ({
      ...prev,
      sameAsCurrentAddress: checked,
      permanentAddress: checked ? prev.currentAddress : prev.permanentAddress,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.sponsorId) {
      toast.warn('Please select a sponsor first!');
      return;
    }

    if (formState.mobile && formState.mobile.length !== 10) {
      toast.warn('Mobile number must be exactly 10 digits!');
      return;
    }

    try {
      if (isEdit) {
        await request({
          url: `plots/customers/${id}`,
          method: 'PUT',
          body: formState,
        });
        toast.success('customer updated successfully');
      } else {
        await request({
          url: 'plots/customers',
          method: 'POST',
          body: formState,
        });
        toast.success('customer created successfully');
      }
      navigate('/dashboard/plots/customers');
    } catch (err) {
      console.error(err);
    }
  };

  const selectedSponsor = sponsors.find((s) => s._id === formState.sponsorId);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-3">
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        <p className="text-xs font-bold text-slate-500 animate-pulse">Loading customer data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard/plots/customers')}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition shadow-sm"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isEdit ? 'Update existing customer information' : 'Step 1: Select a sponsor first, then complete customer registration.'}
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl space-y-6">

        {/* Step 1: Sponsor Selection */}
        <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
              1. Select Sponsor *
            </label>
            <button
              type="button"
              onClick={() => navigate('/dashboard/plots/sponsors')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-sm transition hover:border-indigo-300 active:scale-95 cursor-pointer"
              title="Add a new sponsor in Plot Sponsors master"
            >
              <HiOutlineUserPlus className="w-4 h-4 text-indigo-600" />
              + Add Sponsor
            </button>
          </div>
          <select
            required
            value={formState.sponsorId}
            onChange={(e) => setFormState({ ...formState, sponsorId: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Choose Sponsor First --</option>
            {sponsors.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.sponsorCode ? `(${s.sponsorCode})` : s.mobile ? `(${s.mobile})` : ''}
              </option>
            ))}
          </select>
          {selectedSponsor && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <HiCheckCircle className="w-4 h-4" />
              Selected Sponsor: {selectedSponsor.name} {selectedSponsor.sponsorCode ? `(${selectedSponsor.sponsorCode})` : selectedSponsor.mobile ? `(${selectedSponsor.mobile})` : ''}
            </div>
          )}
        </div>

        {/* Step 2: Customer Personal Information */}
        <div className={`space-y-4 ${!formState.sponsorId ? 'opacity-40 pointer-events-none' : ''}`}>
          <h2 className="text-base font-bold text-slate-800 pt-2 border-t border-slate-100">
            2. Customer Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter customer full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Relative Name</label>
              <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
                <select
                  value={formState.relationType}
                  onChange={(e) => setFormState({ ...formState, relationType: e.target.value })}
                  className="px-2.5 py-2.5 bg-slate-100 text-xs font-semibold text-slate-700 border-r border-slate-300 outline-none cursor-pointer"
                >
                  <option value="Son of">S/O</option>
                  <option value="Daughter of">D/O</option>
                  <option value="Wife of">W/O</option>
                </select>
                <input
                  type="text"
                  value={formState.fatherOrHusbandName}
                  onChange={(e) => setFormState({ ...formState, fatherOrHusbandName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none"
                  placeholder="Enter relative full name"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number (10 digits) *</label>
              <input
                type="text"
                required
                maxLength={10}
                value={formState.mobile}
                onChange={handleMobileChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest font-medium"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Optional personal email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
              <select
                value={formState.gender}
                onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
              <input
                type="number"
                value={formState.age}
                onChange={(e) => setFormState({ ...formState, age: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 35"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PAN Card Number (10 characters)</label>
              <input
                type="text"
                maxLength={10}
                value={formState.panCard}
                onChange={(e) => setFormState({ ...formState, panCard: e.target.value.toUpperCase().slice(0, 10) })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest uppercase font-medium"
                placeholder="ABCDE1234F"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Aadhaar Card Number (digits & spaces)</label>
              <input
                type="text"
                maxLength={14}
                value={formState.aadhaarCard}
                onChange={handleAadhaarChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest font-medium"
                placeholder="1234 5678 9012"
              />
            </div>
          </div>

          {/* Current & Permanent Address Section */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Address</label>
              <textarea
                rows={2}
                value={formState.currentAddress}
                onChange={(e) => handleCurrentAddressChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Present residential address..."
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="sameAddress"
                checked={formState.sameAsCurrentAddress}
                onChange={(e) => handleSameAddressToggle(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="sameAddress" className="text-xs font-medium text-slate-700 cursor-pointer">
                Permanent Address is same as Current Address
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Permanent Address</label>
              <textarea
                rows={2}
                disabled={formState.sameAsCurrentAddress}
                value={formState.permanentAddress}
                onChange={(e) => setFormState({ ...formState, permanentAddress: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${formState.sameAsCurrentAddress ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''
                  }`}
                placeholder="Permanent address..."
              />
            </div>
          </div>

          {/* Step 3: Bank Details */}
          <h2 className="text-base font-bold text-slate-800 pt-3 border-t border-slate-100">
            3. Customer Bank Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formState.accountHolderName}
                onChange={(e) => setFormState({ ...formState, accountHolderName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Name as per bank account"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={formState.bankName}
                onChange={(e) => setFormState({ ...formState, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. State Bank of India"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Account Number</label>
              <input
                type="text"
                value={formState.accountNumber}
                onChange={(e) => setFormState({ ...formState, accountNumber: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-wider font-medium"
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formState.ifscCode}
                onChange={(e) => setFormState({ ...formState, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase tracking-wider font-medium"
                placeholder="SBIN0001234"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Branch</label>
              <input
                type="text"
                value={formState.bankBranch}
                onChange={(e) => setFormState({ ...formState, bankBranch: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Branch location"
              />
            </div>
          </div>

          {/* Step 4: Nominee Details */}
          <h2 className="text-base font-bold text-slate-800 pt-3 border-t border-slate-100">
            4. Nominee Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominee Full Name</label>
              <input
                type="text"
                value={formState.nomineeName}
                onChange={(e) => setFormState({ ...formState, nomineeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Nominee name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Relation with Nominee</label>
              <input
                type="text"
                value={formState.nomineeRelation}
                onChange={(e) => setFormState({ ...formState, nomineeRelation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Spouse / Son / Daughter"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominee Age</label>
              <input
                type="number"
                value={formState.nomineeAge}
                onChange={(e) => setFormState({ ...formState, nomineeAge: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Age"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/customers')}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading || !formState.sponsorId}
            className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {submitLoading ? 'Saving Customer...' : isEdit ? 'Update Customer' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlotCustomerFormPage;
