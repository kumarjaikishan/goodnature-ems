import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import KisanSellersTable from './components/KisanSellersTable';

const LandSellersMasterPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plots/kisan-sellers');
      const list = res.data?.data || res.data || [];
      setSellers(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load Land Sellers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto pb-24">
      {/* ── LAND SELLERS DIRECTORY & MANAGEMENT ── */}
      <KisanSellersTable
        sellers={sellers}
        loading={loading}
        fetchSellers={fetchSellers}
      />
    </div>
  );
};

export default LandSellersMasterPage;
