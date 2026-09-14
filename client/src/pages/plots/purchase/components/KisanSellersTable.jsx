import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  MapPin,
  RefreshCw,
  Building,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { PhoneInput, AadhaarInput, PanInput } from '../../../../components/ui';
import { confirmDialog } from '../../../../utils/confirmDialog';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';

const KisanSellersTable = ({
  sellers = [],
  loading = false,
  fetchSellers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    guardianName: '',
    relation: 'Father',
    mobile: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
    },
    remarks: '',
  };

  const [form, setForm] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingSeller(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (seller) => {
    setEditingSeller(seller);
    setForm({
      name: seller.name || '',
      guardianName: seller.guardianName || '',
      relation: seller.relation || 'Father',
      mobile: seller.mobile || '',
      aadhaarNumber: seller.aadhaarNumber || '',
      panNumber: seller.panNumber || '',
      address: seller.address || '',
      bankDetails: seller.bankDetails || {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: '',
      },
      remarks: seller.remarks || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Farmer / Seller name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSeller) {
        await api.put(`/plots/kisan-sellers/${editingSeller._id}`, form);
        toast.success('Kisan / Seller updated successfully');
      } else {
        await api.post('/plots/kisan-sellers', form);
        toast.success('Kisan / Seller added successfully');
      }
      setModalOpen(false);
      if (fetchSellers) fetchSellers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Kisan / Seller');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (seller) => {
    const ok = await confirmDialog({
      title: 'Delete Land Seller?',
      text: `Are you sure you want to delete ${seller.name}? This action cannot be undone.`,
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/plots/kisan-sellers/${seller._id}`);
      toast.success('Land Seller deleted successfully');
      if (fetchSellers) fetchSellers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete Land Seller');
    }
  };

  const filtered = sellers.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.mobile || '').toLowerCase().includes(term) ||
      (s.aadhaarNumber || '').toLowerCase().includes(term) ||
      (s.panNumber || '').toLowerCase().includes(term) ||
      (s.guardianName || '').toLowerCase().includes(term) ||
      (s.address || '').toLowerCase().includes(term)
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
            placeholder="Search Land Seller by Name, Mobile, Aadhaar, PAN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSellers}
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
            <span>+ Add Land Seller</span>
          </button>
        </div>
      </div>

      {/* Land Sellers Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="animate-spin mx-auto mb-2 text-teal-600" size={24} />
            Loading Land Sellers directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="mx-auto text-slate-300" size={40} />
            <p className="text-xs font-semibold text-slate-600">No Land Sellers found</p>
            <p className="text-[11px] text-slate-400">
              Add your first Land Seller to easily select them during plot purchase agreements.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200/60 hover:bg-teal-100 transition cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Land Seller</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">#</th>
                  <th className="p-3.5">Land Seller Info</th>
                  <th className="p-3.5">Guardian / Father</th>
                  <th className="p-3.5">Contact / Mobile</th>
                  <th className="p-3.5">Aadhaar & PAN</th>
                  <th className="p-3.5">Village / Address</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((seller, idx) => (
                  <tr key={seller._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Users size={14} className="text-teal-700 shrink-0" />
                        <span>{seller.name}</span>
                      </div>
                      {seller.bankDetails?.accountNumber && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building size={11} />
                          <span>{seller.bankDetails.bankName || 'Bank'}: {seller.bankDetails.accountNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      {seller.guardianName ? (
                        <span>
                          {seller.guardianName}{' '}
                          <span className="text-[10px] text-slate-400">({seller.relation || 'Father'})</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {seller.mobile ? (
                        <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                          <Phone size={12} className="text-emerald-600" />
                          <span>{seller.mobile}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        {seller.aadhaarNumber && (
                          <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                            <CreditCard size={11} className="text-teal-600" />
                            <span>{seller.aadhaarNumber}</span>
                          </div>
                        )}
                        {seller.panNumber && (
                          <div className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                            PAN: {seller.panNumber}
                          </div>
                        )}
                        {!seller.aadhaarNumber && !seller.panNumber && (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {seller.address ? (
                        <div className="flex items-center gap-1 text-slate-600 max-w-xs truncate" title={seller.address}>
                          <MapPin size={12} className="text-rose-500 shrink-0" />
                          <span className="truncate">{seller.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(seller)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="Edit Kisan"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(seller)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Kisan"
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
        maxWidth="max-w-2xl"
        showClose={false}
      >
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSeller ? 'Edit Land Seller Details' : 'Add New Land Seller'}
                </h3>
                <p className="text-xs text-slate-500">
                  Master directory profile for quick selection in Plot Purchase agreements.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seller Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Seller Full Name"
                  className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-xl px-3 text-xs font-bold text-slate-800 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Guardian / Father Name</label>
                <input
                  type="text"
                  placeholder="Guardian / Father Name"
                  className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none"
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number</label>
                <PhoneInput
                  placeholder="Mobile Number"
                  className="h-9 text-xs font-medium"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Aadhaar Number</label>
                <AadhaarInput
                  placeholder="12 digit Aadhaar No."
                  className="h-9 text-xs font-medium"
                  value={form.aadhaarNumber}
                  onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">PAN Card</label>
                <PanInput
                  placeholder="10 character PAN No."
                  className="h-9 text-xs"
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Village / Full Address</label>
              <input
                type="text"
                placeholder="Village / Full Address"
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            {/* Bank Details Collapsible/Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Building size={14} className="text-teal-700" />
                <span>Bank Account Details (Optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. SBI, PNB)"
                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-medium outline-none"
                    value={form.bankDetails?.bankName || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bankDetails: { ...form.bankDetails, bankName: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Number</label>
                  <input
                    type="text"
                    placeholder="Account Number"
                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-mono outline-none"
                    value={form.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bankDetails: { ...form.bankDetails, accountNumber: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-mono uppercase outline-none"
                    value={form.bankDetails?.ifscCode || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bankDetails: { ...form.bankDetails, ifscCode: e.target.value.toUpperCase() },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Branch</label>
                  <input
                    type="text"
                    placeholder="Branch Location"
                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-medium outline-none"
                    value={form.bankDetails?.branch || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bankDetails: { ...form.bankDetails, branch: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
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
                {submitting ? 'Saving...' : editingSeller ? 'Update Kisan / Seller' : 'Save Kisan / Seller'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default KisanSellersTable;
