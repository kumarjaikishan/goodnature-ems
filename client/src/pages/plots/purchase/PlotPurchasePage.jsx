import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, FileText, ShieldCheck, Users } from 'lucide-react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import confirmDialog from '../../../utils/confirmDialog';
import PageLoader from '../../../components/common/PageLoader';

import KisanSummaryMetrics from './components/KisanSummaryMetrics';
import KisanAgreementsTable from './components/KisanAgreementsTable';
import RegistryDeedsTable from './components/RegistryDeedsTable';
import KisanSellersTable from './components/KisanSellersTable';
import PurchasersTable from './components/PurchasersTable';
import CreateAgreementModal from './components/CreateAgreementModal';
import EditAgreementModal from './components/EditAgreementModal';
import CreateDeedModal from './components/CreateDeedModal';
import EditDeedModal from './components/EditDeedModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import KisanLedgersDrawer from './components/KisanLedgersDrawer';
import ViewDeedModal from './components/ViewDeedModal';

const PlotPurchasePage = () => {
  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Top Main Navigation Tab: 'agreements' | 'deeds' | 'sellers' | 'purchasers'
  const [mainTab, setMainTab] = useState('agreements');
  const [deedSearch, setDeedSearch] = useState('');

  // Kisan / Sellers Master State
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);

  // Purchasers / Buyers Master State
  const [purchasers, setPurchasers] = useState([]);
  const [purchasersLoading, setPurchasersLoading] = useState(false);

  // Selected Agreement Detail Drawer / Modal
  const [selectedAgrId, setSelectedAgrId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');

  // Selected Deed for Viewing
  const [viewDeedTarget, setViewDeedTarget] = useState(null);

  // Create Agreement Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    agreementNumber: '',
    agreementDate: new Date().toISOString().split('T')[0],
    agreementEndDate: '',
    remarks: '',
    landParcels: [
      {
        mauja: '',
        thanaNumber: '',
        khataNumber: '',
        khesraNumber: '',
        jamabandiNumber: '',
        chaudhi: { north: '', south: '', east: '', west: '' },
        araziDismil: '',
        totalSqFt: 0,
        ratePerDismil: '',
        ratePerSqFt: 0,
        totalAmount: '',
        remarks: '',
      },
    ],
    farmers: [
      {
        name: '',
        guardianName: '',
        relation: 'Father',
        mobile: '',
        aadhaarNumber: '',
        panNumber: '',
        sharePercent: 100,
        address: '',
      },
    ],
    purchasers: [
      {
        name: '',
        contact: '',
        aadhaarNumber: '',
      },
    ],
    attachments: [],
  });

  // Edit Agreement Modal State
  const [editAgrOpen, setEditAgrOpen] = useState(false);
  const [editAgrLoading, setEditAgrLoading] = useState(false);
  const [editAgrTarget, setEditAgrTarget] = useState(null);
  const [editAgrForm, setEditAgrForm] = useState({
    agreementNumber: '',
    agreementDate: '',
    agreementEndDate: '',
    remarks: '',
    landParcels: [],
    farmers: [],
    purchasers: [],
    attachments: [],
  });

  // Convert / Create Registry Deed Modal State
  const [deedModalOpen, setDeedModalOpen] = useState(false);
  const [deedLoading, setDeedLoading] = useState(false);
  const [targetAgreementForDeed, setTargetAgreementForDeed] = useState(null);
  const [deedForm, setDeedForm] = useState({
    deedNumber: '',
    deedDate: new Date().toISOString().split('T')[0],
    subRegistrarOffice: '',
    registeredDismil: '',
    remarks: '',
    parcels: [],
  });

  // Edit Registry Deed Modal State
  const [editDeedModalOpen, setEditDeedModalOpen] = useState(false);
  const [editDeedLoading, setEditDeedLoading] = useState(false);
  const [editingDeedTarget, setEditingDeedTarget] = useState(null);
  const [editDeedForm, setEditDeedForm] = useState({
    deedNumber: '',
    deedDate: '',
    subRegistrarOffice: '',
    remarks: '',
  });

  // Record Payment to Kisan Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [targetAgreementForPayment, setTargetAgreementForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    transactionReference: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Fetch Agreements list
  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plots/kisan-agreements', {
        params: { search, status: statusFilter !== 'ALL' ? statusFilter : undefined, page, limit: 50 },
      });
      const dataList = res.data?.data?.agreements || res.data?.data?.customers || res.data?.data || res.data?.agreements || [];
      setAgreements(Array.isArray(dataList) ? dataList : []);
      setTotal(res.data?.pagination?.total || res.data?.total || dataList.length || 0);
    } catch {
      toast.error('Failed to load Plot Purchase Agreements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Kisan / Sellers directory
  const fetchSellers = async () => {
    setSellersLoading(true);
    try {
      const res = await api.get('/plots/kisan-sellers');
      const list = res.data?.data || res.data || [];
      setSellers(Array.isArray(list) ? list : []);
    } catch {
      // silent or toast
    } finally {
      setSellersLoading(false);
    }
  };

  // Fetch Purchasers / Buyers master
  const fetchPurchasers = async () => {
    setPurchasersLoading(true);
    try {
      const res = await api.get('/plots/purchasers');
      const list = res.data?.data || res.data || [];
      setPurchasers(Array.isArray(list) ? list : []);
    } catch {
      // silent
    } finally {
      setPurchasersLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [page, statusFilter]);

  useEffect(() => {
    fetchSellers();
    fetchPurchasers();
  }, []);

  // Load Agreement Full Ledgers
  const loadAgreementDetails = async (id, targetTab = 'overview') => {
    setSelectedAgrId(id);
    setDetailTab(targetTab);
    try {
      const res = await api.get(`/plots/kisan-agreements/${id}`);
      setDetailData(res.data?.data || res.data);
    } catch {
      toast.error('Failed to load purchase agreement full ledger');
    }
  };

  // Flattened Registry Deeds list from all loaded agreements
  const allRegistryDeeds = useMemo(() => {
    const list = [];
    agreements.forEach((agr) => {
      if (Array.isArray(agr.registryDeeds)) {
        agr.registryDeeds.forEach((deed) => {
          list.push({
            ...deed,
            parentAgreementId: agr._id,
            parentAgreementNumber: agr.agreementNumber,
            parentAgreementDate: agr.agreementDate,
            parentAgreementStatus: agr.status,
            mauja: agr.mauja,
            khataNumber: agr.khataNumber,
            khesraNumber: agr.khesraNumber,
            thanaNumber: agr.thanaNumber,
            jamabandiNumber: agr.jamabandiNumber,
            farmers: agr.farmers || [],
            purchasers: agr.purchasers || [],
            agreementParcels: agr.landParcels || [],
          });
        });
      }
    });
    return list;
  }, [agreements]);

  // Filtered Registry Deeds
  const filteredDeeds = useMemo(() => {
    if (!deedSearch.trim()) return allRegistryDeeds;
    const q = deedSearch.toLowerCase().trim();
    return allRegistryDeeds.filter((d) => {
      return (
        d.deedNumber?.toLowerCase().includes(q) ||
        d.parentAgreementNumber?.toLowerCase().includes(q) ||
        d.mauja?.toLowerCase().includes(q) ||
        d.khataNumber?.toLowerCase().includes(q) ||
        d.khesraNumber?.toLowerCase().includes(q) ||
        d.subRegistrarOffice?.toLowerCase().includes(q) ||
        d.farmers?.some((f) => f.name?.toLowerCase().includes(q))
      );
    });
  }, [allRegistryDeeds, deedSearch]);

  // Open Edit Agreement Modal
  const openEditAgreement = (agr) => {
    setEditAgrTarget(agr);
    const parcels = Array.isArray(agr.landParcels) && agr.landParcels.length > 0
      ? agr.landParcels.map((p) => ({
          _id: p._id,
          mauja: p.mauja || agr.mauja || '',
          thanaNumber: p.thanaNumber || agr.thanaNumber || '',
          khataNumber: p.khataNumber || agr.khataNumber || '',
          khesraNumber: p.khesraNumber || agr.khesraNumber || '',
          jamabandiNumber: p.jamabandiNumber || agr.jamabandiNumber || '',
          chaudhi: {
            north: p.chaudhi?.north || '',
            south: p.chaudhi?.south || '',
            east: p.chaudhi?.east || '',
            west: p.chaudhi?.west || '',
          },
          araziDismil: p.araziDismil !== undefined ? p.araziDismil : '',
          totalSqFt: p.totalSqFt || 0,
          ratePerDismil: p.ratePerDismil || agr.ratePerDismil || '',
          ratePerSqFt: p.ratePerSqFt || 0,
          totalAmount: p.totalAmount !== undefined ? p.totalAmount : '',
          remarks: p.remarks || '',
        }))
      : [
          {
            mauja: agr.mauja || '',
            thanaNumber: agr.thanaNumber || '',
            khataNumber: agr.khataNumber || '',
            khesraNumber: agr.khesraNumber || '',
            jamabandiNumber: agr.jamabandiNumber || '',
            chaudhi: { north: '', south: '', east: '', west: '' },
            araziDismil: agr.araziDismil !== undefined ? agr.araziDismil : '',
            totalSqFt: agr.totalSqFt || 0,
            ratePerDismil: agr.ratePerDismil || '',
            ratePerSqFt: agr.ratePerSqFt || 0,
            totalAmount: agr.totalAgreementAmount || '',
            remarks: '',
          },
        ];

    const attachments = Array.isArray(agr.attachments)
      ? agr.attachments.map((att) => ({
          fileName: att.fileName || '',
          fileType: att.fileType || 'Agreement Scan',
          fileUrl: att.fileUrl || '',
          fileSize: att.fileSize || 0,
          description: att.description || '',
        }))
      : [];

    setEditAgrForm({
      agreementNumber: agr.agreementNumber || '',
      agreementDate: agr.agreementDate ? new Date(agr.agreementDate).toISOString().split('T')[0] : '',
      agreementEndDate: agr.agreementEndDate ? new Date(agr.agreementEndDate).toISOString().split('T')[0] : '',
      remarks: agr.remarks || '',
      landParcels: parcels,
      farmers: Array.isArray(agr.farmers) && agr.farmers.length > 0
        ? agr.farmers.map((f) => ({
            name: f.name || '',
            guardianName: f.guardianName || '',
            relation: f.relation || 'Father',
            mobile: f.mobile || '',
            aadhaarNumber: f.aadhaarNumber || '',
            panNumber: f.panNumber || '',
            sharePercent: f.sharePercent !== undefined ? f.sharePercent : 100,
            address: f.address || '',
          }))
        : [
            {
              name: '',
              guardianName: '',
              relation: 'Father',
              mobile: '',
              aadhaarNumber: '',
              panNumber: '',
              sharePercent: 100,
              address: '',
            },
          ],
      purchasers: Array.isArray(agr.purchasers) && agr.purchasers.length > 0
        ? agr.purchasers.map((p) => ({
            name: p.name || '',
            contact: p.contact || p.mobile || '',
            mobile: p.mobile || p.contact || '',
            aadhaarNumber: p.aadhaarNumber || '',
            panNumber: p.panNumber || '',
            address: p.address || '',
          }))
        : [
            {
              name: '',
              contact: '',
              mobile: '',
              aadhaarNumber: '',
              panNumber: '',
              address: '',
            },
          ],
      attachments,
    });
    setEditAgrOpen(true);
  };

  // Save Agreement Edit
  const handleSaveAgreementEdit = async (e) => {
    e.preventDefault();
    if (!editAgrTarget) return;
    setEditAgrLoading(true);
    try {
      await api.put(`/plots/kisan-agreements/${editAgrTarget._id}`, editAgrForm);
      toast.success('Plot Purchase Agreement updated successfully!');
      setEditAgrOpen(false);
      fetchAgreements();
      if (selectedAgrId === editAgrTarget._id) {
        loadAgreementDetails(selectedAgrId, detailTab);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update agreement');
    } finally {
      setEditAgrLoading(false);
    }
  };

  // Delete Agreement
  const handleDeleteAgreement = async (agr) => {
    const proceed = await confirmDialog({
      title: `Delete Purchase Agreement #${agr.agreementNumber}?`,
      text: `This will permanently delete the agreement for Mauja ${agr.mauja} (Khata: ${agr.khataNumber}, Khesra: ${agr.khesraNumber}). This can only be done if no plot bookings or registry deeds are tied to it.`,
      confirmText: 'Delete Agreement',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;

    try {
      await api.delete(`/plots/kisan-agreements/${agr._id}`);
      toast.success(`Purchase Agreement #${agr.agreementNumber} deleted successfully`);
      if (selectedAgrId === agr._id) {
        setSelectedAgrId(null);
        setDetailData(null);
      }
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete purchase agreement');
    }
  };

  // Open Create Deed Modal
  const openCreateDeedModal = (agr) => {
    setTargetAgreementForDeed(agr);
    setDeedForm({
      deedNumber: agr?.agreementNumber ? `${agr.agreementNumber}/` : '',
      deedDate: new Date().toISOString().split('T')[0],
      subRegistrarOffice: '',
      registeredDismil: agr.unregisteredAgreedSqFt
        ? (Math.round((agr.unregisteredAgreedSqFt / 435.6) * 100) / 100).toString()
        : '',
      remarks: '',
    });
    setDeedModalOpen(true);
  };

  // Submit Create Registry Deed
  const handleSaveRegistryDeed = async (e, customPayload) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!targetAgreementForDeed) return;
    setDeedLoading(true);
    const dataToSend = customPayload || deedForm;
    try {
      await api.post(`/plots/kisan-agreements/${targetAgreementForDeed._id}/deeds`, dataToSend);
      toast.success('Registry Deed converted & added to land stock successfully!');
      setDeedModalOpen(false);
      fetchAgreements();
      if (selectedAgrId === targetAgreementForDeed._id) {
        loadAgreementDetails(selectedAgrId, 'deeds');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create registry deed');
    } finally {
      setDeedLoading(false);
    }
  };

  // Open Edit Deed Modal
  const openEditDeedModal = (agreementId, deed) => {
    const parentAgr = agreements.find((a) => String(a._id) === String(agreementId));
    setEditingDeedTarget({ agreementId, deed, parentAgreement: parentAgr });
    setEditDeedForm({
      deedNumber: deed.deedNumber || '',
      deedDate: deed.deedDate ? new Date(deed.deedDate).toISOString().split('T')[0] : '',
      subRegistrarOffice: deed.subRegistrarOffice || '',
      remarks: deed.remarks || '',
    });
    setEditDeedModalOpen(true);
  };

  // Save Edit Deed
  const handleSaveEditDeed = async (e, customPayload) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingDeedTarget) return;
    setEditDeedLoading(true);
    const dataToSend = customPayload || editDeedForm;
    try {
      await api.put(
        `/plots/kisan-agreements/${editingDeedTarget.agreementId}/deeds/${editingDeedTarget.deed._id}`,
        dataToSend
      );
      toast.success('Registry Deed updated successfully!');
      setEditDeedModalOpen(false);
      fetchAgreements();
      if (selectedAgrId === editingDeedTarget.agreementId) {
        loadAgreementDetails(selectedAgrId, 'deeds');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update registry deed');
    } finally {
      setEditDeedLoading(false);
    }
  };

  // Delete Registry Deed
  const handleDeleteDeed = async (agreementId, deed) => {
    const proceed = await confirmDialog({
      title: `Delete Registry Deed #${deed.deedNumber}?`,
      text: `This will remove the registry deed and revert ${deed.registeredSqFt} Sq.Ft. (${deed.registeredDismil} Dismil) back into the unregistered agreement land pool. Cannot be deleted if allocated to customer bookings.`,
      confirmText: 'Delete Deed',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;

    try {
      await api.delete(`/plots/kisan-agreements/${agreementId}/deeds/${deed._id}`);
      toast.success(`Registry Deed #${deed.deedNumber} deleted and stock restored.`);
      fetchAgreements();
      if (selectedAgrId === agreementId) {
        loadAgreementDetails(selectedAgrId, 'deeds');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete registry deed');
    }
  };

  // Open Payment to Kisan Modal
  const openPaymentModal = (agr) => {
    setTargetAgreementForPayment(agr);
    setPaymentForm({
      amount: '',
      paymentMode: 'BANK_TRANSFER',
      transactionReference: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setPaymentModalOpen(true);
  };

  // Submit Payment to Kisan
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!targetAgreementForPayment) return;
    setPaymentLoading(true);
    try {
      await api.post(`/plots/kisan-agreements/${targetAgreementForPayment._id}/payments`, paymentForm);
      toast.success('Payment recorded and Kisan ledger balance updated!');
      setPaymentModalOpen(false);
      fetchAgreements();
      if (selectedAgrId === targetAgreementForPayment._id) {
        loadAgreementDetails(selectedAgrId, 'kisan_ledger');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading && agreements.length === 0) {
    return (
      <PageLoader
        title="Loading Plot Purchase & Deeds..."
        subtitle="Connecting agreements, registry deeds, and farmer ledgers"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <Building2 size={22} />
            </span>
            Plot Purchase & Land Master
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Manage land & plot purchase agreements, farmer particulars, registry deeds, payment ledgers, and stock allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> New Plot Purchase
          </button>
        </div>
      </div>

      {/* ── METRIC SUMMARY CARDS ── */}
      <KisanSummaryMetrics
        total={total}
        agreements={agreements}
        allRegistryDeeds={allRegistryDeeds}
      />

      {/* ── TOP-LEVEL MAIN TABS ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setMainTab('agreements')}
          className={`pb-3 px-3.5 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            mainTab === 'agreements'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} />
          Plot Purchase Agreements ({agreements.length})
        </button>

        <button
          onClick={() => setMainTab('deeds')}
          className={`pb-3 px-3.5 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            mainTab === 'deeds'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} />
          Registry Deeds ({allRegistryDeeds.length})
        </button>

        <button
          onClick={() => setMainTab('sellers')}
          className={`pb-3 px-3.5 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            mainTab === 'sellers'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          Land Sellers Directory ({sellers.length})
        </button>

        <button
          onClick={() => setMainTab('purchasers')}
          className={`pb-3 px-3.5 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            mainTab === 'purchasers'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={16} />
          Purchasers / Buyers Master ({purchasers.length})
        </button>
      </div>

      {/* ── TAB 1: PLOT PURCHASE AGREEMENTS ── */}
      {mainTab === 'agreements' && (
        <KisanAgreementsTable
          agreements={agreements}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setPage={setPage}
          fetchAgreements={fetchAgreements}
          openCreateDeedModal={openCreateDeedModal}
          openPaymentModal={openPaymentModal}
          loadAgreementDetails={loadAgreementDetails}
          openEditAgreement={openEditAgreement}
          handleDeleteAgreement={handleDeleteAgreement}
        />
      )}

      {/* ── TAB 2: REGISTRY DEEDS MASTER / LEDGER ── */}
      {mainTab === 'deeds' && (
        <RegistryDeedsTable
          filteredDeeds={filteredDeeds}
          allRegistryDeeds={allRegistryDeeds}
          deedSearch={deedSearch}
          setDeedSearch={setDeedSearch}
          loadAgreementDetails={loadAgreementDetails}
          onViewDeed={(deed) => setViewDeedTarget(deed)}
          openEditDeedModal={openEditDeedModal}
          handleDeleteDeed={handleDeleteDeed}
        />
      )}

      {/* ── TAB 3: KISAN / SELLERS DIRECTORY MASTER ── */}
      {mainTab === 'sellers' && (
        <KisanSellersTable
          sellers={sellers}
          loading={sellersLoading}
          fetchSellers={fetchSellers}
        />
      )}

      {/* ── TAB 4: PURCHASERS / BUYERS MASTER DIRECTORY ── */}
      {mainTab === 'purchasers' && (
        <PurchasersTable
          purchasers={purchasers}
          loading={purchasersLoading}
          fetchPurchasers={fetchPurchasers}
        />
      )}

      {/* ── MODALS ── */}
      <CreateAgreementModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createLoading={createLoading}
        setCreateLoading={setCreateLoading}
        fetchAgreements={fetchAgreements}
        sellers={sellers}
        purchasers={purchasers}
        fetchSellers={fetchSellers}
        fetchPurchasers={fetchPurchasers}
      />

      <EditAgreementModal
        open={editAgrOpen}
        onClose={() => setEditAgrOpen(false)}
        editAgrTarget={editAgrTarget}
        editAgrForm={editAgrForm}
        setEditAgrForm={setEditAgrForm}
        editAgrLoading={editAgrLoading}
        handleSaveAgreementEdit={handleSaveAgreementEdit}
        sellers={sellers}
        purchasers={purchasers}
        fetchSellers={fetchSellers}
        fetchPurchasers={fetchPurchasers}
      />

      <CreateDeedModal
        open={deedModalOpen}
        onClose={() => setDeedModalOpen(false)}
        targetAgreementForDeed={targetAgreementForDeed}
        deedForm={deedForm}
        setDeedForm={setDeedForm}
        deedLoading={deedLoading}
        handleSaveRegistryDeed={handleSaveRegistryDeed}
      />

      <EditDeedModal
        open={editDeedModalOpen}
        onClose={() => setEditDeedModalOpen(false)}
        editingDeedTarget={editingDeedTarget}
        editDeedForm={editDeedForm}
        setEditDeedForm={setEditDeedForm}
        editDeedLoading={editDeedLoading}
        handleSaveEditDeed={handleSaveEditDeed}
      />

      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        targetAgreementForPayment={targetAgreementForPayment}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        paymentLoading={paymentLoading}
        handleSavePayment={handleSavePayment}
      />

      <KisanLedgersDrawer
        open={Boolean(selectedAgrId && detailData)}
        onClose={() => setSelectedAgrId(null)}
        detailData={detailData}
      />

      <ViewDeedModal
        open={Boolean(viewDeedTarget)}
        onClose={() => setViewDeedTarget(null)}
        deed={viewDeedTarget}
      />
    </div>
  );
};

export default PlotPurchasePage;
