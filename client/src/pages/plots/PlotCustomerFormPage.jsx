import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useApi } from '../../utils/useApi';
import { ArrowLeft, CheckCircle2, UserPlus, Camera, PenTool, Trash2, User, Phone, Mail, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from '../../utils/toast';
import useImageUpload from '../../utils/imageresizer';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
import { Input } from '../../components/ui/Input';
import { NumberInput } from '../../components/ui/NumberInput';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Button } from '../../components/ui/Button';
import PageLoader from '../../components/common/PageLoader';

const PlotCustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { handleImage } = useImageUpload();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

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
    photo: '',
    signature: '',
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
          photo: customer.photo || customer.profileImage || '',
          signature: customer.signature || '',
          accountHolderName: customer.accountHolderName || '',
          bankName: customer.bankName || '',
          bankBranch: customer.bankBranch || '',
          accountNumber: customer.accountNumber || '',
          ifscCode: customer.ifscCode || '',
        });
      }
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  // ── Image Upload Handlers with WebP Compression ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      // Resize to max 350px width and convert to WebP (typically 15-30KB)
      const webpFile = await handleImage(350, file, 0.85);

      const formData = new FormData();
      formData.append('file', webpFile);
      formData.append('folder', 'ems/plots/customers/photos');

      const res = await apiClient({
        url: 'plots/upload-media',
        method: 'POST',
        body: formData,
      });

      const url = res.data?.url || res.url;
      if (url) {
        setFormState((prev) => ({ ...prev, photo: url }));
        toast.success('Customer photo uploaded & compressed (WebP)');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload customer photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSign(true);
      // Resize signature to max 400px width and convert to WebP (typically 10-20KB)
      const webpFile = await handleImage(400, file, 0.85);

      const formData = new FormData();
      formData.append('file', webpFile);
      formData.append('folder', 'ems/plots/customers/signatures');

      const res = await apiClient({
        url: 'plots/upload-media',
        method: 'POST',
        body: formData,
      });

      const url = res.data?.url || res.url;
      if (url) {
        setFormState((prev) => ({ ...prev, signature: url }));
        toast.success('Customer signature uploaded & compressed (WebP)');
      }
    } catch (err) {
      console.error('Signature upload error:', err);
      toast.error('Failed to upload signature');
    } finally {
      setUploadingSign(false);
      e.target.value = '';
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
      const payload = {
        ...formState,
        age: formState.age ? Number(formState.age) : undefined,
        nomineeAge: formState.nomineeAge ? Number(formState.nomineeAge) : undefined,
      };

      if (isEdit) {
        await request({
          url: `plots/customers/${id}`,
          method: 'PUT',
          body: payload,
        });
        toast.success('Customer updated successfully');
      } else {
        await request({
          url: 'plots/customers',
          method: 'POST',
          body: payload,
        });
        toast.success('Customer created successfully');
      }
      navigate('/dashboard/plots/customers');
    } catch (err) {
      console.error(err);
    }
  };

  const selectedSponsor = sponsors.find((s) => s._id === formState.sponsorId);

  const sponsorOptions = sponsors.map((s) => ({
    value: s._id,
    label: s.name,
    subtitle: s.sponsorCode ? `Code: ${s.sponsorCode}` : s.mobile ? `Mob: ${s.mobile}` : '',
  }));

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <PageLoader
          title="Loading Customer Details..."
          subtitle="Fetching verified customer records & KYC files"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/customers')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition shadow-xs cursor-pointer"
            title="Back to Customers"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              {isEdit ? 'Edit Customer Record' : 'Register New Customer'}
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">
              {isEdit
                ? 'Update customer KYC, address, bank details and nominee records'
                : 'Step 1: Select assigned sponsor, then provide customer information & KYC'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/dashboard/plots/customers')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="customer-form"
            loading={submitLoading}
            disabled={!formState.sponsorId}
          >
            {isEdit ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Sponsor Selection */}
        <div className="p-5 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              1. Select Assigned Sponsor *
            </label>
            <button
              type="button"
              onClick={() => navigate('/dashboard/plots/sponsors')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200 shadow-xs transition hover:border-teal-300 active:scale-95 cursor-pointer self-start sm:self-auto"
              title="Add a new sponsor in Plot Sponsors master"
            >
              <UserPlus size={14} className="text-teal-700" />
              + Add Sponsor
            </button>
          </div>

          <SearchableSelect
            label="Assigned Plot Sponsor"
            required
            placeholder="Search & choose sponsor by name or code..."
            options={sponsorOptions}
            value={formState.sponsorId}
            onChange={(val) => setFormState({ ...formState, sponsorId: val })}
          />

          {selectedSponsor && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200/80 px-3 py-2 rounded-xl">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                Selected Sponsor: <strong>{selectedSponsor.name}</strong>{' '}
                {selectedSponsor.sponsorCode ? `(${selectedSponsor.sponsorCode})` : selectedSponsor.mobile ? `(${selectedSponsor.mobile})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Form Sections Container */}
        <div className={`space-y-6 transition-opacity duration-200 ${!formState.sponsorId ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Section 2: Personal Details */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User size={16} className="text-teal-700" />
              2. Customer Personal Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Customer Name"
                required
                placeholder="Enter customer full name"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              />

              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Relationship & Relative Name
                </label>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-600 bg-white transition-all shadow-xs">
                  <select
                    value={formState.relationType}
                    onChange={(e) => setFormState({ ...formState, relationType: e.target.value })}
                    className="px-2.5 py-2 bg-slate-50 text-xs font-semibold text-slate-700 border-r border-slate-200 outline-none cursor-pointer"
                  >
                    <option value="Son of">S/O</option>
                    <option value="Daughter of">D/O</option>
                    <option value="Wife of">W/O</option>
                  </select>
                  <input
                    type="text"
                    value={formState.fatherOrHusbandName}
                    onChange={(e) => setFormState({ ...formState, fatherOrHusbandName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="Father / Husband full name"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Mobile Number (10 digits)"
                required
                startIcon={Phone}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="9876543210"
                value={formState.mobile}
                onChange={handleMobileChange}
              />

              <Input
                label="Email Address"
                startIcon={Mail}
                type="email"
                placeholder="name@example.com"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              />

              <Select
                label="Gender"
                value={formState.gender}
                onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
              />

              <NumberInput
                label="Age (Years)"
                min={18}
                max={120}
                placeholder="e.g. 35"
                value={formState.age}
                onChange={(e) => setFormState({ ...formState, age: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="PAN Card Number"
                maxLength={10}
                placeholder="ABCDE1234F"
                value={formState.panCard}
                onChange={(e) => setFormState({ ...formState, panCard: e.target.value.toUpperCase().slice(0, 10) })}
                className="uppercase tracking-widest font-mono font-bold"
              />

              <Input
                label="Aadhaar Card Number"
                maxLength={14}
                placeholder="1234 5678 9012"
                value={formState.aadhaarCard}
                onChange={handleAadhaarChange}
                className="tracking-widest font-mono font-bold"
              />
            </div>

            {/* Address Details */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Current Residential Address
                </label>
                <textarea
                  rows={2}
                  value={formState.currentAddress}
                  onChange={(e) => handleCurrentAddressChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-600 outline-none transition text-slate-800 shadow-xs resize-none"
                  placeholder="Present residential flat/house, street, landmark, city, state, pin..."
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="sameAddress"
                  checked={formState.sameAsCurrentAddress}
                  onChange={(e) => handleSameAddressToggle(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="sameAddress" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Permanent Address is same as Current Address
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Permanent Address
                </label>
                <textarea
                  rows={2}
                  disabled={formState.sameAsCurrentAddress}
                  value={formState.permanentAddress}
                  onChange={(e) => setFormState({ ...formState, permanentAddress: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-600 outline-none transition text-slate-800 shadow-xs resize-none ${
                    formState.sameAsCurrentAddress ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''
                  }`}
                  placeholder="Permanent native address..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Nominee Details */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck size={16} className="text-teal-700" />
              3. Nominee Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Nominee Name"
                placeholder="Full name of nominee"
                value={formState.nomineeName}
                onChange={(e) => setFormState({ ...formState, nomineeName: e.target.value })}
              />

              <Input
                label="Nominee Relationship"
                placeholder="e.g. Spouse, Son, Mother"
                value={formState.nomineeRelation}
                onChange={(e) => setFormState({ ...formState, nomineeRelation: e.target.value })}
              />

              <NumberInput
                label="Nominee Age (Years)"
                min={1}
                max={120}
                placeholder="e.g. 30"
                value={formState.nomineeAge}
                onChange={(e) => setFormState({ ...formState, nomineeAge: e.target.value })}
              />
            </div>
          </div>

          {/* Section 4: Bank Details */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 size={16} className="text-teal-700" />
              4. Customer Bank Account Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Account Holder Name"
                placeholder="Name as per bank passbook"
                value={formState.accountHolderName}
                onChange={(e) => setFormState({ ...formState, accountHolderName: e.target.value })}
              />

              <Input
                label="Bank Name"
                placeholder="e.g. State Bank of India, HDFC Bank"
                value={formState.bankName}
                onChange={(e) => setFormState({ ...formState, bankName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Account Number"
                startIcon={CreditCard}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Bank account number"
                value={formState.accountNumber}
                onChange={(e) => setFormState({ ...formState, accountNumber: e.target.value.replace(/\D/g, '') })}
                className="font-mono tracking-wider"
              />

              <Input
                label="IFSC Code"
                maxLength={11}
                placeholder="SBIN0001234"
                value={formState.ifscCode}
                onChange={(e) => setFormState({ ...formState, ifscCode: e.target.value.toUpperCase() })}
                className="uppercase tracking-wider font-mono font-bold"
              />

              <Input
                label="Bank Branch"
                placeholder="Branch name / locality"
                value={formState.bankBranch}
                onChange={(e) => setFormState({ ...formState, bankBranch: e.target.value })}
              />
            </div>
          </div>

          {/* Section 5: Photo & Signature */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Camera size={16} className="text-teal-700" />
              5. Customer Photo & Signature (Optimized WebP)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Photo Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Customer Passport Photo
                </label>
                <div className="relative w-28 h-32 bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden group shadow-2xs">
                  {formState.photo ? (
                    <>
                      <img
                        src={cloudinaryUrl(formState.photo, { format: 'webp', width: 200, height: 240, crop: 'fill' })}
                        alt="Customer Photo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, photo: '' }))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        title="Remove Photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                      <Camera size={24} className="mb-1 text-slate-400" />
                      <span className="text-[10px] font-medium leading-tight">Passport Size (3.5x4.5cm)</span>
                    </div>
                  )}
                </div>
                <label className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer shadow-2xs transition hover:border-teal-500">
                  <Camera size={14} className="text-teal-700" />
                  <span>{uploadingPhoto ? 'Compressing...' : formState.photo ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Auto-converted to ~20KB WebP</p>
              </div>

              {/* Customer Signature Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Customer Signature
                </label>
                <div className="relative w-48 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden group shadow-2xs p-1">
                  {formState.signature ? (
                    <>
                      <img
                        src={cloudinaryUrl(formState.signature, { format: 'webp', width: 300, height: 150, crop: 'fit' })}
                        alt="Customer Signature"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, signature: '' }))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        title="Remove Signature"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                      <PenTool size={22} className="mb-1 text-slate-400" />
                      <span className="text-[10px] font-medium">Clear white background signature</span>
                    </div>
                  )}
                </div>
                <label className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer shadow-2xs transition hover:border-teal-500">
                  <PenTool size={14} className="text-teal-700" />
                  <span>{uploadingSign ? 'Compressing...' : formState.signature ? 'Change Signature' : 'Upload Signature'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    disabled={uploadingSign}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Auto-converted to ~15KB WebP</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/dashboard/plots/customers')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={submitLoading}
              disabled={!formState.sponsorId}
            >
              {submitLoading ? 'Saving Customer...' : isEdit ? 'Update Customer Record' : 'Register Customer'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlotCustomerFormPage;

