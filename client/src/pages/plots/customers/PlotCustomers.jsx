import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../utils/apiClient';
import { useApi } from '../../../utils/useApi';
import Modalbox from '../../../components/custommodal/Modalbox';
import DataTable from '@/components/common/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus, Eye, Edit2, Trash2, Search, User } from 'lucide-react';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import PageLoader from '../../../components/common/PageLoader';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import usePermission from '../../../utils/CheckPermission';

const PlotCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  const canCreate = usePermission('plot_customer', 2);
  const canUpdate = usePermission('plot_customer', 3);
  const canDelete = usePermission('plot_customer', 4);

  const customStyles = useCustomStyles();
  const { request } = useApi();

  const fetchPlotCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiClient({
        url: 'plots/customers',
        params: { search },
      });
      setCustomers(res.data || res.customers || res || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlotCustomers();
  }, [search]);

  const openViewModal = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const handleDeleteCustomer = async (customer) => {
    const proceed = await confirmDialog({
      title: 'Delete Customer?',
      text: `Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) {
      return;
    }
    try {
      await request({
        url: `plots/customers/${customer._id}`,
        method: 'DELETE',
      });
      toast.success('Customer deleted successfully');
      fetchPlotCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete customer');
    }
  };

  const columns = [
    {
      name: 'S.No',
      selector: (row, idx) => idx + 1,
      width: '60px',
    },
    {
      name: 'Customer ID',
      selector: (row) => row.customerCode || 'N/A',
      sortable: true,
      width: '130px',
    },
    {
      name: 'Customer Name',
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
      name: 'Mobile',
      selector: (row) => row.mobile || 'N/A',
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row) => row.email || 'N/A',
    },
    {
      name: 'Assigned Sponsor',
      selector: (row) => row.sponsorId?.name ? `${row.sponsorId.name}${row.sponsorId.sponsorCode ? ` (${row.sponsorId.sponsorCode})` : ''}` : 'Company (Direct)',
      sortable: true,
    },
    {
      name: 'Actions',
      width: '130px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openViewModal(row)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          {canUpdate && (
            <button
              onClick={() => navigate(`/dashboard/plots/customers/edit/${row._id}`)}
              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
              title="Edit Customer"
            >
              <Edit2 size={18} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteCustomer(row)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Delete Customer"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm">Manage customers registered under plot projects</p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            size="md"
            startIcon={Plus}
            onClick={() => navigate('/dashboard/plots/customers/new')}
          >
            Add New Customer
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex items-center gap-3 border border-slate-200">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search customer by ID (e.g. GNC-26-27-001), name, mobile, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={customers}
          progressPending={loading}
          progressComponent={
            <PageLoader
              fullScreen={false}
              minHeight="min-h-[240px]"
              title="Loading Customers..."
              subtitle="Fetching registered plot customer records"
            />
          }
          customStyles={customStyles}
          pagination
          responsive
          highlightOnHover
        />
      </div>

      {/* View Customer Details Modal */}
      <Modalbox
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        size="2xl"
        outside={false}
        title="Customer Profile & Details"
        subtitle={
          viewingUser
            ? `${viewingUser.name} • ${viewingUser.customerCode || viewingUser.customerId || 'No ID'}`
            : ''
        }
        footer={
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setShowViewModal(false)}
          >
            Close
          </Button>
        }
      >
        {viewingUser && (
          <div className="space-y-4 text-xs">
            {/* Top Profile Card Banner */}
            <div className="p-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 shrink-0 flex items-center justify-center backdrop-blur-xs shadow-inner">
                  {viewingUser.photo || viewingUser.profileImage ? (
                    <img
                      src={cloudinaryUrl(viewingUser.photo || viewingUser.profileImage, { format: 'webp', width: 140, height: 140, crop: 'fill' })}
                      alt={viewingUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={30} className="text-teal-200" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base tracking-tight">{viewingUser.name}</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active Customer
                    </span>
                  </div>
                  <p className="font-mono text-xs text-teal-200 mt-0.5 font-medium">
                    ID: {viewingUser.customerCode || viewingUser.customerId || 'N/A'}
                  </p>
                  <p className="text-[11px] text-teal-100/70 mt-0.5">
                    Registered: {new Date(viewingUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Sponsor Mapping Badge */}
              <div className="sm:text-right bg-white/10 border border-white/15 px-3.5 py-2 rounded-xl backdrop-blur-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 block mb-0.5">
                  Assigned Sponsor
                </span>
                <span className="font-bold text-xs text-white">
                  {viewingUser.sponsorId?.name
                    ? viewingUser.sponsorId.name
                    : '🏢 Company (Direct)'}
                </span>
              </div>
            </div>

            {/* Personal & Contact Details */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5">
                Personal & Contact Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {viewingUser.mobile || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-medium text-slate-700 truncate block" title={viewingUser.email || '—'}>
                    {viewingUser.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Gender</span>
                  <span className="font-medium text-slate-700 capitalize">{viewingUser.gender || 'Male'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Age</span>
                  <span className="font-medium text-slate-700">{viewingUser.age ? `${viewingUser.age} yrs` : '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Guardian / Relation</span>
                  <span className="font-semibold text-slate-800">
                    {viewingUser.fatherOrHusbandName ? `${viewingUser.relationType || 'Son of'} ${viewingUser.fatherOrHusbandName}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">PAN Card</span>
                  <span className="font-mono font-bold text-slate-800 uppercase text-xs">
                    {viewingUser.panCard || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Aadhaar Card</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {viewingUser.aadhaarCard
                      ? String(viewingUser.aadhaarCard).replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Nominee & Signature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nominee */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nominee Details
                </span>
                {viewingUser.nomineeName ? (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800 text-xs">{viewingUser.nomineeName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Relation: <strong className="text-slate-700">{viewingUser.nomineeRelation || 'Nominee'}</strong>
                      {viewingUser.nomineeAge ? ` • Age: ${viewingUser.nomineeAge} yrs` : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No nominee registered</p>
                )}
              </div>

              {/* Digital Signature */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Customer Signature
                </span>
                {viewingUser.signature ? (
                  <div className="h-14 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center">
                    <img
                      src={cloudinaryUrl(viewingUser.signature, { format: 'webp', width: 200, height: 80, crop: 'fit' })}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-3">No digital signature uploaded</p>
                )}
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Bank Account Details
              </span>
              {viewingUser.accountNumber || viewingUser.bankName ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Account Holder</span>
                    <span className="font-medium text-slate-800">{viewingUser.accountHolderName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Bank Name</span>
                    <span className="font-medium text-slate-800">{viewingUser.bankName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">A/C Number</span>
                    <span className="font-mono font-medium text-slate-800">{viewingUser.accountNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">IFSC Code</span>
                    <span className="font-mono font-medium text-slate-800">{viewingUser.ifscCode || '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">No bank account details provided</p>
              )}
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Current / Temporary Address
                </span>
                <p className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed">
                  {viewingUser.currentAddress || viewingUser.address || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Permanent Address
                </span>
                <p className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed">
                  {viewingUser.permanentAddress || viewingUser.currentAddress || viewingUser.address || '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modalbox>
    </div>
  );
};

export default PlotCustomers;
