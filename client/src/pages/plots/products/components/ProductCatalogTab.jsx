import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Layers, Box, CheckCircle2, ShieldCheck, Ruler, DollarSign, Package } from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { toast } from '../../../../utils/toast';
import { confirmDialog } from '../../../../utils/confirmDialog';
import api from '../../../../api/axios';

const ProductCatalogTab = ({ products, loading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    productName: '',
    category: 'MICRO_PLOT',
    north: 1,
    south: 1,
    east: 2,
    west: 2,
    unit: 'feet',
    areaSqFt: 2,
    unitPrice: 5000,
    totalUnitsAvailable: 1000,
    description: '',
    status: 'ACTIVE',
  };

  const [form, setForm] = useState(initialForm);

  // Recalculate area whenever dimensions change
  const handleDimensionChange = (field, val) => {
    const num = Number(val) || 0;
    const updated = { ...form, [field]: num };
    const avgLen = (Number(field === 'north' ? num : form.north) + Number(field === 'south' ? num : form.south)) / 2 || 1;
    const avgWidth = (Number(field === 'east' ? num : form.east) + Number(field === 'west' ? num : form.west)) / 2 || 2;
    updated.areaSqFt = Math.round(avgLen * avgWidth * 100) / 100;
    setForm(updated);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      productName: product.productName || '',
      category: product.category || 'MICRO_PLOT',
      north: product.dimensions?.north ?? 1,
      south: product.dimensions?.south ?? 1,
      east: product.dimensions?.east ?? 2,
      west: product.dimensions?.west ?? 2,
      unit: product.dimensions?.unit || 'feet',
      areaSqFt: product.areaSqFt || 2,
      unitPrice: product.unitPrice || 5000,
      totalUnitsAvailable: product.totalUnitsAvailable || 1000,
      description: product.description || '',
      status: product.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (Number(form.unitPrice) <= 0) {
      toast.error('Unit price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/plots/products/${editingProduct._id}`, form);
        toast.success('Plot product updated successfully');
      } else {
        await api.post('/plots/products', form);
        toast.success('Plot product created successfully');
      }
      setShowModal(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const proceed = await confirmDialog({
      title: `Delete Product ${product.productName}?`,
      text: `Are you sure you want to delete product "${product.productName}" (${product.productCode})? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;

    try {
      await api.delete(`/plots/products/${product._id}`);
      toast.success('Product deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.productName?.toLowerCase().includes(q) ||
      p.productCode?.toLowerCase().includes(q) ||
      p.dimensionLabel?.toLowerCase().includes(q)
    );
  });

  const totalStock = products.reduce((sum, p) => sum + Number(p.totalUnitsAvailable || 0), 0);
  const totalSold = products.reduce((sum, p) => sum + Number(p.unitsSold || 0), 0);
  const totalValuation = products.reduce((sum, p) => sum + (Number(p.unitPrice || 0) * Number(p.totalUnitsAvailable || 0)), 0);

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Product Models</span>
            <Package size={16} className="text-teal-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{products.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Active catalog units</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Available Stock</span>
            <Box size={16} className="text-teal-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalStock.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Units in inventory</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Units Sold</span>
            <CheckCircle2 size={16} className="text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{totalSold.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Subscribed / Booked</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Catalog Valuation</span>
            <DollarSign size={16} className="text-teal-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalValuation.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Base inventory value</div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product name, code, or dimensions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={15} /> Create Plot Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <Package size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No plot products found.</p>
            <p className="text-xs">Click "Create Plot Product" above to define micro-plot fractional units with custom dimensions and unit rates.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const d = p.dimensions || {};
            const availableUnits = Math.max(0, (p.totalUnitsAvailable || 0) - (p.unitsSold || 0));

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                        {p.productCode}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1 group-hover:text-teal-800 transition">
                        {p.productName}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{p.description || 'Standard micro-unit plot product'}</p>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status || 'ACTIVE'}
                    </span>
                  </div>

                  {/* Dimensions Box */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200 pb-1.5">
                      <span className="flex items-center gap-1.5 text-teal-800">
                        <Ruler size={13} /> Dimensions (4-Sides)
                      </span>
                      <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {p.areaSqFt} Sq.Ft
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">North:</span>
                        <strong className="text-slate-800 font-mono">{d.north ?? 1} ft</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">South:</span>
                        <strong className="text-slate-800 font-mono">{d.south ?? 1} ft</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">East:</span>
                        <strong className="text-slate-800 font-mono">{d.east ?? 2} ft</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">West:</span>
                        <strong className="text-slate-800 font-mono">{d.west ?? 2} ft</strong>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Pricing */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/80">
                      <span className="text-[10px] uppercase font-bold text-teal-700 block">Unit Base Price</span>
                      <span className="text-base font-black text-teal-950 font-mono">
                        ₹{Number(p.unitPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Units Available</span>
                      <span className="text-sm font-bold text-slate-800">
                        {availableUnits.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">/ {p.totalUnitsAvailable}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200/60 cursor-pointer"
                    title="Edit Product & Dimensions"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200/60 cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Product Modal */}
      <Modalbox open={showModal} onClose={() => setShowModal(false)} size="lg">
        <div className="p-5 md:p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                <Package size={18} />
              </span>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                {editingProduct ? `Edit Product — ${editingProduct.productCode}` : 'Create New Plot Product'}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  placeholder="e.g. 1x2 Micro Plot Unit"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Tag</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. MICRO_PLOT"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>
            </div>

            {/* Editable Dimensions Grid (North, South, East, West) */}
            <div className="bg-teal-50/40 p-4 rounded-2xl border border-teal-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Ruler size={14} /> 4-Side Piece Dimensions &amp; Calculated Area
                </span>
                <span className="text-[11px] font-bold text-teal-800 font-mono bg-white px-2 py-0.5 rounded border border-teal-200">
                  Area: {form.areaSqFt} Sq.Ft
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">North (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.north}
                    onChange={(e) => handleDimensionChange('north', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold font-mono text-teal-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">South (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.south}
                    onChange={(e) => handleDimensionChange('south', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold font-mono text-teal-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">East (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.east}
                    onChange={(e) => handleDimensionChange('east', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold font-mono text-teal-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">West (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.west}
                    onChange={(e) => handleDimensionChange('west', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold font-mono text-teal-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unit Base Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                    placeholder="5000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Available Units (Stock)</label>
                <input
                  type="number"
                  min="1"
                  value={form.totalUnitsAvailable}
                  onChange={(e) => setForm({ ...form, totalUnitsAvailable: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Notes (Optional)</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add any promotional or fractional specifications..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default ProductCatalogTab;
