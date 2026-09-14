import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Paperclip,
  UploadCloud,
  FileText,
  CheckCircle2,
  Compass,
  Layers,
  Users,
  IndianRupee,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { PhoneInput, AadhaarInput, PanInput, SearchableSelect } from '../../../../components/ui';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';

const CreateAgreementModal = ({
  open,
  onClose,
  createForm,
  setCreateForm,
  createLoading,
  setCreateLoading,
  fetchAgreements,
  sellers = [],
  purchasers = [],
  fetchSellers,
  fetchPurchasers,
}) => {
  const [activeChaudhiIdx, setActiveChaudhiIdx] = useState(null);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // Auto-default purchaser from purchasers directory if not set
  React.useEffect(() => {
    if (open && Array.isArray(purchasers) && purchasers.length > 0) {
      const defaultP = purchasers.find((p) => p.isDefault) || purchasers[0];
      const curPurchasers = createForm.purchasers || [];
      if (defaultP && (curPurchasers.length === 0 || (!curPurchasers[0]?.name && !curPurchasers[0]?.contact))) {
        setCreateForm((prev) => ({
          ...prev,
          purchasers: [
            {
              name: defaultP.name || '',
              contact: defaultP.contact || '',
              mobile: defaultP.mobile || '',
              aadhaarNumber: defaultP.aadhaarNumber || '',
              panNumber: defaultP.panNumber || '',
            },
          ],
        }));
      }
    }
  }, [open, purchasers]);

  const handleSelectExistingFarmer = (idx, sellerId) => {
    const selectedSeller = (sellers || []).find((s) => s._id === sellerId);
    if (!selectedSeller) return;
    const updated = [...(createForm.farmers || [])];
    updated[idx] = {
      ...updated[idx],
      name: selectedSeller.name || '',
      guardianName: selectedSeller.guardianName || '',
      relation: selectedSeller.relation || 'Father',
      mobile: selectedSeller.mobile || '',
      aadhaarNumber: selectedSeller.aadhaarNumber || '',
      panNumber: selectedSeller.panNumber || '',
      address: selectedSeller.address || '',
    };
    setCreateForm({ ...createForm, farmers: updated });
    toast.success(`Loaded details for ${selectedSeller.name}`);
  };

  const handleSelectExistingPurchaser = (idx, purchaserId) => {
    const selectedPurchaser = (purchasers || []).find((p) => p._id === purchaserId);
    if (!selectedPurchaser) return;
    const updated = [...(createForm.purchasers || [])];
    updated[idx] = {
      ...updated[idx],
      name: selectedPurchaser.name || '',
      contact: selectedPurchaser.contact || '',
      mobile: selectedPurchaser.mobile || '',
      aadhaarNumber: selectedPurchaser.aadhaarNumber || '',
      panNumber: selectedPurchaser.panNumber || '',
    };
    setCreateForm({ ...createForm, purchasers: updated });
    toast.success(`Selected purchaser: ${selectedPurchaser.name}`);
  };

  // ─── PARCELS HANDLERS ──────────────────────────────────────────
  const handleParcelChange = (idx, field, val) => {
    const updated = [...(createForm.landParcels || [])];
    updated[idx] = { ...updated[idx], [field]: val };

    // Auto calculate parcel cost if dismil or rate changes
    if (field === 'araziDismil' || field === 'ratePerDismil') {
      const dismil = Number(field === 'araziDismil' ? val : updated[idx].araziDismil) || 0;
      const rate = Number(field === 'ratePerDismil' ? val : updated[idx].ratePerDismil) || 0;
      updated[idx].totalAmount = Math.round(dismil * rate);
      updated[idx].totalSqFt = Math.round(dismil * 435.6 * 100) / 100;
      updated[idx].ratePerSqFt = rate > 0 ? Math.round((rate / 435.6) * 100) / 100 : 0;
    }

    setCreateForm({ ...createForm, landParcels: updated });
  };

  const handleChaudhiChange = (idx, direction, val) => {
    const updated = [...(createForm.landParcels || [])];
    updated[idx] = {
      ...updated[idx],
      chaudhi: {
        ...(updated[idx].chaudhi || { north: '', south: '', east: '', west: '' }),
        [direction]: val,
      },
    };
    setCreateForm({ ...createForm, landParcels: updated });
  };

  const addParcelRow = () => {
    const defaultMauja = createForm.landParcels?.[0]?.mauja || '';
    const defaultThana = createForm.landParcels?.[0]?.thanaNumber || '';
    const defaultRate = createForm.landParcels?.[0]?.ratePerDismil || '';

    setCreateForm({
      ...createForm,
      landParcels: [
        ...(createForm.landParcels || []),
        {
          mauja: defaultMauja,
          thanaNumber: defaultThana,
          khataNumber: '',
          khesraNumber: '',
          jamabandiNumber: '',
          chaudhi: { north: '', south: '', east: '', west: '' },
          araziDismil: '',
          totalSqFt: 0,
          ratePerDismil: defaultRate,
          ratePerSqFt: 0,
          totalAmount: '',
          remarks: '',
        },
      ],
    });
  };

  const removeParcelRow = (idx) => {
    if ((createForm.landParcels || []).length <= 1) return;
    setCreateForm({
      ...createForm,
      landParcels: createForm.landParcels.filter((_, i) => i !== idx),
    });
  };

  // ─── FARMERS HANDLERS ──────────────────────────────────────────
  const handleFarmerChange = (idx, field, val) => {
    const updated = [...(createForm.farmers || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    setCreateForm({ ...createForm, farmers: updated });
  };

  const addFarmerRow = () => {
    setCreateForm({
      ...createForm,
      farmers: [
        ...(createForm.farmers || []),
        {
          name: '',
          guardianName: '',
          relation: 'Father',
          mobile: '',
          aadhaarNumber: '',
          panNumber: '',
          sharePercent: 0,
          address: '',
        },
      ],
    });
  };

  const removeFarmerRow = (idx) => {
    if ((createForm.farmers || []).length <= 1) return;
    setCreateForm({
      ...createForm,
      farmers: createForm.farmers.filter((_, i) => i !== idx),
    });
  };

  // ─── PURCHASERS / BUYERS HANDLERS ────────────────────────────
  const handlePurchaserChange = (idx, field, val) => {
    const updated = [...(createForm.purchasers || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    setCreateForm({ ...createForm, purchasers: updated });
  };

  const addPurchaserRow = () => {
    setCreateForm({
      ...createForm,
      purchasers: [
        ...(createForm.purchasers || []),
        {
          name: '',
          contact: '',
          aadhaarNumber: '',
        },
      ],
    });
  };

  const removePurchaserRow = (idx) => {
    if ((createForm.purchasers || []).length <= 1) return;
    setCreateForm({
      ...createForm,
      purchasers: createForm.purchasers.filter((_, i) => i !== idx),
    });
  };

  // ─── ATTACHMENTS HANDLERS ──────────────────────────────────────
  const handleAttachmentChange = (idx, field, val) => {
    const updated = [...(createForm.attachments || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    setCreateForm({ ...createForm, attachments: updated });
  };

  const addAttachmentRow = () => {
    setCreateForm({
      ...createForm,
      attachments: [
        ...(createForm.attachments || []),
        {
          fileName: '',
          fileType: 'Agreement Scan',
          fileUrl: '',
          fileSize: 0,
          description: '',
        },
      ],
    });
  };

  const removeAttachmentRow = (idx) => {
    setCreateForm({
      ...createForm,
      attachments: (createForm.attachments || []).filter((_, i) => i !== idx),
    });
  };

  const handleFileUpload = async (idx, file) => {
    if (!file) return;
    setUploadingIdx(idx);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/plots/kisan-agreements/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      const updated = [...(createForm.attachments || [])];
      updated[idx] = {
        ...updated[idx],
        fileUrl: data.url || data.secure_url,
        fileName: updated[idx].fileName || file.name.replace(/\.[^/.]+$/, ''),
        fileSize: file.size,
      };
      setCreateForm({ ...createForm, attachments: updated });
      toast.success('Document uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingIdx(null);
    }
  };

  // ─── AGGREGATES CALCULATION ────────────────────────────────────
  const parcels = createForm.landParcels || [];
  const totalDismil = Math.round(parcels.reduce((sum, p) => sum + (Number(p.araziDismil) || 0), 0) * 1000) / 1000;
  const totalSqFt = Math.round(totalDismil * 435.6 * 100) / 100;
  const calculatedTotalCost = Math.round(parcels.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0));
  const avgRatePerDismil = totalDismil > 0 ? Math.round(calculatedTotalCost / totalDismil) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parcels.length === 0) {
      toast.error('Please add at least one land parcel.');
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        ...createForm,
        araziDismil: totalDismil,
        totalSqFt,
        totalAgreementAmount: calculatedTotalCost,
        ratePerDismil: avgRatePerDismil,
      };
      await api.post('/plots/kisan-agreements', payload);
      toast.success('Kisan Land Agreement registered successfully!');
      onClose();
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create agreement');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Modalbox open={open} onClose={onClose} outside={false} maxWidth="max-w-4xl" showClose={false}>
      <div className="p-5 md:p-7 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">
                New Plot Purchase Agreement
              </h3>
              <p className="text-xs text-slate-500">
                Record land & plot details, Chaudhi boundaries, Kisan owners, and upload document attachments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agreement Dates & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Agreement Date *</label>
              <input
                type="date"
                required
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3 rounded-xl text-xs font-semibold text-slate-800"
                value={createForm.agreementDate}
                onChange={(e) => setCreateForm({ ...createForm, agreementDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                End / Expiry Date <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="date"
                min={createForm.agreementDate || undefined}
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3 rounded-xl text-xs font-semibold text-slate-800"
                value={createForm.agreementEndDate || ''}
                onChange={(e) => setCreateForm({ ...createForm, agreementEndDate: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">General Remarks / Notes</label>
              <input
                type="text"
                placeholder="Remarks / Notes..."
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3 rounded-xl text-xs font-medium text-slate-800"
                value={createForm.remarks || ''}
                onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
              />
            </div>
          </div>

          {/* ── SECTION 1: LAND SELLERS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Users className="text-teal-700" size={18} />
                <h4 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  1. Land Seller Details ({(createForm.farmers || []).length}) *
                </h4>
              </div>
              <button
                type="button"
                onClick={addFarmerRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Another Land Seller</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(createForm.farmers || []).map((farmer, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-700">Land Seller #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {Array.isArray(sellers) && sellers.length > 0 && (
                        <div className="flex items-center gap-1.5 min-w-[220px] sm:min-w-[280px]">
                          <span className="text-[10px] text-teal-800 font-semibold whitespace-nowrap">Choose Land Seller:</span>
                          <div className="flex-1">
                            <SearchableSelect
                              size="sm"
                              placeholder="-- Search / Select Land Seller --"
                              searchPlaceholder="Search by name, mobile, father..."
                              options={sellers.map((s) => ({
                                value: s._id,
                                label: s.name,
                                subtitle: `${s.mobile ? s.mobile : ''}${s.guardianName ? ` • s/o ${s.guardianName}` : ''}${s.address ? ` • ${s.address}` : ''}`.trim(),
                              }))}
                              value=""
                              onChange={(val) => {
                                if (val) {
                                  handleSelectExistingFarmer(idx, val);
                                }
                              }}
                              allowClear={false}
                              containerClassName="w-full"
                              className="text-[11px] h-7 border-teal-300 bg-white"
                            />
                          </div>
                        </div>
                      )}
                      {(createForm.farmers || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFarmerRow(idx)}
                          className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg text-xs font-bold cursor-pointer"
                          title="Remove land seller"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Seller Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Seller Full Name"
                        className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-slate-800 outline-none"
                        value={farmer.name}
                        onChange={(e) => handleFarmerChange(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Guardian / Father Name</label>
                      <input
                        type="text"
                        placeholder="Guardian / Father Name"
                        className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-medium outline-none"
                        value={farmer.guardianName}
                        onChange={(e) => handleFarmerChange(idx, 'guardianName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mobile Number</label>
                      <PhoneInput
                        size="sm"
                        placeholder="Mobile Number"
                        className="h-8 text-xs font-medium"
                        value={farmer.mobile}
                        onChange={(e) => handleFarmerChange(idx, 'mobile', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Aadhaar Number</label>
                      <AadhaarInput
                        size="sm"
                        placeholder="12 digit Aadhaar No."
                        className="h-8 text-xs font-medium"
                        value={farmer.aadhaarNumber}
                        onChange={(e) => handleFarmerChange(idx, 'aadhaarNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PAN Card</label>
                      <PanInput
                        size="sm"
                        placeholder="10 character PAN No."
                        className="h-8 text-xs"
                        value={farmer.panNumber}
                        onChange={(e) => handleFarmerChange(idx, 'panNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Village Address</label>
                      <input
                        type="text"
                        placeholder="Village / Full Address"
                        className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-medium outline-none"
                        value={farmer.address}
                        onChange={(e) => handleFarmerChange(idx, 'address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION 2: LAND & PLOT DETAILS ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <Layers size={16} className="text-teal-700" />
              <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                2. Land & Plot Details (जमीन एवं खेसरा विवरण) *
              </h4>
            </div>

            {/* Land Detail Cards List */}
            <div className="space-y-4">
              {parcels.map((parcel, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3.5 relative hover:border-teal-300 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-black text-teal-900 flex items-center gap-2">
                      <span className="w-5 h-5 bg-teal-700 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>Land & Plot Detail #{idx + 1}</span>
                    </span>

                    {parcels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParcelRow(idx)}
                        className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Remove this land detail"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Identification Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Thana Number</label>
                      <input
                        type="text"
                        placeholder="Thana No."
                        className="h-8 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-medium outline-none"
                        value={parcel.thanaNumber}
                        onChange={(e) => handleParcelChange(idx, 'thanaNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mauja / Village *</label>
                      <input
                        type="text"
                        required
                        placeholder="Mauja / Village"
                        className="h-8 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-medium outline-none"
                        value={parcel.mauja}
                        onChange={(e) => handleParcelChange(idx, 'mauja', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jamabandi No.</label>
                      <input
                        type="text"
                        placeholder="Jamabandi No."
                        className="h-8 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-medium outline-none"
                        value={parcel.jamabandiNumber}
                        onChange={(e) => handleParcelChange(idx, 'jamabandiNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Khata Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="Khata No."
                        className="h-8 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-medium outline-none"
                        value={parcel.khataNumber}
                        onChange={(e) => handleParcelChange(idx, 'khataNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Khesra / Plot No *</label>
                      <input
                        type="text"
                        required
                        placeholder="Khesra / Plot No."
                        className="h-8 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-bold text-teal-800 outline-none"
                        value={parcel.khesraNumber}
                        onChange={(e) => handleParcelChange(idx, 'khesraNumber', e.target.value)}
                      />
                    </div>


                  </div>

                  {/* Area & Pricing Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Arazi Area (Dismil) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0"
                        className="h-8 w-full bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-bold text-slate-900 outline-none"
                        value={parcel.araziDismil}
                        onChange={(e) => handleParcelChange(idx, 'araziDismil', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Rate per Dismil (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="h-8 w-full bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-lg px-2 text-xs font-medium text-slate-800 outline-none"
                        value={parcel.ratePerDismil}
                        onChange={(e) => handleParcelChange(idx, 'ratePerDismil', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Agreed Plot Cost (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="h-8 w-full bg-emerald-50/60 border border-emerald-300 focus:ring-2 focus:ring-emerald-600 rounded-lg px-2 text-xs font-bold text-emerald-800 outline-none"
                        value={parcel.totalAmount}
                        onChange={(e) => handleParcelChange(idx, 'totalAmount', e.target.value)}
                      />
                      <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                        ₹{Number(parcel.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Chaudhi Directional Boundaries (Visible by default) */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                      <Compass size={14} className="text-amber-700" />
                      <span>Chaudhi Boundaries (चौहद्दी विवरण)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">North (उत्तर)</label>
                        <input
                          type="text"
                          placeholder="North boundary / Plot details"
                          className="h-7 w-full bg-white border border-amber-200 rounded-md px-2 text-[11px] outline-none"
                          value={parcel.chaudhi?.north || ''}
                          onChange={(e) => handleChaudhiChange(idx, 'north', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">South (दक्षिण)</label>
                        <input
                          type="text"
                          placeholder="South boundary / Owner"
                          className="h-7 w-full bg-white border border-amber-200 rounded-md px-2 text-[11px] outline-none"
                          value={parcel.chaudhi?.south || ''}
                          onChange={(e) => handleChaudhiChange(idx, 'south', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">East (पूरब)</label>
                        <input
                          type="text"
                          placeholder="East boundary / Road / Canal"
                          className="h-7 w-full bg-white border border-amber-200 rounded-md px-2 text-[11px] outline-none"
                          value={parcel.chaudhi?.east || ''}
                          onChange={(e) => handleChaudhiChange(idx, 'east', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">West (पश्चिम)</label>
                        <input
                          type="text"
                          placeholder="West boundary / Land"
                          className="h-7 w-full bg-white border border-amber-200 rounded-md px-2 text-[11px] outline-none"
                          value={parcel.chaudhi?.west || ''}
                          onChange={(e) => handleChaudhiChange(idx, 'west', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Land / Plot Row Button placed immediately after plot cards */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addParcelRow}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Another Land / Plot Row</span>
              </button>
            </div>

            {/* Total Plots / Land Aggregate Banner */}
            <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Plots / Land</div>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{parcels.length} Detail(s)</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-teal-800">Total Arazi (Dismil)</div>
                  <div className="text-sm font-black text-teal-700 mt-0.5">
                    {totalDismil} <span className="text-[10px] font-semibold text-slate-400 font-normal">Dismil</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/50">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Total Agreement Cost</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">
                    ₹{calculatedTotalCost.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: PURCHASERS / BUYERS (क्रेता / ख़रीदार) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Users className="text-teal-700" size={18} />
                <h4 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Purchaser / Buyer(s) Details ({(createForm.purchasers || []).length})
                </h4>
              </div>
              <button
                type="button"
                onClick={addPurchaserRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Another Buyer</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(createForm.purchasers || []).map((purchaser, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-700">Purchaser / Buyer #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {Array.isArray(purchasers) && purchasers.length > 0 && (
                        <div className="flex items-center gap-1.5 min-w-[220px] sm:min-w-[280px]">
                          <span className="text-[10px] text-blue-800 font-semibold whitespace-nowrap">Choose from Buyer Directory:</span>
                          <div className="flex-1">
                            <SearchableSelect
                              size="sm"
                              placeholder="-- Search / Select Buyer --"
                              searchPlaceholder="Search company, director, mobile..."
                              options={purchasers.map((p) => ({
                                value: p._id,
                                label: `${p.name} ${p.isDefault ? '⭐ (Default)' : ''}`,
                                subtitle: `${p.contact ? p.contact : ''}${p.panNumber ? ` • PAN: ${p.panNumber}` : ''}${p.address ? ` • ${p.address}` : ''}`.trim(),
                              }))}
                              value=""
                              onChange={(val) => {
                                if (val) {
                                  handleSelectExistingPurchaser(idx, val);
                                }
                              }}
                              allowClear={false}
                              containerClassName="w-full"
                              className="text-[11px] h-7 border-blue-300 bg-white"
                            />
                          </div>
                        </div>
                      )}
                      {(createForm.purchasers || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePurchaserRow(idx)}
                          className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg text-xs font-bold cursor-pointer"
                          title="Remove buyer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Purchaser / Buyer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Purchaser / Buyer Name"
                        className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-slate-800 outline-none"
                        value={purchaser.name}
                        onChange={(e) => handlePurchaserChange(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Contact / Mobile (Optional)</label>
                      <PhoneInput
                        size="sm"
                        placeholder="Mobile Number"
                        className="h-8 text-xs font-medium"
                        value={purchaser.contact || purchaser.mobile || ''}
                        onChange={(e) => handlePurchaserChange(idx, 'contact', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Aadhaar Number (Optional)</label>
                      <AadhaarInput
                        size="sm"
                        placeholder="12 digit Aadhaar No."
                        className="h-8 text-xs font-medium"
                        value={purchaser.aadhaarNumber || ''}
                        onChange={(e) => handlePurchaserChange(idx, 'aadhaarNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION 4: MULTI-DOCUMENT ATTACHMENTS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="text-teal-700" size={18} />
                <h4 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Land Documents & Attachments ({(createForm.attachments || []).length})
                </h4>
              </div>
              <button
                type="button"
                onClick={addAttachmentRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Attach File / Document</span>
              </button>
            </div>

            {(createForm.attachments || []).length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                No documents attached yet. Click "Attach File / Document" above to upload agreement scans, Khatiyan copies, maps, or affidavits.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(createForm.attachments || []).map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end relative"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Document Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="Agreement Scan / Khatiyan"
                        className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-semibold text-slate-800 outline-none"
                        value={att.fileName}
                        onChange={(e) => handleAttachmentChange(idx, 'fileName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Document Category</label>
                      <select
                        className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-medium outline-none cursor-pointer"
                        value={att.fileType || 'Agreement Scan'}
                        onChange={(e) => handleAttachmentChange(idx, 'fileType', e.target.value)}
                      >
                        <option value="Agreement Scan">Agreement Scan</option>
                        <option value="Khatiyan (7/12)">Khatiyan (7/12)</option>
                        <option value="LPC / Mutation">LPC / Mutation</option>
                        <option value="Affidavit">Affidavit / शपथ पत्र</option>
                        <option value="Revenue Receipt">Revenue Receipt (लगान रसीद)</option>
                        <option value="Naksha / Map">Naksha / Land Map</option>
                        <option value="Other">Other Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Upload File (PDF / Image)</label>
                      {att.fileUrl ? (
                        <div className="flex items-center justify-between h-8 px-2 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-800">
                          <span className="truncate max-w-[120px]">{att.fileName || 'Uploaded File'}</span>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-0.5"
                          >
                            View <ExternalLink size={11} />
                          </a>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-1.5 h-8 bg-white border border-dashed border-teal-400 hover:bg-teal-50 text-teal-700 rounded-lg text-xs font-bold cursor-pointer transition">
                          <UploadCloud size={14} />
                          <span>{uploadingIdx === idx ? 'Uploading...' : 'Choose File'}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="application/pdf,image/*"
                            disabled={uploadingIdx === idx}
                            onChange={(e) => handleFileUpload(idx, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Note / Description</label>
                        <input
                          type="text"
                          placeholder="Optional remark"
                          className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-medium outline-none"
                          value={att.description || ''}
                          onChange={(e) => handleAttachmentChange(idx, 'description', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachmentRow(idx)}
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition cursor-pointer mb-0.5"
                        title="Remove attachment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              Total Agreed: <strong className="text-emerald-700 font-bold">₹{calculatedTotalCost.toLocaleString('en-IN')}</strong> for{' '}
              <strong className="text-teal-800 font-bold">{totalDismil} Dismil</strong> ({parcels.length} plots/land)
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading || uploadingIdx !== null || parcels.length === 0}
                className="px-6 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {createLoading ? 'Saving Purchase Agreement...' : 'Save Plot Purchase Agreement'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default CreateAgreementModal;
