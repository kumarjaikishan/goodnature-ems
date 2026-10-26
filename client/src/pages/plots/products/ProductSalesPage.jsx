import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PageLoader from '../../../components/common/PageLoader';
import ProductSalesTab from './components/ProductSalesTab';
import ProductCustomerLedgerModal from './components/ProductCustomerLedgerModal';

const ProductSalesPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tenures, setTenures] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Modals state
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
      console.error('Failed to load product sales data:', err);
      toast.error('Failed to load product sales data');
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
      console.error('Failed to refresh sales data:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <PageLoader title="Loading Product Sales..." subtitle="Fetching product bookings, customer details, and agreements" />
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
              <ShoppingCart size={22} />
            </span>
            Plot Product Sales &amp; Bookings
            {bookings.length > 0 && (
              <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                {bookings.length}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Manage customer product unit bookings, agreements, collection receipts, and cancellation settlements.
          </p>
        </div>
      </div>

      {/* Main Product Sales Content */}
      <ProductSalesTab
        products={products}
        customers={customers}
        tenures={tenures}
        bookings={bookings}
        loading={loading}
        onRefresh={handleRefresh}
        onOpenCertificate={(b) => navigate(`/dashboard/plots/certificates/${b._id}`)}
        onOpenLedger={(b) => setSelectedLedgerBooking(b)}
        onOpenCollect={(b) => navigate(`/dashboard/plots/collections/products/add?bookingId=${b._id}`)}
      />

      {/* Customer Ledger Modal */}
      {selectedLedgerBooking && (
        <ProductCustomerLedgerModal
          open={!!selectedLedgerBooking}
          onClose={() => setSelectedLedgerBooking(null)}
          booking={selectedLedgerBooking}
          onRefresh={handleRefresh}
          onTakeCollection={() => {
            setSelectedLedgerBooking(null);
            navigate(`/dashboard/plots/collections/products/add?bookingId=${selectedLedgerBooking._id}`);
          }}
        />
      )}
    </div>
  );
};

export default ProductSalesPage;
