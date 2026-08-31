import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../utils/apiClient';
import { toast } from '../../utils/toast';
import DataTable from '@/components/common/DataTable';
import PageLoader from '../../components/common/PageLoader';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import {
  Building2,
  Users,
  Search,
  Eye,
  IndianRupee,
  Calendar,
  CheckCircle,
  Clock,
  UserCheck,
  Award
} from 'lucide-react';

const SponsorBookingsPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const loggedInId = user?.profile?.id || user?.profile?._id || user?.id || user?._id;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'DIRECT', 'TEAM'

  const customStyles = useCustomStyles();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiClient({
        url: `plots/bookings/list?sponsorId=${loggedInId}&limit=100`,
        method: 'GET'
      });
      setBookings(res.data?.bookings || res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInId) {
      fetchBookings();
    }
  }, [loggedInId]);

  // Calculations
  const directCount = bookings.filter((b) => String(b.sponsorId?._id || b.sponsorId) === String(loggedInId)).length;
  const teamCount = bookings.length - directCount;
  const hasTeamBookings = teamCount > 0;

  const filteredBookings = bookings.filter((b) => {
    const isDirect = String(b.sponsorId?._id || b.sponsorId) === String(loggedInId);
    if (filterType === 'DIRECT' && !isDirect) return false;
    if (filterType === 'TEAM' && isDirect) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
      (b.customerId?.name && b.customerId.name.toLowerCase().includes(q)) ||
      (b.plotId?.plotNumber && b.plotId.plotNumber.toLowerCase().includes(q)) ||
      (b.sponsorId?.name && b.sponsorId.name.toLowerCase().includes(q))
    );
  });

  const totalPlotValue = filteredBookings.reduce((sum, b) => sum + (Number(b.plotValue) || 0), 0);
  const totalDiscount = filteredBookings.reduce((sum, b) => sum + (Number(b.discount) || 0), 0);
  const totalNetValue = Math.max(0, totalPlotValue - totalDiscount);
  const totalOutstanding = filteredBookings.reduce((sum, b) => sum + (Number(b.remainingAmount) || 0), 0);
  const totalCollected = Math.max(0, totalNetValue - totalOutstanding);

  const columns = [
    {
      name: 'S.No',
      selector: (row, idx) => idx + 1,
      width: '60px',
    },
    {
      name: 'Booking No / Date',
      selector: (row) => row.bookingNumber,
      cell: (row) => {
        const rawDate = row.bookingDate || row.createdAt;
        const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
        return (
          <div>
            <span className="font-mono font-bold text-teal-800 text-xs">#{row.bookingNumber}</span>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
              <Calendar size={12} className="text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        );
      },
      sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Customer',
      selector: (row) => row.customerId?.name || 'N/A',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.customerId?.name || 'Unknown'}</p>
          <p className="text-[11px] text-slate-500 font-mono">{row.customerId?.mobile || row.customerId?.customerId || ''}</p>
        </div>
      ),
      sortable: true,
      minWidth: '160px',
    },
    {
      name: 'Plot No / Type',
      selector: (row) => row.plotId?.plotNumber || 'N/A',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">Plot #{row.plotId?.plotNumber || '-'}</span>
          <p className="text-[11px] text-slate-500">{row.plotId?.plotSize || row.plotId?.area || 0} sq.ft</p>
        </div>
      ),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Hierarchy / Type',
      cell: (row) => {
        const isDirect = String(row.sponsorId?._id || row.sponsorId) === String(loggedInId);
        return (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isDirect
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-purple-50 text-purple-800 border border-purple-200'
            }`}
          >
            {isDirect ? '🎯 Direct Booking' : `👥 Sub (${row.sponsorId?.name || 'Team'})`}
          </span>
        );
      },
      minWidth: '150px',
    },
    {
      name: 'Plot Value (Gross)',
      selector: (row) => row.plotValue || 0,
      cell: (row) => (
        <span className="font-semibold text-slate-800 font-mono text-xs">
          ₹{(row.plotValue || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Discount',
      selector: (row) => row.discount || 0,
      cell: (row) => (
        <span className="font-semibold text-slate-600 font-mono text-xs">
          {row.discount > 0 ? `₹${(row.discount || 0).toLocaleString('en-IN')}` : '-'}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Net Plot Value',
      selector: (row) => Math.max(0, (row.plotValue || 0) - (row.discount || 0)),
      cell: (row) => (
        <span className="font-bold text-teal-900 font-mono text-xs">
          ₹{Math.max(0, (row.plotValue || 0) - (row.discount || 0)).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Paid / Collected',
      selector: (row) => Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)),
      cell: (row) => (
        <span className="font-bold text-emerald-700 font-mono text-xs">
          ₹{Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Due Amount (Remaining)',
      selector: (row) => row.remainingAmount || 0,
      cell: (row) => (
        <span
          className={`font-bold font-mono text-xs ${
            row.remainingAmount > 0 ? 'text-amber-700' : 'text-slate-500'
          }`}
        >
          ₹{(row.remainingAmount || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '140px',
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            row.status === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-800'
              : row.status === 'ACTIVE'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Action',
      minWidth: '90px',
      cell: (b) => (
        <button
          onClick={() => navigate(`/dashboard/plots/booking/${b._id}`)}
          title="View Contract Statement"
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  if (loading) {
    return <PageLoader title="Loading Sponsor Bookings..." subtitle="Fetching direct and downline plot contracts" />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-xs font-bold mb-2">
            <Building2 size={14} className="text-teal-700" />
            <span>Sponsor Portfolio</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            My Plot Bookings & Team Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track gross booking values, applied discounts, customer collections, and outstanding dues.
          </p>
        </div>

        {/* Filter Toggle (Only shown if sponsor has both direct and team downline bookings) */}
        {hasTeamBookings && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setFilterType('DIRECT')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'DIRECT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Direct Customers ({directCount})
            </button>
            <button
              onClick={() => setFilterType('TEAM')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'TEAM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Team / Downline ({teamCount})
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Booking Value</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">₹{totalPlotValue.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-400 font-medium">Before discount</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Discount</span>
          <p className="text-xl font-black text-slate-600 mt-1 font-mono">₹{totalDiscount.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-400 font-medium">Approved concessions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Collected</span>
          <p className="text-xl font-black text-emerald-800 mt-1 font-mono">₹{totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Received by company</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Total Due / Outstanding</span>
          <p className="text-xl font-black text-amber-800 mt-1 font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-amber-600 font-medium">Pending collection</span>
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, plot #, booking #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredBookings.length} booking(s)
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredBookings}
          pagination
          customStyles={customStyles}
          noDataComponent={
            <div className="p-8 text-center text-slate-500">
              <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No bookings found for this filter</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default SponsorBookingsPage;
