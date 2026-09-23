import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  MapPin,
  RefreshCw,
  Star,
  CheckCircle2,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { PhoneInput, AadhaarInput, PanInput } from '../../../../components/ui';
import { confirmDialog } from '../../../../utils/confirmDialog';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';

const PurchasersTable = ({
  purchasers = [],
  loading = false,
  fetchPurchasers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchaser, setEditingPurchaser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    contact: '',
    mobile: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    isDefault: false,
    remarks: '',
  };

  const [form, setForm] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingPurchaser(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPurchaser(p);
    setForm({
      name: p.name || '',
      contact: p.contact || '',
      mobile: p.mobile || '',
      aadhaarNumber: p.aadhaarNumber || '',
      panNumber: p.panNumber || '',
      address: p.address || '',
      isDefault: Boolean(p.isDefault),
      remarks: p.remarks || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Purchaser / Buyer name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingPurchaser) {
        await api.put(`/plots/purchasers/${editingPurchaser._id}`, form);
        toast.success('Purchaser / Buyer updated successfully');
      } else {
        await api.post('/plots/purchasers', form);
        toast.success('Purchaser / Buyer added successfully');
      }
      setModalOpen(false);
      if (fetchPurchasers) fetchPurchasers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Purchaser / Buyer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (p) => {
    try {
      await api.put(`/plots/purchasers/${p._id}/set-default`);
      toast.success(`${p.name} is now the default buyer for plot purchase agreements`);
      if (fetchPurchasers) fetchPurchasers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set default purchaser');
    }
  };

  const handleDelete = async (p) => {
    const ok = await confirmDialog({
      title: 'Delete Purchaser / Buyer?',
      text: `Are you sure you want to delete ${p.name}?`,
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/plots/purchasers/${p._id}`);
      toast.success('Purchaser / Buyer deleted successfully');
      if (fetchPurchasers) fetchPurchasers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete Purchaser / Buyer');
    }
  };

  const filtered = purchasers.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.contact || '').toLowerCase().includes(term) ||
      (p.mobile || '').toLowerCase().includes(term) ||
      (p.aadhaarNumber || '').toLowerCase().includes(term) ||
      (p.panNumber || '').toLowerCase().includes(term) ||
      (p.address || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Purchasers by Name, Contact, Mobile, Aadhaar..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPurchasers}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Purchaser / Buyer</span>
          </button>
        </div>
      </div>

      {/* Purchasers Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="animate-spin mx-auto mb-2 text-teal-600" size={24} />
            Loading Purchasers / Buyers master...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Building2 className="mx-auto text-slate-300" size={40} />
            <p className="text-xs font-semibold text-slate-600">No Purchasers / Buyers found</p>
            <p className="text-[11px] text-slate-400">
              Add company entities or individual buyers to default them in Plot Purchase agreements.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200/60 hover:bg-teal-100 transition cursor-pointer"
            >
              <Plus size={13} />
              <span>Add New Purchaser</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">#</th>
                  <th className="p-3.5">Purchaser / Entity Name</th>
                  <th className="p-3.5">Contact / Branch</th>
                  <th className="p-3.5">Mobile Number</th>
                  <th className="p-3.5">Aadhaar & PAN</th>
                  <th className="p-3.5">Default Status</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 size={14} className="text-teal-700 shrink-0" />
                        <span>{p.name}</span>
                      </div>
                      {p.address && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 max-w-xs truncate" title={p.address}>
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{p.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      {p.contact || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-3.5">
                      {p.mobile ? (
                        <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                          <Phone size={12} className="text-emerald-600" />
                          <span>{p.mobile}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        {p.aadhaarNumber && (
                          <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                            <CreditCard size={11} className="text-teal-600" />
                            <span>{p.aadhaarNumber}</span>
                          </div>
                        )}
                        {p.panNumber && (
                          <div className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                            PAN: {p.panNumber}
                          </div>
                        )}
                        {!p.aadhaarNumber && !p.panNumber && (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {p.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full font-bold text-[10px]">
                          <Star size={12} className="fill-amber-500 text-amber-500" />
                          <span>Default Buyer</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(p)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-amber-700 hover:bg-amber-50 px-2 py-0.5 rounded-lg border border-transparent hover:border-amber-200 transition cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="Edit Purchaser"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Purchaser"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modalbox
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        outside={false}
        maxWidth="max-w-xl"
        showClose={false}
      >
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPurchaser ? 'Edit Purchaser / Buyer' : 'Add New Purchaser / Buyer'}
                </h3>
                <p className="text-xs text-slate-500">
                  Company or individual buyer entity for Plot Purchase agreements.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Purchaser / Entity Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Purchaser / Entity Full Name"
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-xl px-3 text-xs font-bold text-slate-800 outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contact Person / Branch (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Contact Person / Designation"
                  className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Number (Optional)
                </label>
                <PhoneInput
                  placeholder="Mobile Number"
                  className="h-9 text-xs font-medium"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aadhaar Number (Optional)
                </label>
                <AadhaarInput
                  placeholder="12 digit Aadhaar No."
                  className="h-9 text-xs font-medium"
                  value={form.aadhaarNumber}
                  onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PAN Card (Optional)
                </label>
                <PanInput
                  placeholder="10 character PAN No."
                  className="h-9 text-xs"
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Office / Registered Address
              </label>
              <input
                type="text"
                placeholder="Office / Registered Address"
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            {/* Default toggle */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span>Set as Default Buyer</span>
                </div>
                <p className="text-[10px] text-amber-700">
                  When enabled, this purchaser will be automatically selected when creating new Plot Purchase agreements.
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 text-amber-600 focus:ring-amber-500 rounded border-amber-300 cursor-pointer"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingPurchaser ? 'Update Purchaser' : 'Save Purchaser'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default PurchasersTable;
