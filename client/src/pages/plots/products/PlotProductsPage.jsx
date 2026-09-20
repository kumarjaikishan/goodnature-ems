import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Layers, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PageLoader from '../../../components/common/PageLoader';

// Subcomponents
import ProductCatalogTab from './components/ProductCatalogTab';
import ProductSalesTab from './components/ProductSalesTab';
import ProductSchemeRulesTab from './components/ProductSchemeRulesTab';
import ProductBookingCertificateModal from './components/ProductBookingCertificateModal';
import ProductCustomerLedgerModal from './components/ProductCustomerLedgerModal';
import { SlidersHorizontal } from 'lucide-react';

const PlotProductsPage = () => {
  const navigate = useNavigate();

  // Active Tab: 'catalog' (Product Master) vs 'sales' (Sales & Bookings) vs 'schemes' (Scheme Rules & Returns)
  const [activeTab, setActiveTab] = useState('catalog');


  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tenures, setTenures] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Modals state
  const [selectedCertificateBooking, setSelectedCertificateBooking] = useState(null);
  const [selectedLedgerBooking, setSelectedLedgerBooking] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prdRes, custRes, tenureRes, bkRes] = await Promise.all([
        api.get('/plots/products'),
        api.get('/plots/customers'),
        api.get('/plots/products/tenures'),
        api.get('/plots/product-bookings'),
      ]);

      setProducts(prdRes.data?.data || []);
      setCustomers(custRes.data?.data?.customers || custRes.data?.data || []);
      setTenures(tenureRes.data?.data || []);
      setBookings(bkRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load plot products data:', err);
      toast.error('Failed to load plot products & sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRefresh = async () => {
    try {
      const [prdRes, bkRes] = await Promise.all([
        api.get('/plots/products'),
        api.get('/plots/product-bookings'),
      ]);
      setProducts(prdRes.data?.data || []);
      setBookings(bkRes.data?.data || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <PageLoader title="Loading Plot Products &amp; Sales..." subtitle="Fetching micro-plot product master, tenure periods, and customer sales" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <Package size={22} />
            </span>
            Plot Products &amp; Fractional Unit Master
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Configure micro-plot piece products with North/South/East/West dimensions, unit pricing, and customer maturity returns for EMI (R.D.) &amp; Full Payment (F.D.).
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={16} /> Product Master &amp; Dimensions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sales'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart size={16} /> Product Sales &amp; Bookings
          {bookings.length > 0 && (
            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full ml-1">
              {bookings.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schemes')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'schemes'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal size={16} /> Scheme Rules &amp; Returns Matrix
        </button>
      </div>


      {/* Tab Contents */}
      {activeTab === 'catalog' ? (
        <ProductCatalogTab
          products={products}
          loading={loading}
          onRefresh={handleRefresh}
        />
      ) : activeTab === 'sales' ? (
        <ProductSalesTab
          products={products}
          customers={customers}
          tenures={tenures}
          bookings={bookings}
          loading={loading}
          onRefresh={handleRefresh}
          onOpenCertificate={(b) => setSelectedCertificateBooking(b)}
          onOpenLedger={(b) => setSelectedLedgerBooking(b)}
          onOpenCollect={(b) => navigate(`/dashboard/plots/collections/products/add?bookingId=${b._id}`)}
        />
      ) : (
        <ProductSchemeRulesTab
          onSchemeUpdated={fetchInitialData}
        />
      )}


      {/* ── MODALS ── */}
      {/* 1. Booking Certificate Modal */}
      {selectedCertificateBooking && (
        <ProductBookingCertificateModal
          open={!!selectedCertificateBooking}
          onClose={() => setSelectedCertificateBooking(null)}
          booking={selectedCertificateBooking}
        />
      )}

      {/* 2. Customer Ledger Modal */}
      {selectedLedgerBooking && (
        <ProductCustomerLedgerModal
          open={!!selectedLedgerBooking}
          onClose={() => setSelectedLedgerBooking(null)}
          booking={selectedLedgerBooking}
          onTakeCollection={() => {
            setSelectedLedgerBooking(null);
            navigate(`/dashboard/plots/collections/products/add?bookingId=${selectedLedgerBooking._id}`);
          }}
        />
      )}
    </div>
  );
};

export default PlotProductsPage;
