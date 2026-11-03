import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
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
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <Building2 size={22} />
            </span>
            Purchasers / Buyers Master
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Manage company purchasers and authorized deed buyers used in Plot Purchase agreements &amp; registry deeds.
          </p>
        </div>
      </div>

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
