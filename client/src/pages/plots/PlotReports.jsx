import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import PageLoader from '../../components/common/PageLoader';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

import { getBookingColumns } from './reports/BookingColumns';
import { getDueColumns, getHoldColumns } from './reports/DueAndHoldColumns';
import DeleteBookingModal from './reports/DeleteBookingModal';
import SetupPayoutModal from './reports/SetupPayoutModal';
import SponsorLedgerModal from './reports/SponsorLedgerModal';
import RevisionsAuditModal from './reports/RevisionsAuditModal';
import EditBookingModal from './reports/EditBookingModal';
import ReportFilterBar from './reports/ReportFilterBar';

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
  const [balanceFilter, setBalanceFilter] = useState('');

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
    setBalanceFilter('');
    fetchReport(activeTab);
  }, [activeTab]);

  const getHoldHoursLeft = (expiryDate) => {
    const diff = new Date(expiryDate) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  // Edit Contract State
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
    landSourcing: [],
  });

  const [availableLandSources, setAvailableLandSources] = useState([]);
  const [discountType, setDiscountType] = useState('RUPEE');
  const [discountVal, setDiscountVal] = useState('');
  const [downpaymentBase, setDownpaymentBase] = useState('BEFORE_DISCOUNT');
  const [govtRate, setGovtRate] = useState('100');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [plotsList, setPlotsList] = useState([]);

  // Fetch customer search options dynamically inside Modal
  useEffect(() => {
    const q = customerSearch.trim();
    if (!q) {
      setCustomerSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      api
        .get('/plots/customers', {
          params: { search: q, limit: 20 },
        })
        .then((res) => {
          const list = res.data.data?.customers || res.data.customers || res.data.data || [];
          setCustomerSearchResults(list);
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [customerSearch]);

  const slabs =
    rateConfig?.rateSlabs?.length > 0
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

  const selectedPlotObj = plotsList.find((p) => p._id === editForm.plotId) || editingBooking?.plotId || {};
  const plotArea = selectedPlotObj?.plotSize || selectedPlotObj?.area || selectedPlotObj?.areaSqFt || 0;
  const isCorner = selectedPlotObj?.plotType === 'CORNER';
  const cornerExtra = isCorner ? rateConfig?.cornerExtraPercent || 20 : 0;
  const baseRate = currentSlab.plotRate || rateConfig?.baseSqFtRate || 1000;
  const effectiveRate = baseRate * (1 + cornerExtra / 100);
  const calculatedPlotValue = plotArea > 0 ? Math.round(plotArea * effectiveRate) : editingBooking?.plotValue || 0;

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
  const dpPercent = currentSlab.downpaymentPercent ? currentSlab.downpaymentPercent / 100 : isOneTime ? 1.0 : 0.4;

  let downpaymentAmt = 0;
  let emiPrincipalAmt = 0;

  if (isOneTime) {
    downpaymentAmt = netContractValue;
    emiPrincipalAmt = 0;
  } else {
    downpaymentAmt = Math.round(calculatedPlotValue * dpPercent);
    emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
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
    } catch {}

    const custObj = booking.customerId;
    const custName = custObj?.name || booking.customerName || '';
    const custCode = custObj?.customerCode || custObj?.mobile || '';
    setCustomerSearch(custName ? `${custName} (${custCode})` : '');

    const bookingTenure = booking.tenureMonths !== undefined ? Number(booking.tenureMonths) : booking.scheme === 'FULL_PAYMENT' ? 0 : 3;
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
      bookingDate: booking.bookingDate
        ? new Date(booking.bookingDate).toISOString().split('T')[0]
        : new Date(booking.createdAt).toISOString().split('T')[0],
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
      landSourcing: Array.isArray(booking.landSourcing) ? JSON.parse(JSON.stringify(booking.landSourcing)) : [],
    };
    setEditForm(initialForm);

    api
      .get('/plots/kisan-agreements/sources')
      .then((res) => setAvailableLandSources(res.data.data || []))
      .catch(() => setAvailableLandSources([]));
  };

  // Sponsor Ledger Modal state
  const [selectedSponsorLedger, setSelectedSponsorLedger] = useState(null);
  const [sponsorLedgerData, setSponsorLedgerData] = useState([]);
  const [sponsorLedgerLoading, setSponsorLedgerLoading] = useState(false);

  // Booking Revisions Modal state
  const [selectedRevisionsBooking, setSelectedRevisionsBooking] = useState(null);
  const [revisionsData, setRevisionsData] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [editingNarrationId, setEditingNarrationId] = useState(null);
  const [editingNarrationText, setEditingNarrationText] = useState('');
  const [savingNarration, setSavingNarration] = useState(false);

  const openRevisionsModal = async (booking) => {
    if (!booking || !booking._id) return;
    setSelectedRevisionsBooking(booking);
    setRevisionsLoading(true);
    setEditingNarrationId(null);
    try {
      const res = await api.get(`/plots/bookings/${booking._id}/revisions`);
      setRevisionsData(res.data.data || []);
    } catch {
      toast.error('Failed to load contract revisions');
      setRevisionsData([]);
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleSaveNarration = async (revId) => {
    if (!revId) return;
    setSavingNarration(true);
    try {
      const res = await api.put(`/plots/bookings/revisions/${revId}/narration`, {
        adminNarration: editingNarrationText,
      });
      toast.success('Narration updated successfully');
      setRevisionsData((prev) =>
        prev.map((r) =>
          r._id === revId
            ? { ...r, adminNarration: res.data.data?.adminNarration || editingNarrationText, reason: res.data.data?.reason || editingNarrationText }
            : r
        )
      );
      setEditingNarrationId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update narration');
    } finally {
      setSavingNarration(false);
    }
  };

  // Weekly Payout states
  const [setupPayoutBooking, setSetupPayoutBooking] = useState(null);
  const [setupPayoutForm, setSetupPayoutForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    weeklyAmount: 1200,
  });
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
        landSourcing: editForm.landSourcing || [],
        reason: (editForm.reason || '').trim(),
        adminNarration: (editForm.reason || '').trim(),
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
      toast.error(
        `Cannot delete Booking #${bookingToDelete.bookingNumber || ''} because ₹${paidAmt.toLocaleString(
          'en-IN'
        )} has already been collected. Please reverse or delete all collections from the Collections tab first.`
      );
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

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hold reservation?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/plots/bookings/${id}`);
      toast.success('Hold deleted successfully');
      fetchReport(activeTab);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete hold');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(data) || activeTab !== 'bookings') return [];
    return data.filter((b) => {
      const matchesSearch =
        b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.name || b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.mobile || b.customerMobile || '').includes(searchTerm);

      const matchesScheme = !schemeFilter || b.scheme === schemeFilter;
      const matchesStatus = !statusFilter || b.status === statusFilter;

      return matchesSearch && matchesScheme && matchesStatus;
    });
  }, [data, activeTab, searchTerm, schemeFilter, statusFilter]);

  const filteredDues = useMemo(() => {
    if (!Array.isArray(data) || activeTab !== 'dues') return [];
    return data.filter((b) => {
      const matchesSearch =
        b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.name || b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerId?.mobile || b.customerMobile || '').includes(searchTerm);

      const matchesScheme = !schemeFilter || b.scheme === schemeFilter;
      const matchesDueStatus = !statusFilter || b.dueStatus === statusFilter;

      return matchesSearch && matchesScheme && matchesDueStatus;
    });
  }, [data, activeTab, searchTerm, schemeFilter, statusFilter]);

  const customStyles = useCustomStyles();

  const bookingColumns = useMemo(
    () =>
      getBookingColumns({
        navigate,
        handleEditClick,
        openRevisionsModal,
        openDeleteBookingModal,
        deletingId,
        setSetupPayoutBooking,
        setSetupPayoutForm,
      }),
    [navigate, deletingId]
  );

  const dueColumns = useMemo(() => getDueColumns({ navigate }), [navigate]);

  const holdColumns = useMemo(
    () =>
      getHoldColumns({
        navigate,
        handleEditClick,
        handleDeleteBooking,
        deletingId,
        getHoldHoursLeft,
      }),
    [navigate, deletingId]
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isReportsPage ? 'Plot Reports & Audits' : 'Plot Bookings & Management'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isReportsPage
              ? 'Comprehensive due reports, payment schedules, and active plot holds.'
              : 'Browse, verify, and export booking schedules, collections, and liability records.'}
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            size="md"
            startIcon={Plus}
            onClick={() => navigate('/dashboard/plots/addbooking')}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {isReportsPage && (
        <div className="flex flex-wrap border-b border-slate-200 shrink-0 gap-6">
          {[
            { id: 'dues', label: 'Due Report' },
            { id: 'holds', label: 'Active Holds' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-xs font-bold border-b-2 cursor-pointer transition ${
                activeTab === t.id
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
      {!loading && (
        <ReportFilterBar
          activeTab={activeTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          schemeFilter={schemeFilter}
          setSchemeFilter={setSchemeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          balanceFilter={balanceFilter}
          setBalanceFilter={setBalanceFilter}
        />
      )}

      {/* Table Content */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
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
              <div className="p-8 text-center text-slate-400 italic text-xs font-medium">
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
              <div className="p-8 text-center text-slate-500 italic text-xs font-medium">
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
              <div className="p-8 text-center text-slate-500 italic text-xs font-medium">
                No plots currently on hold.
              </div>
            }
          />
        )}
      </div>

      {/* Modals */}
      <EditBookingModal
        editingBooking={editingBooking}
        onClose={() => setEditingBooking(null)}
        onSubmit={handleUpdateBooking}
        editForm={editForm}
        setEditForm={setEditForm}
        saving={saving}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        showCustomerDropdown={showCustomerDropdown}
        setShowCustomerDropdown={setShowCustomerDropdown}
        customerSearchResults={customerSearchResults}
        plotsList={plotsList}
        slabs={slabs}
        currentSlab={currentSlab}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountVal={discountVal}
        setDiscountVal={setDiscountVal}
        calculatedDiscount={calculatedDiscount}
        govtRate={govtRate}
        setGovtRate={setGovtRate}
        isOneTime={isOneTime}
        netContractValue={netContractValue}
        downpaymentAmt={downpaymentAmt}
        emiPrincipalAmt={emiPrincipalAmt}
        emiMonthlyAmt={emiMonthlyAmt}
        availableLandSources={availableLandSources}
        plotArea={plotArea}
      />

      <SetupPayoutModal
        booking={setupPayoutBooking}
        onClose={() => setSetupPayoutBooking(null)}
        onSubmit={handleSetupPayoutSubmit}
        form={setupPayoutForm}
        setForm={setSetupPayoutForm}
        saving={setupPayoutSaving}
      />

      <SponsorLedgerModal
        sponsor={selectedSponsorLedger}
        onClose={() => setSelectedSponsorLedger(null)}
        loading={sponsorLedgerLoading}
        ledgerData={sponsorLedgerData}
      />

      <DeleteBookingModal
        bookingToDelete={bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={handleConfirmDeleteBooking}
        deletingId={deletingId}
      />

      <RevisionsAuditModal
        booking={selectedRevisionsBooking}
        onClose={() => setSelectedRevisionsBooking(null)}
        loading={revisionsLoading}
        revisionsData={revisionsData}
        editingNarrationId={editingNarrationId}
        setEditingNarrationId={setEditingNarrationId}
        editingNarrationText={editingNarrationText}
        setEditingNarrationText={setEditingNarrationText}
        handleSaveNarration={handleSaveNarration}
        savingNarration={savingNarration}
      />
    </div>
  );
};

export default PlotReports;
