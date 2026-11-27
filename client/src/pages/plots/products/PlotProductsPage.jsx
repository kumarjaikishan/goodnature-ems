import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PageLoader from '../../../components/common/PageLoader';

// Subcomponents
import ProductCatalogTab from './components/ProductCatalogTab';

const PlotProductsPage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prdRes, projRes] = await Promise.all([
        api.get('/plots/products'),
        api.get('/plots/projects').catch(() => ({ data: { data: [] } })),
      ]);

      setProducts(prdRes.data?.data || []);
      setProjects(projRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load plot products data:', err);
      toast.error('Failed to load plot products data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRefresh = async () => {
    try {
      const [prdRes, projRes] = await Promise.all([
        api.get('/plots/products'),
        api.get('/plots/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setProducts(prdRes.data?.data || []);
      setProjects(projRes.data?.data || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <PageLoader title="Loading Plot Products..." subtitle="Fetching micro-plot product master and dimension rules" />
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
            Configure micro-plot piece products with North/South/East/West dimensions and unit pricing.
          </p>
        </div>
      </div>

      {/* Product Master & Dimensions */}
      <ProductCatalogTab
        products={products}
        projects={projects}
        loading={loading}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default PlotProductsPage;
