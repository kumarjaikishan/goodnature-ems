import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import {
  BarChart3,
  CheckCircle,
  Printer,
  XCircle,
  Trash2,
  Edit2,
  Banknote,
  FileText,
  ClipboardCheck,
  X,
  Eye,
  Sparkles,
  Search
} from 'lucide-react';
import Modalbox from '../../components/custommodal/Modalbox';
import PageLoader from '../../components/common/PageLoader';

const PlotReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isReportsPage = location.pathname.includes('/reports');

  const [activeTab, setActiveTab] = useState(isReportsPage ? 'dues' : 'bookings');

  useEffect(() => {
    if (isReportsPage) {
      setActiveTab('dues');
    } else {
      setActiveTab('bookings');
    }
  }, [location.pathname]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReport = async (type) => {
    setLoading(true);
    setData([]);
    try {
      const res = await api.get(`/plots/reports/${type}`);
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to load report data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm('');
    setSchemeFilter('');
    setStatusFilter('');
    fetchReport(activeTab);
  }, [activeTab]);

  const handlePrintReceipt = (receiptId) => {
    navigate(`/plot/receipt/print/${receiptId}`);
  };

  const getHoldHoursLeft = (expiryDate) => {
    const diff = new Date(expiryDate) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const [editingBooking, setEditingBooking] = useState(null);
  const [rateConfig, setRateConfig] = useState(null);
  const [editForm, setEditForm] = useState({
    plotId: '',
    customerId: '',
    sponsorId: '',
    tenureMonths: 0,
    scheme: 'FULL_PAYMENT',
    bookingAmount: 0,
    paymentMode: 'cash',
    transactionReference: '',
    notes: '',
    bookingType: 'BOOKING',
    holdExpiryDays: '7',
    discount: 0,
    bookingDate: '',
    oneTimeMonths: 1,
    downpaymentMonths: 1,
    status: 'ACTIVE',
    agreementNumber: '',
  });

  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [downpaymentBase, setDownpaymentBase] = useState('BEFORE_DISCOUNT');
  const [govtRate, setGovtRate] = useState('100');

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [sponsorSearch, setSponsorSearch] = useState('');
  const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);
  const [sponsorSearchResults, setSponsorSearchResults] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [plotsList, setPlotsList] = useState([]);

  // Fetch sponsor search options dynamically inside Modal
  useEffect(() => {
    const q = sponsorSearch.trim();
    if (!q || q === 'Direct / Company (No Sponsor)') {
      setSponsorSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      api.get('/plots/sponsors', {
        params: { search: q, limit: 20 }
      }).then((res) => {
        const list = res.data.data?.sponsors || res.data.sponsors || res.data.data || [];
        setSponsorSearchResults(list);
      }).catch(() => { });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [sponsorSearch]);

  // Fetch customer search options dynamically inside Modal
  useEffect(() => {
    const q = customerSearch.trim();
    if (!q) {
      setCustomerSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      api.get('/plots/customers', {
        params: { search: q, limit: 20 }
      }).then((res) => {
        const list = res.data.data?.customers || res.data.customers || res.data.data || [];
        setCustomerSearchResults(list);
      }).catch(() => { });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [customerSearch]);

  const slabs = rateConfig?.rateSlabs?.length > 0
    ? rateConfig.rateSlabs
    : [
        { tenureMonths: 0, plotRate: 1000, promoterCommissionPercent: 10.0, developerCommissionPercent: 2.0, downpaymentPercent: 100, emiPercent: 0 },
        { tenureMonths: 3, plotRate: 1050, promoterCommissionPercent: 10.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 6, plotRate: 1100, promoterCommissionPercent: 11.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 9, plotRate: 1150, promoterCommissionPercent: 11.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 12, plotRate: 1200, promoterCommissionPercent: 12.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 15, plotRate: 1250, promoterCommissionPercent: 12.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 18, plotRate: 1300, promoterCommissionPercent: 13.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 21, plotRate: 1350, promoterCommissionPercent: 13.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 24, plotRate: 1400, promoterCommissionPercent: 14.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 27, plotRate: 1450, promoterCommissionPercent: 14.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 30, plotRate: 1500, promoterCommissionPercent: 15.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
      ];

  const currentSlab = slabs.find((s) => Number(s.tenureMonths) === Number(editForm.tenureMonths)) || slabs[0];

  // Dynamic calculations based on selected plot and tenure slab
  const selectedPlotObj = plotsList.find(p => p._id === editForm.plotId) || editingBooking?.plotId || {};
  const plotArea = selectedPlotObj?.plotSize || selectedPlotObj?.area || selectedPlotObj?.areaSqFt || 0;
  const isCorner = selectedPlotObj?.plotType === 'CORNER';
  const cornerExtra = isCorner ? (rateConfig?.cornerExtraPercent || 20) : 0;
  const baseRate = currentSlab.plotRate || rateConfig?.baseSqFtRate || 1000;
  const effectiveRate = baseRate * (1 + cornerExtra / 100);
  const calculatedPlotValue = plotArea > 0 ? Math.round(plotArea * effectiveRate) : (editingBooking?.plotValue || 0);

  const calculateDiscountAmount = (type, val) => {
    const num = Number(val) || 0;
    if (num <= 0 || !plotArea) return 0;
    if (type === 'PERCENT') {
      return Math.round((calculatedPlotValue * num) / 100);
    } else if (type === 'SQFT_RATE') {
      return Math.round(plotArea * num);
    }
    return num;
  };

  const calculatedDiscount = calculateDiscountAmount(discountType, discountVal);
  const netContractValue = Math.max(0, calculatedPlotValue - calculatedDiscount);
  const isOneTime = Number(editForm.tenureMonths) === 0;
  const dpPercent = currentSlab.downpaymentPercent ? currentSlab.downpaymentPercent / 100 : (isOneTime ? 1.0 : 0.40);

  let downpaymentAmt = 0;
  let emiPrincipalAmt = 0;

  if (isOneTime) {
    downpaymentAmt = netContractValue;
    emiPrincipalAmt = 0;
  } else {
    if (downpaymentBase === 'BEFORE_DISCOUNT') {
      downpaymentAmt = Math.round(calculatedPlotValue * dpPercent);
      emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
    } else {
      downpaymentAmt = Math.round(netContractValue * dpPercent);
      emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
    }
  }

  const emiMonthlyAmt = !isOneTime && editForm.tenureMonths > 0 ? Math.round(emiPrincipalAmt / editForm.tenureMonths) : 0;

  const handleEditClick = async (booking) => {
    setEditingBooking(booking);

    try {
      const [plotsRes, rateRes] = await Promise.all([
        plotsList.length === 0 ? api.get('/plots?limit=5000') : Promise.resolve({ data: { data: plotsList } }),
        rateConfig ? Promise.resolve({ data: { data: rateConfig } }) : api.get('/plots/rate-config'),
      ]);
      setPlotsList(plotsRes.data.data || []);
      setRateConfig(rateRes.data.data || null);
    } catch { }

    const custObj = booking.customerId;
    const custName = custObj?.name || booking.customerName || '';
    const custCode = custObj?.customerCode || custObj?.mobile || '';
    setCustomerSearch(custName ? `${custName} (${custCode})` : '');

    const bookingTenure = booking.tenureMonths !== undefined ? Number(booking.tenureMonths) : (booking.scheme === 'FULL_PAYMENT' ? 0 : 3);
    const bookingDiscount = booking.discount || 0;

    setDiscountType('RUPEE');
    setDiscountVal(bookingDiscount ? String(bookingDiscount) : '');
    setDownpaymentBase(booking.downpaymentCalculationBase || 'BEFORE_DISCOUNT');
    setGovtRate(booking.govtRate ? String(booking.govtRate) : '100');

    const initialForm = {
      bookingType: booking.bookingType || (booking.status === 'HOLD' ? 'HOLD' : 'BOOKING'),
      holdExpiryDays: '7',
      customerId: custObj?._id || booking.customerId || '',
      plotId: booking.plotId?._id || booking.plotId || '',
      status: booking.status || 'ACTIVE',
      agreementNumber: booking.agreementNumber || '',
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : new Date(booking.createdAt).toISOString().split('T')[0],
      scheme: booking.scheme || (bookingTenure === 0 ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT'),
      tenureMonths: bookingTenure,
      discount: bookingDiscount,
      bookingAmount: booking.bookingAmount || 0,
      downpaymentMonths: booking.downpaymentMonths || 1,
      oneTimeMonths: booking.oneTimeMonths || 1,
      paymentMode: booking.paymentMode || 'cash',
      transactionReference: booking.transactionReference || '',
      sponsorId: booking.sponsorId?._id || booking.sponsorId || '',
      notes: booking.notes || '',
    };
    setEditForm(initialForm);
    setSponsorSearch(booking.sponsorId?.name ? `${booking.sponsorId.name} (${booking.sponsorId.sponsorCode || ''})` : 'Direct / Company (No Sponsor)');
  };

  // Sponsor Ledger Modal state in PlotReports
  const [selectedSponsorLedger, setSelectedSponsorLedger] = useState(null);
  const [sponsorLedgerData, setSponsorLedgerData] = useState([]);
  const [sponsorLedgerLoading, setSponsorLedgerLoading] = useState(false);

  const openSponsorLedgerModal = async (sponsor) => {
    if (!sponsor || !sponsor._id) return;
    setSelectedSponsorLedger(sponsor);
    setSponsorLedgerLoading(true);
    try {
      // Get all plot commissions for this sponsor
      const res = await api.get(`/plots/reports/commissions`);
      const allCommissions = res.data.data || [];
      const spDetails = allCommissions.find(s => s._id === sponsor._id);
      setSponsorLedgerData(spDetails?.entries || []);
    } catch {
      toast.error('Failed to load sponsor ledger');
      setSponsorLedgerData([]);
    } finally {
      setSponsorLedgerLoading(false);
    }
  };

  // Weekly Payout states
  const [setupPayoutBooking, setSetupPayoutBooking] = useState(null);
  const [setupPayoutForm, setSetupPayoutForm] = useState({ startDate: new Date().toISOString().split('T')[0], weeklyAmount: 1200 });
  const [setupPayoutSaving, setSetupPayoutSaving] = useState(false);
  const handleSetupPayoutSubmit = async (e) => {
    e.preventDefault();
    setSetupPayoutSaving(true);
    try {
      await api.post(`/plots/bookings/${setupPayoutBooking._id}/payout/initialize`, setupPayoutForm);
      toast.success('Weekly payouts initialized successfully');
      setSetupPayoutBooking(null);
      fetchReport(activeTab);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize payouts');
    } finally {
      setSetupPayoutSaving(false);
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        notes: editForm.notes,
        discount: calculatedDiscount,
        bookingAmount: downpaymentAmt,
        bookingDate: editForm.bookingDate,
        sponsorId: editForm.sponsorId || null,
        status: editForm.status,
        scheme: isOneTime ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT',
        tenureMonths: Number(editForm.tenureMonths),
        agreementNumber: editForm.agreementNumber,
        bookingType: editForm.bookingType,
        holdExpiryDays: Number(editForm.holdExpiryDays) || 7,
        customerId: editForm.customerId,
        plotId: editForm.plotId,
        paymentMode: editForm.paymentMode,
        transactionReference: editForm.transactionReference,
        oneTimeMonths: isOneTime ? Number(editForm.oneTimeMonths || 1) : undefined,
        downpaymentMonths: !isOneTime ? Number(editForm.downpaymentMonths || 1) : undefined,
        downpaymentCalculationBase: downpaymentBase,
        govtRate: Number(govtRate) || 100,
      };

      await api.put(`/plots/bookings/${editingBooking._id}`, payload);
      toast.success('Booking details updated successfully');
      setEditingBooking(null);
      fetchReport(activeTab);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  // Delete Booking Modal State
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const openDeleteBookingModal = (booking) => {
    setBookingToDelete(booking);
  };

  const handleConfirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    const bookingId = bookingToDelete._id;
    const paidAmt = (bookingToDelete.plotValue || 0) - (bookingToDelete.discount || 0) - (bookingToDelete.remainingAmount || 0);

    if (paidAmt > 0) {
      toast.error(`Cannot delete Booking #${bookingToDelete.bookingNumber || ''} because ₹${paidAmt.toLocaleString('en-IN')} has already been collected. Please reverse or delete all collections from the Collections tab first.`);
      setBookingToDelete(null);
      return;
    }

    setDeletingId(bookingId);
    try {
      await api.delete(`/plots/bookings/${bookingId}`);
      toast.success('Booking deleted successfully and plot restored to Available');
      setBookingToDelete(null);
      fetchReport(activeTab);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    } finally {
      setDeletingId(null);
    }
  };

  const [balanceFilter, setBalanceFilter] = useState(''); // '' | 'with_balance' | 'zero_balance'

  const filteredBookings = Array.isArray(data) && activeTab === 'bookings'
    ? data.filter(b => {
      const matchesSearch =
        b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.name || b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.mobile || b.customerMobile || '').includes(searchTerm);

      const matchesScheme = !schemeFilter || b.scheme === schemeFilter;
      const matchesStatus = !statusFilter || b.status === statusFilter;

      return matchesSearch && matchesScheme && matchesStatus;
    })
    : [];

  const filteredDues = Array.isArray(data) && activeTab === 'dues'
    ? data.filter(b => {
      const matchesSearch =
        b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.name || b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.mobile || b.customerMobile || '').includes(searchTerm);

      const matchesScheme = !schemeFilter || b.scheme === schemeFilter;
      const matchesDueStatus = !statusFilter || b.dueStatus === statusFilter;

      return matchesSearch && matchesScheme && matchesDueStatus;
    })
    : [];

  const customStyles = useCustomStyles();

  // Columns for Bookings Tab
  const bookingColumns = [
    {
      name: 'Booking Date',
      selector: (row) => row.bookingDate || row.createdAt,
      cell: (row) => (
        <span className="text-slate-600 font-medium whitespace-nowrap text-xs">
          {new Date(row.bookingDate || row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Booking & Plot #',
      selector: (row) => row.bookingNumber,
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900 tracking-wide font-mono">{row.bookingNumber}</span>
          <span className="text-[11px] font-semibold text-slate-600">Plot: {row.plotId?.plotNumber || 'N/A'}</span>
        </div>
      ),
      sortable: true,
      minWidth: '140px',
    },
    {
      name: 'Customer',
      selector: (row) => row.customerId?.name || row.customerName,
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900 truncate">{row.customerId?.name || row.customerName}</span>
          <span className="text-[11px] text-slate-500 font-medium">{row.customerId?.mobile || row.customerMobile}</span>
        </div>
      ),
      sortable: true,
      minWidth: '160px',
      grow: 2,
    },
    {
      name: 'Plot Value',
      selector: (row) => row.plotValue || 0,
      cell: (row) => <span className="font-bold text-slate-900 font-mono text-xs">₹{(row.plotValue || 0).toLocaleString('en-IN')}</span>,
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Discount',
      selector: (row) => row.discount || 0,
      cell: (row) => (
        <span className="font-semibold text-slate-700 font-mono text-xs">
          {row.discount > 0 ? `₹${(row.discount || 0).toLocaleString('en-IN')}` : '-'}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Paid Amount',
      selector: (row) => Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)),
      cell: (row) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          ₹{Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Outstanding',
      selector: (row) => row.remainingAmount || 0,
      cell: (row) => <span className="font-bold text-slate-900 font-mono text-xs">₹{(row.remainingAmount || 0).toLocaleString('en-IN')}</span>,
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
      minWidth: '110px',
    },
    {
      name: 'Actions',
      minWidth: '190px',
      cell: (b) => (
        <div className="flex items-center gap-1.5 py-1">
          <button
            onClick={() => navigate(`/dashboard/plots/booking/${b._id}`)}
            title="View Full Plot & Booking Details"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer border border-slate-200"
          >
            <Eye size={16} />
          </button>
          {b.receiptId && (
            <button
              onClick={() => navigate(`/dashboard/plots/receipts/${b.receiptId}`)}
              title="Print Booking Receipt"
              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition cursor-pointer border border-sky-200"
            >
              <Printer size={16} />
            </button>
          )}
          <button
            onClick={() => navigate(`/dashboard/plots/bookings/${b._id}`)}
            title="View Contract Ledger"
            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition cursor-pointer border border-teal-200"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={async () => {
              if (b.agreementNumber && b.agreementNumber.trim() !== '') {
                navigate(`/dashboard/plots/agreements/${b._id}`);
              } else {
                const input = window.prompt(
                  `Enter Agreement Number for Booking #${b.bookingNumber} (Plot #${b.plotId?.plotNumber || ''}):`,
                  ''
                );
                if (input === null) return;
                const finalAgreementNo = input.trim();
                if (finalAgreementNo) {
                  try {
                    await api.put(`/plots/bookings/${b._id}`, { agreementNumber: finalAgreementNo });
                    toast.success('Agreement number saved successfully');
                    b.agreementNumber = finalAgreementNo;
                  } catch (err) {
                    console.error('Failed to update agreement number:', err);
                  }
                }
                navigate(`/dashboard/plots/agreements/${b._id}`);
              }
            }}
            title="Print Agreement"
            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition cursor-pointer border border-amber-200"
          >
            <ClipboardCheck size={16} />
          </button>
          <button
            onClick={() => handleEditClick(b)}
            title="Edit Booking"
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer border border-indigo-200"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => openDeleteBookingModal(b)}
            disabled={deletingId === b._id}
            title="Delete Booking"
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer border border-rose-200 disabled:opacity-50"
          >
            {deletingId === b._id ? (
              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>

          {b.scheme === 'FULL_PAYMENT' && b.remainingAmount === 0 && (
            <>
              {(!b.payoutStatus || b.payoutStatus === 'INACTIVE') ? (
                <button
                  onClick={() => {
                    setSetupPayoutBooking(b);
                    setSetupPayoutForm({
                      startDate: new Date().toISOString().split('T')[0],
                      weeklyAmount: Math.round((b.plotValue / 500) * 100) / 100
                    });
                  }}
                  title="Setup Money-Back Payouts"
                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer border border-emerald-200"
                >
                  <Banknote size={16} />
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/dashboard/plots/payout-ledger?bookingId=${b._id}`)}
                  title="View Weekly Payout Ledger"
                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition cursor-pointer border border-emerald-300"
                >
                  <Banknote size={16} />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  // Columns for Dues Tab
  const dueColumns = [
    {
      name: 'Booking Date',
      selector: (row) => row.bookingDate || row.createdAt,
      cell: (row) => (
        <span className="text-slate-600 font-medium whitespace-nowrap text-xs">
          {new Date(row.bookingDate || row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Booking & Plot',
      selector: (row) => row.bookingNumber,
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-extrabold text-slate-900 font-mono tracking-wide">{row.bookingNumber}</span>
          <span className="text-[11px] font-bold text-slate-700">Plot #{row.plotId?.plotNumber}</span>
        </div>
      ),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Customer',
      selector: (row) => row.customerId?.name || row.customerName,
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900 truncate">{row.customerId?.name || row.customerName}</span>
          <span className="text-[10px] text-slate-500">{row.customerId?.mobile || row.customerMobile || ''}</span>
        </div>
      ),
      sortable: true,
      minWidth: '140px',
      grow: 2,
    },
    {
      name: 'Scheme',
      selector: (row) => row.scheme,
      cell: (row) => (
        <span className="font-semibold text-slate-700 uppercase whitespace-nowrap text-xs">
          {row.scheme === 'FULL_PAYMENT' ? 'One Time' : 'EMI'}
        </span>
      ),
      sortable: true,
      minWidth: '85px',
    },
    {
      name: 'Net Payable',
      selector: (row) => row.netPlotValue || (row.plotValue || 0) - (row.discount || 0),
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900 font-mono">
            ₹{(row.netPlotValue || (row.plotValue || 0) - (row.discount || 0)).toLocaleString('en-IN')}
          </span>
          {(row.discount || 0) > 0 && (
            <span className="text-[10px] text-emerald-700 font-medium">
              -₹{(row.discount || 0).toLocaleString('en-IN')} disc.
            </span>
          )}
        </div>
      ),
      sortable: true,
      minWidth: '105px',
    },
    {
      name: 'Paid Amount',
      selector: (row) => row.totalPaid || 0,
      cell: (row) => <span className="font-bold text-emerald-800 whitespace-nowrap font-mono text-xs">₹{(row.totalPaid || 0).toLocaleString('en-IN')}</span>,
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Due Amount',
      selector: (row) => row.totalDue || row.remainingAmount || 0,
      cell: (row) => (
        <span className="font-bold text-rose-700 whitespace-nowrap font-mono text-xs">
          ₹{(row.totalDue || row.remainingAmount || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'EMIs Paid',
      selector: (row) => row.paidInstallmentsCount || 0,
      cell: (row) => (
        <span className="font-semibold text-slate-800 whitespace-nowrap text-xs">
          {row.totalInstallmentsCount > 0 ? `${row.paidInstallmentsCount} / ${row.totalInstallmentsCount}` : '1 / 1'}
        </span>
      ),
      sortable: true,
      minWidth: '85px',
    },
    {
      name: 'Status',
      selector: (row) => row.dueStatus,
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            row.dueStatus === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.dueStatus}
        </span>
      ),
      sortable: true,
      minWidth: '95px',
    },
    {
      name: 'Action',
      minWidth: '85px',
      cell: (b) => (
        <button
          onClick={() => navigate(`/dashboard/plots/installments?bookingId=${b._id}`)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
        >
          Collect
        </button>
      ),
    },
  ];

  // Columns for Holds Tab
  const holdColumns = [
    {
      name: 'Plot #',
      selector: (row) => row.plotId?.plotNumber || '',
      cell: (row) => <span className="font-bold text-slate-900 font-mono text-xs">{row.plotId?.plotNumber}</span>,
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Customer',
      selector: (row) => row.customerId?.name || row.customerName,
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900">{row.customerId?.name || row.customerName}</span>
          <span className="text-[11px] text-slate-600 font-medium">{row.customerId?.mobile || row.customerMobile}</span>
        </div>
      ),
      sortable: true,
      minWidth: '160px',
      grow: 2,
    },
    {
      name: 'Hold Deposit',
      selector: (row) => row.bookingAmount || 0,
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap font-mono text-xs">₹{(row.bookingAmount || 0).toLocaleString('en-IN')}</span>,
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Hours Remaining',
      selector: (row) => getHoldHoursLeft(row.holdExpiryDate),
      cell: (row) => <span className="font-bold text-amber-800 whitespace-nowrap text-xs">{getHoldHoursLeft(row.holdExpiryDate)}</span>,
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
          {row.status}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Expiry Date',
      selector: (row) => row.holdExpiryDate,
      cell: (row) => (
        <span className="text-slate-800 font-medium whitespace-nowrap text-xs">
          {new Date(row.holdExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
      sortable: true,
      minWidth: '160px',
    },
    {
      name: 'Action',
      minWidth: '140px',
      cell: (h) => (
        <div className="flex items-center gap-1.5 py-1">
          <button
            onClick={() => navigate(`/dashboard/plots/booking/${h._id}`)}
            title="View Full Plot & Hold Details"
            className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg transition cursor-pointer border border-slate-300"
          >
            <Eye size={16} />
          </button>
          {h.receiptId && (
            <button
              onClick={() => navigate(`/dashboard/plots/receipts/${h.receiptId}`)}
              title="Print Booking Receipt"
              className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg transition cursor-pointer border border-slate-300"
            >
              <Printer size={16} />
            </button>
          )}
          <button
            onClick={() => handleEditClick(h)}
            title="Edit Hold"
            className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg transition cursor-pointer border border-slate-300"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDeleteBooking(h._id)}
            disabled={deletingId === h._id}
            title="Delete Hold Reservation"
            className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg transition cursor-pointer border border-rose-200 disabled:opacity-50"
          >
            {deletingId === h._id ? (
              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isReportsPage ? 'Plot Reports & Audits' : 'Plot Bookings & Management'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isReportsPage
              ? 'Comprehensive due reports, payment schedules, and active plot holds.'
              : 'Browse, verify, and export booking schedules, collections, and liability records.'}
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/dashboard/plots/addbooking')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium text-sm transition cursor-pointer shadow-sm bg-primary"
            type="button"
          >
            New Booking
          </button>
        </div>
      </div>

      {/* Tabs */}
      {isReportsPage && (
        <div className="flex flex-wrap border-b border-slate-200 shrink-0 gap-6">
          {[
            { id: 'dues', label: 'Due Report' },
            { id: 'holds', label: 'Active Holds' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition ${activeTab === t.id
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      {activeTab === 'bookings' && !loading && (
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by booking #, customer name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none pl-10 pr-3.5 rounded-xl font-medium text-sm text-slate-800 transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={schemeFilter}
              onChange={e => setSchemeFilter(e.target.value)}
              className="h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition min-w-[150px]"
            >
              <option value="">All Schemes</option>
              <option value="FULL_PAYMENT">One Time</option>
              <option value="MONTHLY_INSTALLMENT">EMI</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition min-w-[130px]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Bar for Dues */}
      {activeTab === 'dues' && !loading && (
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by booking #, customer name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none pl-10 pr-3.5 rounded-xl font-medium text-sm text-slate-800 transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={schemeFilter}
              onChange={e => setSchemeFilter(e.target.value)}
              className="h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition min-w-[150px]"
            >
              <option value="">All Schemes</option>
              <option value="FULL_PAYMENT">One Time</option>
              <option value="MONTHLY_INSTALLMENT">EMI</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition min-w-[130px]"
            >
              <option value="">All Due Status</option>
              <option value="DUE">DUE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Bar for Sponsor Commissions */}
      {activeTab === 'commissions' && !loading && (
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search sponsor by name, ID, email or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none pl-10 pr-3.5 rounded-xl font-medium text-sm text-slate-800 transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={balanceFilter}
              onChange={e => setBalanceFilter(e.target.value)}
              className="h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition min-w-[160px]"
            >
              <option value="">All Wallet Balances</option>
              <option value="with_balance">Available Balance &gt; ₹0</option>
              <option value="zero_balance">Zero Balance (₹0)</option>
            </select>
          </div>
        </div>
      )}
      {/* Table Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'bookings' && (
          <DataTable
            columns={bookingColumns}
            data={filteredBookings}
            progressPending={loading}
            progressComponent={
              <PageLoader
                fullScreen={false}
                minHeight="min-h-[220px]"
                title="Loading Plot Bookings..."
                subtitle="Fetching real-time customer and plot contracts"
              />
            }
            customStyles={customStyles}
            pagination
            responsive
            highlightOnHover
            noDataComponent={
              <div className="p-8 text-center text-slate-400 italic font-medium">
                {data.length === 0 ? 'No bookings recorded yet.' : 'No bookings match the selected filters.'}
              </div>
            }
          />
        )}

        {activeTab === 'dues' && (
          <DataTable
            columns={dueColumns}
            data={filteredDues}
            progressPending={loading}
            progressComponent={
              <PageLoader
                fullScreen={false}
                minHeight="min-h-[220px]"
                title="Loading Due Reports..."
                subtitle="Calculating outstanding installments and due schedules"
              />
            }
            customStyles={customStyles}
            pagination
            responsive
            highlightOnHover
            noDataComponent={
              <div className="p-8 text-center text-slate-500 italic font-medium">
                No due records match the selected filters.
              </div>
            }
          />
        )}

        {activeTab === 'holds' && (
          <DataTable
            columns={holdColumns}
            data={data}
            progressPending={loading}
            progressComponent={
              <PageLoader
                fullScreen={false}
                minHeight="min-h-[220px]"
                title="Loading Active Holds..."
                subtitle="Synchronizing temporary plot holds and expiry countdowns"
              />
            }
            customStyles={customStyles}
            pagination
            responsive
            highlightOnHover
            noDataComponent={
              <div className="p-8 text-center text-slate-500 italic font-medium">
                No plots currently on hold.
              </div>
            }
          />
        )}
      </div>

      {/* Edit Contract Modal */}
      <Modalbox open={Boolean(editingBooking)} onClose={() => setEditingBooking(null)}>
        <div className="p-6 bg-white rounded-2xl w-[720px] max-w-[95vw] space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Edit Booking Contract #{editingBooking?.bookingNumber}
              </h3>
              <p className="text-[0.7rem] font-medium text-slate-500">Update all customer, plot, pricing, payment and schedule parameters.</p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setEditingBooking(null)}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleUpdateBooking} className="flex flex-col gap-4 text-xs">
            {/* 1. Customer & Plot Selection */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">1. Customer & Plot Assignment</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Search */}
                <div className="flex flex-col gap-1 relative">
                  <label className="text-xs font-semibold text-slate-600">Customer</label>
                  <input
                    type="text"
                    placeholder="Search customer by name, code or mobile..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none pr-8"
                  />
                  {customerSearch && (
                    <button
                      onClick={() => {
                        setEditForm({ ...editForm, customerId: '' });
                        setCustomerSearch('');
                      }}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute top-[68px] left-0 right-0 max-h-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto">
                      {customerSearchResults.map(c => (
                        <div
                          key={c._id}
                          className="p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold flex items-center justify-between border-b border-slate-100 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setEditForm({ ...editForm, customerId: c._id });
                            setCustomerSearch(`${c.name} (${c.customerCode || c.mobile || ''})`);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div>
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-[0.65rem] text-slate-400">{c.mobile}</p>
                          </div>
                          <span className="text-[0.65rem] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.customerCode || 'CUSTOMER'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plot Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Select Plot</label>
                  <select
                    value={editForm.plotId}
                    onChange={(e) => setEditForm({ ...editForm, plotId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                    required
                  >
                    <option value={editingBooking?.plotId?._id || editingBooking?.plotId}>
                      Plot #{editingBooking?.plotId?.plotNumber || 'Current Plot'} (Current)
                    </option>
                    {plotsList
                      .filter(p => p._id !== (editingBooking?.plotId?._id || editingBooking?.plotId) && p.status === 'AVAILABLE')
                      .map(p => (
                        <option key={p._id} value={p._id}>
                          Plot #{p.plotNumber} ({p.seriesId?.seriesName || 'Series'}) - {p.areaSqFt || 0} SQFT @ ₹{p.ratePerSqFt || 0}/SQFT
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Booking Type & Status Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Booking Type</label>
                <select
                  value={editForm.bookingType}
                  onChange={(e) => setEditForm({ ...editForm, bookingType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                >
                  <option value="BOOKING">BOOKING (Confirmed)</option>
                  <option value="HOLD">HOLD (Temporary Lock)</option>
                </select>
              </div>

              {editForm.bookingType === 'HOLD' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Hold Expiry Term</label>
                  <select
                    value={editForm.holdExpiryDays}
                    onChange={(e) => setEditForm({ ...editForm, holdExpiryDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  >
                    <option value="7">7 Days Hold</option>
                    <option value="15">15 Days Hold</option>
                    <option value="30">30 Days Hold</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Booking Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="HOLD">HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Contract Agreement No.</label>
                <input
                  type="text"
                  value={editForm.agreementNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, agreementNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  placeholder="e.g. AG-2026/089"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Booking Date</label>
                <input
                  type="date"
                  value={editForm.bookingDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, bookingDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>
            </div>

            {/* 3. Scheme, Pricing & Terms */}
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wide">2. Tenure & Pricing Slab (समय / दर)</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tenure / Scheme Matrix Dropdown */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Tenure & Rate Slab (समय / बिक्री दर) *</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-sm font-bold text-teal-950 focus:ring-2 focus:ring-teal-600 outline-none"
                    value={editForm.tenureMonths}
                    onChange={(e) => setEditForm({ ...editForm, tenureMonths: Number(e.target.value) })}
                  >
                    {slabs.map((s) => (
                      <option key={s.tenureMonths} value={s.tenureMonths}>
                        {s.tenureMonths === 0
                          ? `0 Months (One-Time Payment) — ₹${s.plotRate}/sqft [100% Downpayment]`
                          : `${s.tenureMonths} Months EMI — ₹${s.plotRate}/sqft [40% Down / 60% in ${s.tenureMonths} EMIs]`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-teal-700 font-semibold px-1">
                    Rate: ₹{currentSlab.plotRate}/sqft | Promoter: {currentSlab.promoterCommissionPercent}% | Dev: {currentSlab.developerCommissionPercent}%
                  </span>
                </div>

                {/* Discount Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Discount</label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 bg-white">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="px-3 py-2.5 bg-slate-100 text-xs font-bold text-slate-700 border-r border-slate-300 outline-none cursor-pointer"
                    >
                      <option value="RUPEE">₹ (Flat)</option>
                      <option value="PERCENT">% (Percentage)</option>
                      <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                    </select>
                    <input
                      className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none text-slate-800 font-medium"
                      type="tel"
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder={
                        discountType === 'PERCENT'
                          ? 'e.g. 10%'
                          : discountType === 'SQFT_RATE'
                          ? 'e.g. 50 (₹/Sq.Ft.)'
                          : 'e.g. 5000 (Flat ₹)'
                      }
                    />
                  </div>
                  {calculatedDiscount > 0 && (
                    <span className="text-[0.68rem] text-emerald-700 font-semibold px-1">
                      Calculated Discount: ₹{calculatedDiscount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Govt Rate */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Govt. Base Rate (₹ / Sq.Ft.)</label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                    type="tel"
                    value={govtRate}
                    onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Govt rate per sqft (Default 100)"
                  />
                </div>

                {/* One Time vs EMI Breakdown */}
                {isOneTime ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">Total Final Payment (100%)</label>
                      <input
                        className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono cursor-not-allowed rounded-xl text-sm"
                        type="text"
                        value={`₹${netContractValue.toLocaleString('en-IN')}`}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">Payment Time Limit (Months)</label>
                      <input
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                        type="tel"
                        value={editForm.oneTimeMonths || 1}
                        onChange={(e) => setEditForm({ ...editForm, oneTimeMonths: Number(e.target.value.replace(/[^0-9]/g, '')) || 1 })}
                        placeholder="Time limit (e.g. 1, 2, 3 months)"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Downpayment Calculation Basis Toggle */}
                    <div className="md:col-span-2 bg-white border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">
                          40% Downpayment Calculation Base
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {downpaymentBase === 'BEFORE_DISCOUNT'
                            ? `Gross Value (₹${calculatedPlotValue.toLocaleString('en-IN')}). Discount of ₹${calculatedDiscount.toLocaleString('en-IN')} reduces EMI balance.`
                            : `Net Value (₹${netContractValue.toLocaleString('en-IN')} after ₹${calculatedDiscount.toLocaleString('en-IN')} discount).`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setDownpaymentBase('AFTER_DISCOUNT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            downpaymentBase === 'AFTER_DISCOUNT'
                              ? 'bg-teal-700 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          After Discount (Net)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDownpaymentBase('BEFORE_DISCOUNT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            downpaymentBase === 'BEFORE_DISCOUNT'
                              ? 'bg-teal-700 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Before Discount (Gross)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Downpayment (40% of {downpaymentBase === 'BEFORE_DISCOUNT' ? 'Gross Plot Value' : 'Net Value'})
                      </label>
                      <input
                        className="w-full px-3.5 py-2.5 bg-teal-50 border border-teal-200 text-teal-800 font-bold font-mono cursor-not-allowed rounded-xl text-sm"
                        type="text"
                        value={`₹${downpaymentAmt.toLocaleString('en-IN')}`}
                        disabled
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">Downpayment Grace Term (Months)</label>
                      <input
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                        type="tel"
                        value={editForm.downpaymentMonths || 1}
                        onChange={(e) => setEditForm({ ...editForm, downpaymentMonths: Number(e.target.value.replace(/[^0-9]/g, '')) || 1 })}
                        placeholder="e.g. 1 or 2 months"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">EMI Balance ({downpaymentBase === 'BEFORE_DISCOUNT' ? 'Net - Downpayment' : '60% of Net'})</label>
                      <input
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono cursor-not-allowed rounded-xl text-sm"
                        type="text"
                        value={`₹${emiPrincipalAmt.toLocaleString('en-IN')}`}
                        disabled
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">Monthly EMI Amount ({editForm.tenureMonths} Months)</label>
                      <input
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 font-black font-mono cursor-not-allowed rounded-xl text-sm"
                        type="text"
                        value={`₹${emiMonthlyAmt.toLocaleString('en-IN')} / month`}
                        disabled
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 4. Payment Mode & Sponsor Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Payment Mode</label>
                <select
                  value={editForm.paymentMode}
                  onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online / UPI</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={editForm.transactionReference}
                  onChange={(e) => setEditForm({ ...editForm, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  placeholder="e.g. TXN987654321 / CHQ-1002"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Sponsor / Agent Assignment</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search sponsor by name or ID..."
                  value={sponsorSearch}
                  onChange={(e) => {
                    setSponsorSearch(e.target.value);
                    setShowSponsorDropdown(true);
                  }}
                  onFocus={() => setShowSponsorDropdown(true)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none pr-8"
                />
                {sponsorSearch && (
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    onClick={() => {
                      setSponsorSearch('');
                      setEditForm({ ...editForm, sponsorId: '' });
                      setShowSponsorDropdown(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showSponsorDropdown && (
                  <div className="absolute top-[48px] left-0 right-0 max-h-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto">
                    <div
                      className="p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold border-b border-slate-100"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setEditForm({ ...editForm, sponsorId: '' });
                        setSponsorSearch('Direct / Company (No Sponsor)');
                        setShowSponsorDropdown(false);
                      }}
                    >
                      Direct / Company (No Sponsor)
                    </div>
                    {sponsorSearchResults.map(c => (
                      <div
                        key={c._id}
                        className="p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold flex items-center justify-between border-b border-slate-100 last:border-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setEditForm({ ...editForm, sponsorId: c._id });
                          setSponsorSearch(`${c.name} (${c.sponsorCode || c.customerId || ''})`);
                          setShowSponsorDropdown(false);
                        }}
                      >
                        <span>{c.name}</span>
                        <span className="text-[0.65rem] font-bold text-indigo-600">{c.sponsorCode || c.customerId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Internal Notes / Remarks</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows="2"
                className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
                placeholder="Enter contract update remarks..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white z-10">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* Payout Setup Modal */}
      <Modalbox open={Boolean(setupPayoutBooking)} onClose={() => setSetupPayoutBooking(null)}>
        <div className="p-6 bg-white rounded-2xl w-[480px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Setup Weekly Payouts</h3>
            <button
              type="button"
              onClick={() => setSetupPayoutBooking(null)}
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Configure money-back payouts for fully paid booking <strong>{setupPayoutBooking?.bookingNumber}</strong> (Plot <strong>{setupPayoutBooking?.plotId?.plotNumber}</strong>).
          </p>

          <form onSubmit={handleSetupPayoutSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Payout Start Date</label>
              <input
                type="date"
                value={setupPayoutForm.startDate}
                onChange={(e) => setSetupPayoutForm({ ...setupPayoutForm, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Weekly Return Amount (₹) (Calculated: Plot Value / 500)</label>
              <input
                type="number"
                value={setupPayoutForm.weeklyAmount}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setSetupPayoutBooking(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={setupPayoutSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm transition min-w-[120px] flex items-center justify-center disabled:opacity-50"
              >
                {setupPayoutSaving ? 'Saving...' : 'Initialize Payouts'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* Plot Sponsor Ledger Modal */}
      <Modalbox open={Boolean(selectedSponsorLedger)} onClose={() => setSelectedSponsorLedger(null)}>
        <div className="p-6 bg-white rounded-2xl w-[800px] max-w-[90vw] space-y-4 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Plot Sponsor Commission Ledger — {selectedSponsorLedger?.name} ({selectedSponsorLedger?.customerId})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Individual plot commission credit statement for sponsor {selectedSponsorLedger?.name}
              </p>
            </div>
            <button
              onClick={() => setSelectedSponsorLedger(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {sponsorLedgerLoading ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                Loading ledger entries...
              </div>
            ) : sponsorLedgerData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic text-xs font-medium">
                No commission entries found for this sponsor.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                    <th className="p-3 uppercase">Date</th>
                    <th className="p-3 uppercase">From Customer</th>
                    <th className="p-3 uppercase">Plot #</th>
                    <th className="p-3 uppercase text-right">Collection Amount</th>
                    <th className="p-3 uppercase text-right">Commission %</th>
                    <th className="p-3 uppercase text-right font-bold">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sponsorLedgerData.map((entry) => {
                    const collectionAmount = entry.commissionPercent > 0
                      ? Math.round((entry.amount / (entry.commissionPercent / 100)) * 100) / 100
                      : (entry.installmentId?.dueAmount || entry.bookingId?.plotValue || 0);

                    return (
                      <tr key={entry._id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 whitespace-nowrap font-bold text-slate-800">
                          {entry.customerId?.name || 'Unknown'} <span className="text-[0.65rem] text-slate-400">({entry.customerId?.customerId || '-'})</span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-600 whitespace-nowrap">
                          {entry.bookingId?.plotId?.plotNumber || '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-700 whitespace-nowrap">
                          ₹{Number(collectionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-500 whitespace-nowrap">
                          {entry.commissionPercent}%
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          +₹{Number(entry.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setSelectedSponsorLedger(null)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modalbox>

      {/* ── DELETE BOOKING CONFIRMATION MODAL ── */}
      <Modalbox open={Boolean(bookingToDelete)} onClose={() => setBookingToDelete(null)}>
        {bookingToDelete && (() => {
          const paidAmt = (bookingToDelete.plotValue || 0) - (bookingToDelete.discount || 0) - (bookingToDelete.remainingAmount || 0);
          const hasCollections = paidAmt > 0;

          return (
            <div className="bg-white rounded-2xl w-[92vw] max-w-md p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${hasCollections ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                  {hasCollections ? '⚠️' : '🗑️'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {hasCollections ? 'Cannot Delete Booking' : 'Delete Plot Booking?'}
                  </h3>
                  <p className="text-xs text-slate-500">Booking #{bookingToDelete.bookingNumber}</p>
                </div>
              </div>

              {/* Booking Info Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{bookingToDelete.customerId?.name || bookingToDelete.customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plot #:</span>
                  <span className="font-bold text-slate-800">{bookingToDelete.plotId?.plotNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plot Value:</span>
                  <span className="font-bold text-slate-800">₹{(bookingToDelete.plotValue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Collected:</span>
                  <span className={`font-bold ${hasCollections ? 'text-amber-700' : 'text-slate-600'}`}>
                    ₹{paidAmt.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Message based on collection existence */}
              {hasCollections ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Notice:</strong> ₹{paidAmt.toLocaleString('en-IN')} has already been collected for this booking. You cannot delete a booking with existing collections. Please reverse or delete all receipts from the <strong>Collections</strong> page first.
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete this booking? This will restore plot <strong>{bookingToDelete.plotId?.plotNumber}</strong> status back to <strong>AVAILABLE</strong> and remove the contract schedule.
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition"
                >
                  {hasCollections ? 'Close' : 'Cancel'}
                </button>
                {!hasCollections && (
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBooking}
                    disabled={deletingId === bookingToDelete._id}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition shadow-sm flex items-center justify-center min-w-[110px]"
                  >
                    {deletingId === bookingToDelete._id ? 'Deleting...' : 'Yes, Delete Booking'}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modalbox>
    </div>
  );
};

export default PlotReports;
