import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import PageLoader from '../../../components/common/PageLoader';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

import { getBookingColumns } from './components/BookingColumns';
import { getDueColumns, getHoldColumns } from './components/DueAndHoldColumns';
import DeleteBookingModal from './components/DeleteBookingModal';
import SetupPayoutModal from './components/SetupPayoutModal';
import SponsorLedgerModal from './components/SponsorLedgerModal';
import RevisionsAuditModal from './components/RevisionsAuditModal';
import ReportFilterBar from './components/ReportFilterBar';

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

  // Navigation to full-page edit booking contract
  const handleEditClick = (booking) => {
    if (booking?._id) {
      navigate(`/dashboard/plots/booking/edit/${booking._id}`);
    }
  };

  const [deletingId, setDeletingId] = useState(null);

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
    const proceed = await confirmDialog({
      title: 'Delete Hold Reservation?',
      text: 'Are you sure you want to delete this hold reservation? The plot will be released back to Available.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;

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
