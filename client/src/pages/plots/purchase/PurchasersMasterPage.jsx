import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PurchasersTable from './components/PurchasersTable';

const PurchasersMasterPage = () => {
  const [purchasers, setPurchasers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchasers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plots/purchasers');
      const list = res.data?.data || res.data || [];
      setPurchasers(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load Purchasers / Buyers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasers();
  }, []);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto pb-24">
      {/* ── PURCHASERS DIRECTORY & MANAGEMENT ── */}
      <PurchasersTable
        purchasers={purchasers}
        loading={loading}
        fetchPurchasers={fetchPurchasers}
      />
    </div>
  );
};

export default PurchasersMasterPage;
