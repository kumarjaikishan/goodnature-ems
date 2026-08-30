import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useApi } from '../../utils/useApi';
import Modalbox from '../../components/custommodal/Modalbox';
import DataTable from 'react-data-table-component';
import { HiOutlinePlus, HiEye, HiOutlinePencilSquare, HiOutlineTrash, HiMagnifyingGlass } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import PageLoader from '../../components/common/PageLoader';

const PlotCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

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
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
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
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="View Details"
          >
            <HiEye className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/dashboard/plots/customers/edit/${row._id}`)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit Customer"
          >
            <HiOutlinePencilSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDeleteCustomer(row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Customer"
          >
            <HiOutlineTrash className="w-5 h-5" />
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
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm">Manage customers registered under plot projects</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/plots/customers/new')}
          className="inline-flex items-center justify-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer bg-primary"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex items-center gap-3 border border-slate-200">
        <HiMagnifyingGlass className="w-5 h-5 text-slate-400" />
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
      <Modalbox open={showViewModal} onClose={() => setShowViewModal(false)}>
        <div className="membermodal w-[600px] max-w-[95vw]">
          <div className="whole">
            <h2 className="flex items-center justify-between px-6">
              <span>Customer Details</span>
              <span className="font-mono text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-md">
                {viewingUser?.customerCode || 'N/A'}
              </span>
            </h2>

            {viewingUser && (
              <div className="modalcontent space-y-4 text-sm">
                {/* Profile & Sponsor Header Card */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Customer Name</p>
                    <p className="font-bold text-slate-800">{viewingUser.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Assigned Sponsor</p>
                    <p className="font-bold text-purple-700">
                      {viewingUser.sponsorId?.name
                        ? `${viewingUser.sponsorId.name}`
                        : '🏢 Company (Direct)'}
                    </p>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Gender</p>
                    <p className="font-medium text-slate-700">{viewingUser.gender || 'Male'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Age</p>
                    <p className="font-medium text-slate-700">{viewingUser.age ? `${viewingUser.age} yrs` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Guardian / Relation</p>
                    <p className="font-medium text-slate-700">
                      {viewingUser.fatherOrHusbandName ? `${viewingUser.relationType || 'Son of'} ${viewingUser.fatherOrHusbandName}` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Mobile Number</p>
                    <p className="font-medium text-slate-700">{viewingUser.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Email Address</p>
                    <p className="font-medium text-slate-700 break-all">{viewingUser.email || 'N/A'}</p>
                  </div>
                </div>

                {/* ID Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">PAN Card</p>
                    <p className="font-medium text-slate-700 uppercase">{viewingUser.panCard || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Aadhaar Card</p>
                    <p className="font-medium text-slate-700">{viewingUser.aadhaarCard || 'N/A'}</p>
                  </div>
                </div>

                {/* Nominee Details Section */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Nominee Details</p>
                  <p className="font-semibold text-slate-800">
                    {viewingUser.nomineeName ? (
                      <>
                        {viewingUser.nomineeName}
                        {viewingUser.nomineeRelation ? ` (${viewingUser.nomineeRelation})` : ''}
                        {viewingUser.nomineeAge ? ` - ${viewingUser.nomineeAge} yrs` : ''}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>

                {/* Bank Details Section */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Bank Account Details</p>
                  {viewingUser.accountNumber || viewingUser.bankName ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><strong className="text-slate-500">Account Holder:</strong> {viewingUser.accountHolderName || 'N/A'}</p>
                      <p><strong className="text-slate-500">Bank Name:</strong> {viewingUser.bankName || 'N/A'}</p>
                      <p><strong className="text-slate-500">A/C Number:</strong> {viewingUser.accountNumber || 'N/A'}</p>
                      <p><strong className="text-slate-500">IFSC Code:</strong> {viewingUser.ifscCode || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 font-medium text-xs">No bank account details provided.</p>
                  )}
                </div>

                {/* Address Details */}
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Current / Temporary Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                    {viewingUser.currentAddress || viewingUser.address || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Permanent Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                    {viewingUser.permanentAddress || viewingUser.currentAddress || viewingUser.address || 'N/A'}
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex justify-between border-t border-slate-100">
                  <span>Registered: {new Date(viewingUser.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>Role: {viewingUser.role}</span>
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

export default PlotCustomers;
