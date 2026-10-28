import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import DataTable from '@/components/common/DataTable';
import PageLoader from '../../../components/common/PageLoader';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import {
  Users,
  UserCheck,
  Building2,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Phone,
  User,
  Briefcase,
  AlertCircle,
  Crown,
} from 'lucide-react';

const BusinessDeveloperNetworkPage = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { profile } = useSelector((state) => state.user || {});
  const loggedInId = profile?.id || profile?._id;
  const loggedInRole = profile?.role;

  // If paramId is supplied, use that (e.g. admin viewing a specific BP/BA), else use logged-in user
  const targetId = paramId || loggedInId;

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('associates'); // 'associates' | 'customers'

  // Subordinate Business Associates
  const [associates, setAssociates] = useState([]);
  const [associatesLoading, setAssociatesLoading] = useState(false);
  const [associateSearch, setAssociateSearch] = useState('');

  // Customers
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedAssociateFilter, setSelectedAssociateFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');

  const customStyles = useCustomStyles();

  // Determine if target is a Business Partner or Associate
  const isBusinessPartner = useMemo(() => {
    // 1. Check loaded developer object
    if (developer) {
      if (typeof developer.isDeveloperSponsor === 'boolean') {
        return developer.isDeveloperSponsor;
      }
      if (developer.parentSponsor || developer.sponsorId) {
        return false;
      }
      if (developer.sponsorCode?.startsWith('BA-')) {
        return false;
      }
      if (developer.sponsorCode?.startsWith('BP-')) {
        return true;
      }
    }
    // 2. Fallback to logged-in profile if viewing self
    if (!paramId && profile) {
      if (profile.sponsorCode?.startsWith('BA-')) return false;
      if (profile.sponsorCode?.startsWith('BP-')) return true;
      if (typeof profile.isDeveloperSponsor === 'boolean') {
        return profile.isDeveloperSponsor;
      }
    }
    return false;
  }, [developer, paramId, profile]);

  // 1. Fetch Developer Profile Details
  useEffect(() => {
    const fetchDeveloperProfile = async () => {
      if (!targetId) return;
      setLoading(true);
      try {
        const res = await apiClient({
          url: `plots/sponsors/${targetId}/dashboard`,
          method: 'GET',
        });
        const sp = res.data?.sponsor || res.sponsor || null;
        setDeveloper(sp);
        // If target is an Associate, default tab to customers instead of associates
        const isPartner = sp?.isDeveloperSponsor ?? (!sp?.parentSponsor && !sp?.sponsorCode?.startsWith('BA-'));
        if (isPartner) {
          setActiveTab('associates');
        } else {
          setActiveTab('customers');
        }
      } catch (err) {
        console.error('Failed to load developer profile:', err);
        // Fallback: set minimal profile
        setDeveloper(profile);
      } finally {
        setLoading(false);
      }
    };

    fetchDeveloperProfile();
  }, [targetId, profile]);

  // 2. Fetch Business Associates under this Partner
  const fetchAssociates = async () => {
    if (!targetId) return;
    setAssociatesLoading(true);
    try {
      const res = await apiClient({
        url: 'plots/sponsors',
        params: {
          parentSponsorId: targetId,
          limit: 100,
        },
      });
      setAssociates(res.data || res.sponsors || []);
    } catch (err) {
      console.error('Failed to load associates:', err);
      toast.error('Failed to load business associates');
    } finally {
      setAssociatesLoading(false);
    }
  };

  useEffect(() => {
    if (targetId && isBusinessPartner) {
      fetchAssociates();
    }
  }, [targetId, isBusinessPartner]);

  // 3. Fetch Customers (scoped to Partner/Associate)
  const fetchCustomers = async () => {
    if (!targetId) return;
    setCustomersLoading(true);
    try {
      const params = {
        sponsorId: targetId,
        limit: 100,
      };
      if (selectedAssociateFilter && selectedAssociateFilter !== 'all') {
        params.associateId = selectedAssociateFilter;
      }
      if (customerSearch) {
        params.search = customerSearch;
      }

      const res = await apiClient({
        url: 'plots/customers',
        params,
      });
      setCustomers(res.data || res.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error('Failed to load customer list');
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchCustomers();
    }
  }, [targetId, selectedAssociateFilter, customerSearch]);

  // Calculations for Customers Tab
  const customerMetrics = useMemo(() => {
    let totalDue = 0;
    let totalBookings = 0;

    customers.forEach((c) => {
      totalDue += Number(c.totalDue) || 0;
      totalBookings += Number(c.bookingCount) || 0;
    });

    return {
      count: customers.length,
      totalDue,
      totalBookings,
    };
  }, [customers]);

  // Filtered Associates in memory for search
  const filteredAssociates = useMemo(() => {
    if (!associateSearch.trim()) return associates;
    const q = associateSearch.toLowerCase();
    return associates.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.sponsorCode && a.sponsorCode.toLowerCase().includes(q)) ||
        (a.mobile && a.mobile.includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q))
    );
  }, [associates, associateSearch]);

  // Columns for Business Associates Table
  const associateColumns = [
    {
      name: 'S.No',
      selector: (row, idx) => idx + 1,
      width: '60px',
    },
    {
      name: 'Associate Name',
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-50 border border-teal-200 flex-shrink-0 flex items-center justify-center">
            {row.photo || row.profileImage ? (
              <img
                src={cloudinaryUrl(row.photo || row.profileImage, { format: 'webp', width: 80, height: 80, crop: 'fill' })}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={14} className="text-teal-700" />
            )}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">
              {row.name?.replace(/\s*\([^)]*\)/g, '') || row.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{row.mobile || ''}</span>
          </div>
        </div>
      ),
      minWidth: '180px',
    },
    {
      name: 'Associate ID',
      selector: (row) => row.sponsorCode || 'N/A',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
          {row.sponsorCode || 'N/A'}
        </span>
      ),
      width: '160px',
    },
    {
      name: 'Branch',
      selector: (row) => row.branchIds?.map((b) => b.name || b).join(', ') || 'Head Office',
      cell: (row) => (
        <span className="text-xs text-slate-700 font-medium inline-flex items-center gap-1">
          <Building2 size={12} className="text-teal-700" />
          {row.branchIds?.map((b) => b.name || b).join(', ') || 'Head Office'}
        </span>
      ),
      width: '150px',
    },
    {
      name: 'Customers',
      selector: (row) => row.customerCount || 0,
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-slate-800 font-mono text-xs px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
          {row.customerCount || 0}
        </span>
      ),
      width: '110px',
    },
    {
      name: 'Total Bookings',
      selector: (row) => row.bookingCount || 0,
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-teal-800 font-mono text-xs px-2 py-0.5 bg-teal-50 rounded border border-teal-200">
          {row.bookingCount || 0}
        </span>
      ),
      width: '130px',
    },
    {
      name: 'Total Due (₹)',
      selector: (row) => row.totalDue || 0,
      sortable: true,
      cell: (row) => (
        <span className={`font-bold font-mono text-xs ${Number(row.totalDue) > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
          ₹{(Number(row.totalDue) || 0).toLocaleString('en-IN')}
        </span>
      ),
      width: '140px',
    },
    {
      name: 'Status',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            row.isBlocked ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {row.isBlocked ? 'Blocked' : 'Active'}
        </span>
      ),
      width: '100px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedAssociateFilter(row._id);
              setActiveTab('customers');
            }}
            className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
            title="Filter Customers by this Associate"
          >
            Customers
          </button>
          <button
            onClick={() => navigate('/dashboard/my-bookings')}
            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
            title="View Plot Bookings"
          >
            Bookings
          </button>
        </div>
      ),
      width: '180px',
    },
  ];

  // Columns for Customers Table
  const customerColumns = useMemo(() => {
    const cols = [
      {
        name: 'S.No',
        selector: (row, idx) => idx + 1,
        width: '60px',
      },
      {
        name: 'Customer ID',
        selector: (row) => row.customerId || row.customerCode || 'N/A',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
            {row.customerId || row.customerCode || 'N/A'}
          </span>
        ),
        width: '140px',
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
              <span className="font-bold text-slate-900 block leading-tight">{row.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">{row.mobile || ''}</span>
            </div>
          </div>
        ),
        minWidth: '180px',
      },
    ];

    if (isBusinessPartner) {
      cols.push({
        name: 'Business Associate',
        selector: (row) => row.sponsorId?.name || 'Direct',
        sortable: true,
        cell: (row) => (
          <div>
            {row.sponsorId?.name ? (
              <div>
                <span className="font-semibold text-teal-900 text-xs block leading-tight">
                  {row.sponsorId.name.replace(/\s*\([^)]*\)/g, '')}
                </span>
                <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200 inline-block mt-0.5">
                  {row.sponsorId.sponsorCode || 'BA'}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">Direct to Partner</span>
            )}
          </div>
        ),
        minWidth: '170px',
      });
    }

    cols.push(
      {
        name: 'Registration Date',
        selector: (row) => row.createdAt,
        sortable: true,
        cell: (row) => (
          <span className="text-xs text-slate-600 font-mono">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </span>
        ),
        width: '130px',
      },
      {
        name: 'Bookings Count',
        selector: (row) => row.bookingCount || 0,
        sortable: true,
        cell: (row) => (
          <span className="font-bold text-slate-800 font-mono text-xs px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
            {row.bookingCount || 0}
          </span>
        ),
        width: '130px',
      },
      {
        name: 'Outstanding Due (₹)',
        selector: (row) => row.totalDue || 0,
        sortable: true,
        cell: (row) => (
          <span
            className={`font-bold font-mono text-xs px-2 py-0.5 rounded ${
              Number(row.totalDue) > 0 ? 'bg-amber-50 text-amber-900 border border-amber-200 font-black' : 'text-slate-500'
            }`}
          >
            ₹{(Number(row.totalDue) || 0).toLocaleString('en-IN')}
          </span>
        ),
        width: '160px',
      }
    );

    return cols;
  }, [isBusinessPartner]);

  if (loading) {
    return (
      <PageLoader
        title="Loading Network Details..."
        subtitle="Fetching business partner associates, mapped customers, and booking dues"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50">
      {/* ── Top Header & Profile Banner ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {developer?.profileImage || developer?.photo ? (
            <img
              src={cloudinaryUrl(developer.profileImage || developer.photo, {
                format: 'webp',
                width: 100,
                height: 100,
                crop: 'fill',
              })}
              alt={developer?.name}
              className="w-[52px] h-[52px] rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-teal-700 text-white flex items-center justify-center text-lg font-bold border border-slate-200">
              {developer?.name?.charAt(0)?.toUpperCase() || 'B'}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {developer?.name?.replace(/\s*\([^)]*\)/g, '') || 'Business Developer'}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                developer?.isBranchPartner
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : isBusinessPartner
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {developer?.isBranchPartner
                  ? `Branch Partner (${developer.branchName || 'Regional Head'})`
                  : (isBusinessPartner ? 'Business Partner' : 'Business Associate')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck size={14} className="text-slate-400" />
                ID: <strong className="text-slate-700">{developer?.sponsorCode || 'N/A'}</strong>
              </span>
              {developer?.mobile && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={13} className="text-slate-400" />
                  {developer.mobile}
                </span>
              )}
              {developer?.parentSponsor && (
                <span className="flex items-center gap-1">
                  Partner: <strong className="text-slate-700">{developer.parentSponsor.name}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Back / Action Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {paramId && (
            <button
              onClick={() => navigate('/dashboard/plots/business-developer')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Developers</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/dashboard/plots/business-developer/${targetId}/business-report`)}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Commission Report</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {isBusinessPartner && (
          <button
            onClick={() => setActiveTab('associates')}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'associates'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users size={16} />
            <span>Business Associates ({associates.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck size={16} />
          <span>{isBusinessPartner ? 'Customers Under Associates' : 'My Customers'} ({customers.length})</span>
        </button>
      </div>

      {/* ── TAB 1: BUSINESS ASSOCIATES (Only for Business Partner) ── */}
      {isBusinessPartner && activeTab === 'associates' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-80 px-2">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search associate by name, code, phone..."
                value={associateSearch}
                onChange={(e) => setAssociateSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-700 text-xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredAssociates.length}</strong> Business Associates under this Partner
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <DataTable
              columns={associateColumns}
              data={filteredAssociates}
              progressPending={associatesLoading}
              progressComponent={
                <PageLoader
                  fullScreen={false}
                  minHeight="min-h-[200px]"
                  title="Loading Business Associates..."
                  subtitle="Fetching team network records"
                />
              }
              customStyles={customStyles}
              pagination
              responsive
              highlightOnHover
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: CUSTOMERS UNDER ASSOCIATES ── */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-800 rounded-lg">
                <UserCheck size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Total Customers
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {customerMetrics.count}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-800 rounded-lg">
                <Briefcase size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Active Bookings
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {customerMetrics.totalBookings}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg">
                <AlertCircle size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 block tracking-wider">
                  Total Outstanding Due
                </span>
                <span className="text-lg font-black text-amber-900 font-mono">
                  ₹{customerMetrics.totalDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-80 px-2">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search customer by name, mobile, ID..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-700 text-xs"
              />
            </div>

            {/* Filter by Business Associate Dropdown */}
            {isBusinessPartner && (
              <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                <Filter size={15} className="text-teal-700 shrink-0" />
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Associate:</span>
                <select
                  value={selectedAssociateFilter}
                  onChange={(e) => setSelectedAssociateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer w-full sm:w-64"
                >
                  <option value="all">All Business Associates ({associates.length})</option>
                  {associates.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name?.replace(/\s*\([^)]*\)/g, '')} ({a.sponsorCode || 'BA'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <DataTable
              columns={customerColumns}
              data={customers}
              progressPending={customersLoading}
              progressComponent={
                <PageLoader
                  fullScreen={false}
                  minHeight="min-h-[200px]"
                  title="Loading Customers..."
                  subtitle="Fetching mapped customer profiles and outstanding dues"
                />
              }
              customStyles={customStyles}
              pagination
              responsive
              highlightOnHover
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDeveloperNetworkPage;
