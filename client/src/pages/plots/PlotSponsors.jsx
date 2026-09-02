import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useApi } from '../../utils/useApi';
import Modalbox from '../../components/custommodal/Modalbox';
import DataTable from '@/components/common/DataTable';
import {
  Plus,
  Edit2,
  Search,
  Eye,
  Trash2,
  Lock,
  Unlock,
  IndianRupee,
  Banknote,
  KeyRound,
  TrendingUp,
  Camera,
  PenTool,
  User,
} from 'lucide-react';
import { toast } from '../../utils/toast';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import PageLoader from '../../components/common/PageLoader';
import useImageUpload from '../../utils/imageresizer';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

const PlotSponsors = () => {
  const navigate = useNavigate();
  const { handleImage } = useImageUpload();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [viewingSponsor, setViewingSponsor] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

  const customStyles = useCustomStyles();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    currentAddress: '',
    permanentAddress: '',
    sameAsCurrentAddress: false,
    dob: '',
    occupation: '',
    gender: 'Male',
    nomineeName: '',
    nomineeRelation: '',
    nomineeAge: '',
    panCard: '',
    aadhaarCard: '',
    photo: '',
    signature: '',
    commissionRate: 0,
    sponsorId: 'direct',
  });

  const { request, loading: submitLoading } = useApi();

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const res = await apiClient({
        url: 'plots/sponsors',
        params: { search },
      });
      setSponsors(res.data || res.sponsors || res || []);
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, [search]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const webpFile = await handleImage(350, file, 0.85);

      const fd = new FormData();
      fd.append('file', webpFile);
      fd.append('folder', 'ems/plots/sponsors/photos');

      const res = await apiClient({
        url: 'plots/upload-media',
        method: 'POST',
        body: fd,
      });

      const url = res.data?.url || res.url;
      if (url) {
        setFormData((prev) => ({ ...prev, photo: url }));
        toast.success('Sponsor photo uploaded & compressed (WebP)');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload sponsor photo');
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
      const webpFile = await handleImage(400, file, 0.85);

      const fd = new FormData();
      fd.append('file', webpFile);
      fd.append('folder', 'ems/plots/sponsors/signatures');

      const res = await apiClient({
        url: 'plots/upload-media',
        method: 'POST',
        body: fd,
      });

      const url = res.data?.url || res.url;
      if (url) {
        setFormData((prev) => ({ ...prev, signature: url }));
        toast.success('Sponsor signature uploaded & compressed (WebP)');
      }
    } catch (err) {
      console.error('Signature upload error:', err);
      toast.error('Failed to upload sponsor signature');
    } finally {
      setUploadingSign(false);
      e.target.value = '';
    }
  };

  const handleOpenModal = (sponsor = null) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setFormData({
        name: sponsor.name || '',
        email: sponsor.email || '',
        mobile: sponsor.mobile || '',
        address: sponsor.address || '',
        currentAddress: sponsor.currentAddress || sponsor.address || '',
        permanentAddress: sponsor.permanentAddress || '',
        sameAsCurrentAddress: Boolean(sponsor.sameAsCurrentAddress),
        dob: sponsor.dob || '',
        occupation: sponsor.occupation || '',
        gender: sponsor.gender || 'Male',
        nomineeName: sponsor.nomineeName || '',
        nomineeRelation: sponsor.nomineeRelation || '',
        nomineeAge: sponsor.nomineeAge || '',
        panCard: sponsor.panCard || '',
        aadhaarCard: sponsor.aadhaarCard || '',
        photo: sponsor.photo || sponsor.profileImage || '',
        signature: sponsor.signature || '',
        commissionRate: sponsor.commissionRate || 0,
        sponsorId: sponsor.sponsorId?._id || sponsor.sponsorId || 'direct',
      });
    } else {
      setEditingSponsor(null);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        address: '',
        currentAddress: '',
        permanentAddress: '',
        sameAsCurrentAddress: false,
        dob: '',
        occupation: '',
        gender: 'Male',
        nomineeName: '',
        nomineeRelation: '',
        nomineeAge: '',
        panCard: '',
        aadhaarCard: '',
        photo: '',
        signature: '',
        commissionRate: 0,
        sponsorId: 'direct',
      });
    }
    setShowModal(true);
  };

  const handleOpenViewModal = (sponsor) => {
    setViewingSponsor(sponsor);
    setShowViewModal(true);
  };

  const handleToggleBlock = async (sponsor) => {
    const actionStr = sponsor.isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${actionStr} sponsor ${sponsor.name}?`)) {
      return;
    }
    try {
      await request({
        url: `plots/sponsors/${sponsor._id}/toggle-block`,
        method: 'PATCH',
      });
      toast.success(`Sponsor ${sponsor.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchSponsors();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle sponsor block state');
    }
  };

  const handleDeleteSponsor = async (sponsor) => {
    if (!window.confirm(`Are you sure you want to delete sponsor "${sponsor.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await request({
        url: `plots/sponsors/${sponsor._id}`,
        method: 'DELETE',
      });
      toast.success('Sponsor deleted successfully');
      fetchSponsors();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete sponsor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSponsor) {
        await request({
          url: `plots/sponsors/${editingSponsor._id}`,
          method: 'PUT',
          body: formData,
        });
        toast.success('Sponsor updated successfully');
      } else {
        await request({
          url: 'plots/sponsors',
          method: 'POST',
          body: formData,
        });
        toast.success('Sponsor created successfully');
      }
      setShowModal(false);
      fetchSponsors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (sponsor) => {
    const newPwd = window.prompt(`Enter new password for sponsor "${sponsor.name}" (Leave empty for default "123456"):`, '123456');
    if (newPwd === null) return; // user cancelled

    try {
      const res = await request({
        url: `plots/sponsors/${sponsor._id}/reset-password`,
        method: 'POST',
        body: { password: newPwd.trim() || '123456' },
      });
      toast.success(res.data?.message || `Password reset successfully to: ${newPwd.trim() || '123456'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const columns = [
    {
      name: 'S.No',
      selector: (row, idx) => idx + 1,
      width: '65px',
    },
    {
      name: 'Name',
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
            {row.photo || row.profileImage ? (
              <img
                src={cloudinaryUrl(row.photo || row.profileImage, { format: 'webp', width: 80, height: 80, crop: 'fill' })}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={14} className="text-slate-400" />
            )}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Sponsor ID',
      selector: (row) => row.sponsorCode || 'N/A',
      sortable: true,
      width: '140px',
    },
    {
      name: 'Referring Sponsor',
      selector: (row) => row.sponsorId?.name ? `${row.sponsorId.name} (${row.sponsorId.sponsorCode || ''})` : 'Company (Direct)',
      cell: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.sponsorId?.name ? (
            <span className="font-semibold text-slate-900">{row.sponsorId.name} <span className="font-mono text-slate-500">({row.sponsorId.sponsorCode || ''})</span></span>
          ) : (
            <span className="text-emerald-700 font-bold">🏢 Company Direct</span>
          )}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Mobile',
      selector: (row) => row.mobile || 'N/A',
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row) => row.email || 'N/A',
    },
    {
      name: 'Status / Access',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${row.isBlocked
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 font-bold'
            }`}
        >
          {row.isBlocked ? 'Blocked' : 'Active'}
        </span>
      ),
    },
    {
      name: 'Actions',
      width: '260px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenViewModal(row)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="View Details"
          >
            <Eye size={17} />
          </button>
          <button
            onClick={() => navigate(`/dashboard/plots/sponsors/${row._id}/business-report`)}
            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            title="View Date-Wise Business & Commission Report (Self + Downlines)"
          >
            <TrendingUp size={17} className="text-blue-700" />
          </button>
          <button
            onClick={() => {
              const targetLedgerId = row.ledgerId || row._id;
              const nameParam = encodeURIComponent(row.name || 'Sponsor');
              const empIdParam = encodeURIComponent(row.sponsorCode || row.customerId || '');
              const imgParam = row.profileImage ? `&profileimage=${encodeURIComponent(row.profileImage)}` : '';
              navigate(`/dashboard/ledger/${targetLedgerId}?name=${nameParam}&empid=${empIdParam}&ledgertype=sponsor${imgParam}`);
            }}
            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
            title="View Sponsor Financial Ledger"
          >
            <Banknote size={17} className="text-teal-700" />
          </button>
          <button
            onClick={() => handleResetPassword(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
            title="Reset Login Password"
          >
            <KeyRound size={17} />
          </button>
          <button
            onClick={() => handleOpenModal(row)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Edit Sponsor"
          >
            <Edit2 size={17} />
          </button>
          <button
            onClick={() => handleToggleBlock(row)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${row.isBlocked
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-amber-600 hover:bg-amber-50'
              }`}
            title={row.isBlocked ? 'Unblock Sponsor Login' : 'Block Sponsor Login'}
          >
            {row.isBlocked ? (
              <Unlock size={17} />
            ) : (
              <Lock size={17} />
            )}
          </button>
          <button
            onClick={() => handleDeleteSponsor(row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Delete Sponsor"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plot Sponsors</h1>
          <p className="text-slate-500 text-sm">Manage plot project sponsors, hierarchy and commissions</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer bg-primary text-sm"
          >
            <Plus size={18} />
            Add New Sponsor
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex items-center gap-3 border border-slate-200">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search sponsor by ID (e.g. GNE-26-27-001), name, mobile, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={sponsors}
          progressPending={loading}
          progressComponent={
            <PageLoader
              fullScreen={false}
              minHeight="min-h-[240px]"
              title="Loading Plot Sponsors..."
              subtitle="Fetching sponsor hierarchy, codes and contact details"
            />
          }
          customStyles={customStyles}
          pagination
          responsive
          highlightOnHover
        />
      </div>

      {/* Create/Edit Modal */}
      <Modalbox open={showModal} onClose={() => setShowModal(false)}>
        <div className="membermodal w-[600px] max-w-[95vw]">
          <form onSubmit={handleSubmit}>
            <h2>{editingSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}</h2>
            <div className="modalcontent space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Referring Sponsor / Direct Company *</label>
                <select
                  required
                  value={formData.sponsorId}
                  onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none bg-white font-medium text-slate-800"
                >
                  <option value="direct">🏢 Company Direct (Becomes a Developer Sponsor)</option>
                  {sponsors
                    .filter((s) => s._id !== editingSponsor?._id && !s.sponsorId)
                    .map((sp) => (
                      <option key={sp._id} value={sp._id}>
                        👑 {sp.name} ({sp.sponsorCode || 'Developer Sponsor'})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  2-Level Hierarchy: Selecting <strong>Company Direct</strong> creates a <strong>Developer Sponsor</strong>. Selecting an existing Developer Sponsor creates a <strong>Sub-Sponsor</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                  placeholder="Enter sponsor name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, mobile: val });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PAN Card</label>
                  <input
                    type="text"
                    value={formData.panCard}
                    onChange={(e) => setFormData({ ...formData, panCard: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none uppercase text-slate-800"
                    placeholder="PAN Card number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Aadhaar Card</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    value={formData.aadhaarCard}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setFormData({ ...formData, aadhaarCard: val });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                    placeholder="12-digit Aadhaar number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                    placeholder="e.g. Business / Service"
                  />
                </div>
              </div>

              {/* Nominee Details Section (Optional) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nominee Details (Optional)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Nominee Name</label>
                    <input
                      type="text"
                      value={formData.nomineeName}
                      onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                      placeholder="Nominee full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Relation</label>
                    <input
                      type="text"
                      value={formData.nomineeRelation}
                      onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                      placeholder="e.g. Spouse / Son"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Nominee Age</label>
                    <input
                      type="number"
                      value={formData.nomineeAge}
                      onChange={(e) => setFormData({ ...formData, nomineeAge: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                      placeholder="Age"
                    />
                  </div>
                </div>
              </div>

              {/* Photo & Signature Upload Section */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Photo & Signature (Optimized WebP)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Sponsor Photo */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-semibold text-slate-600 mb-1.5">Profile Photo</span>
                    <div className="relative w-20 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden group shadow-2xs">
                      {formData.photo ? (
                        <>
                          <img
                            src={cloudinaryUrl(formData.photo, { format: 'webp', width: 160, height: 190, crop: 'fill' })}
                            alt="Sponsor Photo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                            className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                          <Camera size={20} className="mb-0.5 text-slate-400" />
                          <span className="text-[9px]">Passport Photo</span>
                        </div>
                      )}
                    </div>
                    <label className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md cursor-pointer shadow-2xs transition">
                      <Camera size={12} className="text-indigo-600" />
                      <span>{uploadingPhoto ? 'Compressing...' : formData.photo ? 'Change' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Sponsor Signature */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-semibold text-slate-600 mb-1.5">Digital Signature</span>
                    <div className="relative w-36 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden group shadow-2xs p-1">
                      {formData.signature ? (
                        <>
                          <img
                            src={cloudinaryUrl(formData.signature, { format: 'webp', width: 200, height: 100, crop: 'fit' })}
                            alt="Sponsor Signature"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, signature: '' }))}
                            className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                            title="Remove Signature"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                          <PenTool size={18} className="mb-0.5 text-slate-400" />
                          <span className="text-[9px]">Signature</span>
                        </div>
                      )}
                    </div>
                    <label className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md cursor-pointer shadow-2xs transition">
                      <PenTool size={12} className="text-indigo-600" />
                      <span>{uploadingSign ? 'Compressing...' : formData.signature ? 'Change' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        disabled={uploadingSign}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current / Temporary Address</label>
                  <textarea
                    rows={2}
                    value={formData.currentAddress}
                    onChange={(e) => {
                      const newCurrent = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: newCurrent,
                        address: newCurrent,
                        permanentAddress: prev.sameAsCurrentAddress ? newCurrent : prev.permanentAddress,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                    placeholder="Current address details..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAsCurrentAddress"
                    checked={formData.sameAsCurrentAddress}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        sameAsCurrentAddress: checked,
                        permanentAddress: checked ? prev.currentAddress : prev.permanentAddress,
                      }));
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-teal-600 cursor-pointer"
                  />
                  <label htmlFor="sameAsCurrentAddress" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Permanent Address same as Current Address
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Permanent Address</label>
                  <textarea
                    rows={2}
                    disabled={formData.sameAsCurrentAddress}
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none ${
                      formData.sameAsCurrentAddress ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'text-slate-800'
                    }`}
                    placeholder="Permanent address details..."
                  />
                </div>
              </div>
            </div>

            <div className="btn border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitLoading ? 'Saving...' : editingSponsor ? 'Update Sponsor' : 'Create Sponsor'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* View Details Modal */}
      <Modalbox open={showViewModal} onClose={() => setShowViewModal(false)}>
        <div className="membermodal w-[600px] max-w-[95vw]">
          <div className="whole">
            <h2 className="flex items-center justify-between px-6">
              <span>Sponsor Details</span>
              <span className="font-mono text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-md">
                {viewingSponsor?.sponsorCode || 'N/A'}
              </span>
            </h2>

            {viewingSponsor && (
              <div className="modalcontent space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-indigo-200 flex-shrink-0 flex items-center justify-center shadow-xs">
                      {viewingSponsor.photo || viewingSponsor.profileImage ? (
                        <img
                          src={cloudinaryUrl(viewingSponsor.photo || viewingSponsor.profileImage, { format: 'webp', width: 140, height: 140, crop: 'fill' })}
                          alt={viewingSponsor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Full Name</p>
                      <p className="font-bold text-slate-900 text-base">{viewingSponsor.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Referring Sponsor</p>
                    <p className="font-bold text-purple-700">
                      {viewingSponsor.sponsorId?.name
                        ? `${viewingSponsor.sponsorId.name} (${viewingSponsor.sponsorId.sponsorCode || ''})`
                        : '🏢 Company (Direct)'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Gender</p>
                    <p className="font-medium text-slate-700">{viewingSponsor.gender || 'Male'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Date of Birth</p>
                    <p className="font-medium text-slate-700">{viewingSponsor.dob || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Occupation</p>
                    <p className="font-medium text-slate-700">{viewingSponsor.occupation || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Mobile Number</p>
                    <p className="font-medium text-slate-700">{viewingSponsor.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Email Address</p>
                    <p className="font-medium text-slate-700 break-all">{viewingSponsor.email || 'N/A'}</p>
                  </div>
                </div>

                {/* ID Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">PAN Card</p>
                    <p className="font-medium text-slate-700 uppercase">{viewingSponsor.panCard || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Aadhaar Card</p>
                    <p className="font-medium text-slate-700">{viewingSponsor.aadhaarCard || 'N/A'}</p>
                  </div>
                </div>

                {/* Sponsor Signature Card */}
                {viewingSponsor.signature && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Digital Signature</p>
                      <p className="text-[11px] text-slate-500">Verified digital record</p>
                    </div>
                    <div className="h-12 w-32 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                      <img
                        src={cloudinaryUrl(viewingSponsor.signature, { format: 'webp', width: 200, height: 80, crop: 'fit' })}
                        alt="Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Nominee details preview */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Nominee Details</p>
                  <p className="font-semibold text-slate-800">
                    {viewingSponsor.nomineeName ? (
                      <>
                        {viewingSponsor.nomineeName}
                        {viewingSponsor.nomineeRelation ? ` (${viewingSponsor.nomineeRelation})` : ''}
                        {viewingSponsor.nomineeAge ? ` - ${viewingSponsor.nomineeAge} yrs` : ''}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Current / Temporary Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                    {viewingSponsor.currentAddress || viewingSponsor.address || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Permanent Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                    {viewingSponsor.permanentAddress || viewingSponsor.currentAddress || viewingSponsor.address || 'N/A'}
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex justify-between border-t border-slate-100">
                  <span>Created: {new Date(viewingSponsor.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>Role: {viewingSponsor.role}</span>
                </div>
              </div>
            )}

            <div className="btn border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modalbox>
    </div>
  );
};

export default PlotSponsors;
