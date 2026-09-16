import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../../utils/apiClient';
import { useApi } from '../../../utils/useApi';
import Modalbox from '../../../components/custommodal/Modalbox';
import DataTable from '@/components/common/DataTable';
import { Button } from '../../../components/ui/Button';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import {
  Edit2,
  Search,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Banknote,
  KeyRound,
  TrendingUp,
  Camera,
  PenTool,
  User,
  Crown,
  Users,
  Building2,
} from 'lucide-react';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import PageLoader from '../../../components/common/PageLoader';
import useImageUpload from '../../../utils/imageresizer';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

const PlotBusinessDevelopers = () => {
  const navigate = useNavigate();
  const { handleImage } = useImageUpload();
  const { branch, profile } = useSelector((state) => state.user || {});

  const [businessDevelopers, setBusinessDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all'); // 'all' | 'partner' | 'associate'
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [createMode, setCreateMode] = useState('partner'); // 'partner' | 'associate'
  const [editingDeveloper, setEditingDeveloper] = useState(null);
  const [viewingDeveloper, setViewingDeveloper] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

  const customStyles = useCustomStyles();

  // Branch visibility scoping
  const userBranchIds = useMemo(() => {
    return (profile?.branchIds || []).map((b) => (typeof b === 'object' && b?._id ? b._id.toString() : b?.toString()));
  }, [profile]);

  const isRestrictedUser = useMemo(() => {
    const role = profile?.role;
    return role === 'manager' || (role !== 'admin' && role !== 'superadmin' && role !== 'developer' && userBranchIds.length > 0);
  }, [profile, userBranchIds]);

  const { availableBranches } = useMemo(() => {
    const allBranches = Array.isArray(branch) ? branch : [];
    if (!isRestrictedUser) {
      return { availableBranches: allBranches };
    }
    const filtered = allBranches.filter((b) => userBranchIds.includes(b?._id?.toString()));
    return { availableBranches: filtered };
  }, [branch, isRestrictedUser, userBranchIds]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    panNumber: '',
    aadhaarNumber: '',
    gender: 'Male',
    dob: '',
    occupation: '',
    photo: '',
    signature: '',
    address: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branch: '',
    },
    nominee: {
      name: '',
      relation: '',
      age: '',
    },
    sponsorId: 'direct',
    branchId: '',
  });

  const { request, loading: submitLoading } = useApi();

  const fetchBusinessDevelopers = async () => {
    setLoading(true);
    try {
      const params = { search };
      if (selectedBranchFilter && selectedBranchFilter !== 'all') {
        params.branchId = selectedBranchFilter;
      }
      if (selectedRoleFilter && selectedRoleFilter !== 'all') {
        params.roleType = selectedRoleFilter;
      }
      const res = await apiClient({
        url: 'plots/sponsors',
        params,
      });
      setBusinessDevelopers(res.data || res.sponsors || res || []);
    } catch (err) {
      console.error('Failed to fetch business developers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessDevelopers();
  }, [search, selectedBranchFilter, selectedRoleFilter]);

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
        toast.success('Business developer photo uploaded & compressed (WebP)');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload business developer photo');
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
        toast.success('Business developer signature uploaded & compressed (WebP)');
      }
    } catch (err) {
      console.error('Signature upload error:', err);
      toast.error('Failed to upload business developer signature');
    } finally {
      setUploadingSign(false);
      e.target.value = '';
    }
  };

  const handleOpenModal = (developer = null, mode = 'partner') => {
    const defaultBranch = availableBranches.length === 1 ? availableBranches[0]._id : (availableBranches[0]?._id || '');

    if (developer) {
      setEditingDeveloper(developer);
      setCreateMode(developer.sponsorId ? 'associate' : 'partner');
      const existingBranchId = developer.branchIds?.[0]?._id || developer.branchIds?.[0] || '';
      setFormData({
        name: developer.name || '',
        email: developer.email || '',
        mobile: developer.mobile || '',
        address: developer.address || '',
        currentAddress: developer.currentAddress || developer.address || '',
        permanentAddress: developer.permanentAddress || '',
        sameAsCurrentAddress: Boolean(developer.sameAsCurrentAddress),
        dob: developer.dob || '',
        occupation: developer.occupation || '',
        gender: developer.gender || 'Male',
        nomineeName: developer.nomineeName || '',
        nomineeRelation: developer.nomineeRelation || '',
        nomineeAge: developer.nomineeAge || '',
        panCard: developer.panCard || '',
        aadhaarCard: developer.aadhaarCard || '',
        photo: developer.photo || developer.profileImage || '',
        signature: developer.signature || '',
        commissionRate: developer.commissionRate || 0,
        sponsorId: developer.sponsorId?._id || developer.sponsorId || 'direct',
        branchId: existingBranchId || defaultBranch,
      });
    } else {
      setEditingDeveloper(null);
      setCreateMode(mode);
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
        sponsorId: mode === 'partner' ? 'direct' : '',
        branchId: defaultBranch,
      });
    }
    setShowModal(true);
  };

  const handleOpenViewModal = (developer) => {
    setViewingDeveloper(developer);
    setShowViewModal(true);
  };

  const handleToggleBlock = async (developer) => {
    const actionStr = developer.isBlocked ? 'unblock' : 'block';
    const proceed = await confirmDialog({
      title: `${developer.isBlocked ? 'Unblock' : 'Block'} Business Developer?`,
      text: `Are you sure you want to ${actionStr} business developer "${developer.name}"?`,
      confirmText: developer.isBlocked ? 'Unblock' : 'Block',
      cancelText: 'Cancel',
      isDanger: !developer.isBlocked,
    });
    if (!proceed) return;

    try {
      await request({
        url: `plots/sponsors/${developer._id}/toggle-block`,
        method: 'PATCH',
      });
      toast.success(`Business Developer ${developer.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchBusinessDevelopers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle business developer block state');
    }
  };

  const handleDeleteDeveloper = async (developer) => {
    const proceed = await confirmDialog({
      title: 'Delete Business Developer?',
      text: `Are you sure you want to delete business developer "${developer.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;

    try {
      await request({
        url: `plots/sponsors/${developer._id}`,
        method: 'DELETE',
      });
      toast.success('Business Developer deleted successfully');
      fetchBusinessDevelopers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete business developer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.branchId) {
      toast.error('Please select a branch');
      return;
    }

    if (createMode === 'associate' && (!formData.sponsorId || formData.sponsorId === 'direct')) {
      toast.error('Please select a Business Partner for this Business Associate');
      return;
    }

    try {
      if (editingDeveloper) {
        await request({
          url: `plots/sponsors/${editingDeveloper._id}`,
          method: 'PUT',
          body: formData,
        });
        toast.success('Business Developer updated successfully');
      } else {
        await request({
          url: 'plots/sponsors',
          method: 'POST',
          body: formData,
        });
        toast.success(
          createMode === 'partner'
            ? 'Business Partner created successfully'
            : 'Business Associate created successfully'
        );
      }
      setShowModal(false);
      fetchBusinessDevelopers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save business developer');
    }
  };

  const handleResetPassword = async (developer) => {
    const newPwd = window.prompt(`Enter new password for business developer "${developer.name}" (Leave empty for default "123456"):`, '123456');
    if (newPwd === null) return; // user cancelled

    try {
      const res = await request({
        url: `plots/sponsors/${developer._id}/reset-password`,
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
            <span className="font-semibold text-slate-900 block leading-tight">
              {row.name?.replace(/\s*\([^)]*\)/g, '') || row.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: 'Business Dev ID',
      selector: (row) => row.sponsorCode || 'N/A',
      sortable: true,
      width: '150px',
      cell: (row) => (
        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
          row.sponsorCode?.startsWith('P/') 
            ? 'bg-amber-50 text-amber-900 border-amber-200' 
            : row.sponsorCode?.startsWith('A/')
            ? 'bg-teal-50 text-teal-900 border-teal-200'
            : 'bg-slate-100 text-slate-800 border-slate-200'
        }`}>
          {row.sponsorCode || 'N/A'}
        </span>
      ),
    },
    {
      name: 'Designation / Role',
      selector: (row) => (row.sponsorId ? 'Business Associate' : 'Business Partner'),
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            !row.sponsorId
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {!row.sponsorId ? '👑 Business Partner' : '👥 Business Associate'}
        </span>
      ),
      sortable: true,
      width: '160px',
    },
    {
      name: 'Parent Partner',
      selector: (row) => (row.sponsorId?.name ? `${row.sponsorId.name.replace(/\s*\([^)]*\)/g, '')} (${row.sponsorId.sponsorCode || ''})` : 'Company Direct'),
      cell: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.sponsorId?.name ? (
            <span className="font-semibold text-slate-900">
              {row.sponsorId.name.replace(/\s*\([^)]*\)/g, '')}{' '}
              <span className="font-mono text-slate-500">({row.sponsorId.sponsorCode || ''})</span>
            </span>
          ) : (
            <span className="text-emerald-700 font-bold">🏢 Company Direct</span>
          )}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Branch',
      selector: (row) => row.branchIds?.map((b) => b.name || b).join(', ') || 'N/A',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.branchIds && row.branchIds.length > 0 ? (
            row.branchIds.map((b) => (
              <span
                key={b._id || b}
                className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] mr-1 border border-slate-200 font-medium"
              >
                <Building2 size={11} className="text-teal-700" />
                {b.name || b}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs italic">All / None</span>
          )}
        </span>
      ),
      sortable: true,
      width: '160px',
    },
    {
      name: 'Status / Access',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            row.isBlocked ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 font-bold'
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
            onClick={() => navigate(`/dashboard/plots/business-developer/${row._id}/business-report`)}
            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            title="View Date-Wise Business & Commission Report (Self + Downlines)"
          >
            <TrendingUp size={17} className="text-blue-700" />
          </button>
          <button
            onClick={() => {
              const targetLedgerId = row.ledgerId || row._id;
              const nameParam = encodeURIComponent(row.name || 'Business Developer');
              const empIdParam = encodeURIComponent(row.sponsorCode || row.customerId || '');
              const imgParam = row.profileImage ? `&profileimage=${encodeURIComponent(row.profileImage)}` : '';
              navigate(`/dashboard/ledger/${targetLedgerId}?name=${nameParam}&empid=${empIdParam}&ledgertype=sponsor${imgParam}`);
            }}
            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
            title="View Financial Ledger"
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
            title="Edit Business Developer"
          >
            <Edit2 size={17} />
          </button>
          <button
            onClick={() => handleToggleBlock(row)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              row.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
            }`}
            title={row.isBlocked ? 'Unblock Developer Login' : 'Block Developer Login'}
          >
            {row.isBlocked ? <Unlock size={17} /> : <Lock size={17} />}
          </button>
          <button
            onClick={() => handleDeleteDeveloper(row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Delete Business Developer"
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
          <h1 className="text-2xl font-bold text-slate-800">Business Developers</h1>
          <p className="text-slate-500 text-sm">Manage plot project business partners, associates, and hierarchy</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            startIcon={Crown}
            onClick={() => handleOpenModal(null, 'partner')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            Create Business Partner
          </Button>
          <Button
            variant="primary"
            size="md"
            startIcon={Users}
            onClick={() => handleOpenModal(null, 'associate')}
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
          >
            Create Business Associate
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-3 border border-slate-200">
        <div className="flex items-center gap-2.5 flex-1 w-full px-2">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search business developer by ID (e.g. P/2627/001, A/2627/001), name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
          {/* Role / Hierarchy Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Crown size={15} className="text-amber-600 shrink-0" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Roles (BP & BA)</option>
              <option value="partner">👑 Business Partners (P/)</option>
              <option value="associate">👥 Business Associates (A/)</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Building2 size={16} className="text-teal-700 shrink-0" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Available Branches</option>
              {availableBranches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={businessDevelopers}
          progressPending={loading}
          progressComponent={
            <PageLoader
              fullScreen={false}
              minHeight="min-h-[240px]"
              title="Loading Business Developers..."
              subtitle="Fetching business developer hierarchy, codes and contact details"
            />
          }
          customStyles={customStyles}
          pagination
          responsive
          highlightOnHover
        />
      </div>

      {/* Create/Edit Modal */}
      <Modalbox open={showModal} onClose={() => setShowModal(false)} size="xl" outside={false}>
        <div className="w-full p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingDeveloper ? (
                  <>
                    <Edit2 size={20} className="text-slate-600" />
                    <span>Edit Business Developer ({editingDeveloper.sponsorCode || ''})</span>
                  </>
                ) : createMode === 'partner' ? (
                  <>
                    <Crown size={20} className="text-amber-600" />
                    <span>Create Business Partner</span>
                  </>
                ) : (
                  <>
                    <Users size={20} className="text-teal-700" />
                    <span>Create Business Associate</span>
                  </>
                )}
              </h2>
            </div>

            <div className="modalcontent space-y-4">
              {/* Partner Mode: Branch Selection */}
              {!editingDeveloper && createMode === 'partner' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Branch *
                  </label>
                  <SearchableSelect
                    required
                    value={formData.branchId}
                    onChange={(val) => setFormData({ ...formData, branchId: val })}
                    options={availableBranches.map((b) => ({
                      value: b._id,
                      label: b.name,
                      subtitle: b.location || '',
                    }))}
                    placeholder="Select Branch..."
                    searchPlaceholder="Search branch by name or location..."
                  />
                </div>
              )}

              {/* Associate Mode: Partner & Branch Selection */}
              {!editingDeveloper && createMode === 'associate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Partner *
                    </label>
                    <SearchableSelect
                      required
                      value={formData.sponsorId}
                      onChange={(selPartnerId) => {
                        const partner = businessDevelopers.find((s) => s._id === selPartnerId);
                        const partnerBranchId = partner?.branchIds?.[0]?._id || partner?.branchIds?.[0] || '';
                        setFormData((prev) => ({
                          ...prev,
                          sponsorId: selPartnerId,
                          branchId: partnerBranchId || prev.branchId || (availableBranches[0]?._id || ''),
                        }));
                      }}
                      options={businessDevelopers
                        .filter((s) => !s.sponsorId)
                        .map((sp) => {
                          const bName = sp.branchIds?.[0]?.name ? ` (${sp.branchIds[0].name})` : '';
                          return {
                            value: sp._id,
                            label: `${sp.name} (${sp.sponsorCode || 'Partner'})`,
                            subtitle: bName ? `Branch:${bName}` : undefined,
                          };
                        })}
                      placeholder="Select Business Partner..."
                      searchPlaceholder="Search partner by name or code..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Branch (Fixed from Partner)
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        availableBranches.find((b) => b._id === formData.branchId)?.name
                          ? `${availableBranches.find((b) => b._id === formData.branchId)?.name}${
                              availableBranches.find((b) => b._id === formData.branchId)?.location
                                ? ` (${availableBranches.find((b) => b._id === formData.branchId)?.location})`
                                : ''
                            }`
                          : formData.sponsorId
                          ? 'No Branch Mapped'
                          : 'Select Business Partner First...'
                      }
                      className="h-10 w-full px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              )}

              {/* In Edit Mode, allow modifying hierarchy and branch */}
              {editingDeveloper && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hierarchy Role / Parent Partner *
                    </label>
                    <SearchableSelect
                      required
                      value={formData.sponsorId}
                      onChange={(val) => setFormData({ ...formData, sponsorId: val })}
                      options={[
                        { value: 'direct', label: 'Company Direct (Business Partner)' },
                        ...businessDevelopers
                          .filter((s) => s._id !== editingDeveloper._id && !s.sponsorId)
                          .map((sp) => ({
                            value: sp._id,
                            label: `${sp.name} (${sp.sponsorCode || 'Business Partner'})`,
                          })),
                      ]}
                      placeholder="Select Parent / Hierarchy..."
                      searchPlaceholder="Search partner..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Branch *
                    </label>
                    <SearchableSelect
                      required
                      value={formData.branchId}
                      onChange={(val) => setFormData({ ...formData, branchId: val })}
                      options={availableBranches.map((b) => ({
                        value: b._id,
                        label: b.name,
                        subtitle: b.location || '',
                      }))}
                      placeholder="Select Branch..."
                      searchPlaceholder="Search branch..."
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none text-slate-800"
                  placeholder="Enter full name"
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
                  {/* Photo */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-semibold text-slate-600 mb-1.5">Profile Photo</span>
                    <div className="relative w-20 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden group shadow-2xs">
                      {formData.photo ? (
                        <>
                          <img
                            src={cloudinaryUrl(formData.photo, { format: 'webp', width: 160, height: 190, crop: 'fill' })}
                            alt="Business Developer Photo"
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

                  {/* Signature */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-semibold text-slate-600 mb-1.5">Digital Signature</span>
                    <div className="relative w-36 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden group shadow-2xs p-1">
                      {formData.signature ? (
                        <>
                          <img
                            src={cloudinaryUrl(formData.signature, { format: 'webp', width: 200, height: 100, crop: 'fit' })}
                            alt="Signature"
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

            <div className="btn border-t border-slate-100 mt-6 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitLoading
                  ? 'Saving...'
                  : editingDeveloper
                  ? 'Update Business Developer'
                  : createMode === 'partner'
                  ? 'Create Business Partner'
                  : 'Create Business Associate'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* View Details Modal */}
      <Modalbox open={showViewModal} onClose={() => setShowViewModal(false)} size="xl" outside={false}>
        <div className="w-full p-6">
          <div className="whole">
            <h2 className="flex items-center justify-between pb-3 border-b border-slate-100 text-lg font-bold text-slate-800">
              <span>Business Developer Details</span>
              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                {viewingDeveloper?.sponsorCode || 'N/A'}
              </span>
            </h2>

            {viewingDeveloper && (
              <div className="modalcontent space-y-4 text-sm mt-4">
                <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-indigo-200 flex-shrink-0 flex items-center justify-center shadow-xs">
                      {viewingDeveloper.photo || viewingDeveloper.profileImage ? (
                        <img
                          src={cloudinaryUrl(viewingDeveloper.photo || viewingDeveloper.profileImage, { format: 'webp', width: 140, height: 140, crop: 'fill' })}
                          alt={viewingDeveloper.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Full Name</p>
                      <p className="font-bold text-slate-900 text-base">{viewingDeveloper.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Hierarchy Role</p>
                    <p className="font-bold text-teal-800">
                      {viewingDeveloper.sponsorId?.name
                        ? `👥 Business Associate (under ${viewingDeveloper.sponsorId.name})`
                        : '👑 Business Partner (Direct Company)'}
                    </p>
                  </div>
                </div>

                {/* Branch & Sponsoring Partner info */}
                <div className="grid grid-cols-2 gap-4 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Assigned Branch</p>
                    <p className="font-semibold text-teal-900 flex items-center gap-1.5 mt-0.5">
                      <Building2 size={15} className="text-teal-700" />
                      {viewingDeveloper.branchIds && viewingDeveloper.branchIds.length > 0
                        ? viewingDeveloper.branchIds.map((b) => b.name || b).join(', ')
                        : 'Company Head Office / All'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Parent Partner</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewingDeveloper.sponsorId?.name
                        ? `${viewingDeveloper.sponsorId.name} (${viewingDeveloper.sponsorId.sponsorCode || ''})`
                        : '🏢 Company Direct'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Gender</p>
                    <p className="font-medium text-slate-700">{viewingDeveloper.gender || 'Male'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Date of Birth</p>
                    <p className="font-medium text-slate-700">{viewingDeveloper.dob || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Occupation</p>
                    <p className="font-medium text-slate-700">{viewingDeveloper.occupation || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Mobile Number</p>
                    <p className="font-medium text-slate-700">{viewingDeveloper.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Email Address</p>
                    <p className="font-medium text-slate-700 break-all">{viewingDeveloper.email || 'N/A'}</p>
                  </div>
                </div>

                {/* ID Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">PAN Card</p>
                    <p className="font-medium text-slate-700 uppercase">{viewingDeveloper.panCard || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Aadhaar Card</p>
                    <p className="font-medium text-slate-700">{viewingDeveloper.aadhaarCard || 'N/A'}</p>
                  </div>
                </div>

                {/* Signature Card */}
                {viewingDeveloper.signature && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Digital Signature</p>
                      <p className="text-[11px] text-slate-500">Verified digital record</p>
                    </div>
                    <div className="h-12 w-32 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                      <img
                        src={cloudinaryUrl(viewingDeveloper.signature, { format: 'webp', width: 200, height: 80, crop: 'fit' })}
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
                    {viewingDeveloper.nomineeName ? (
                      <>
                        {viewingDeveloper.nomineeName}
                        {viewingDeveloper.nomineeRelation ? ` (${viewingDeveloper.nomineeRelation})` : ''}
                        {viewingDeveloper.nomineeAge ? ` - ${viewingDeveloper.nomineeAge} yrs` : ''}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Current / Temporary Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                    {viewingDeveloper.currentAddress || viewingDeveloper.address || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Permanent Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                    {viewingDeveloper.permanentAddress || viewingDeveloper.currentAddress || viewingDeveloper.address || 'N/A'}
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex justify-between border-t border-slate-100">
                  <span>Created: {new Date(viewingDeveloper.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>Role: {viewingDeveloper.role}</span>
                </div>
              </div>
            )}

            <div className="btn border-t border-slate-100 mt-6 pt-4 flex justify-end">
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

export default PlotBusinessDevelopers;
