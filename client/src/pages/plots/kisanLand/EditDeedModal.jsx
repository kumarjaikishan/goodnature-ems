import React from 'react';
import { Edit3 } from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';

const EditDeedModal = ({
  open,
  onClose,
  editingDeedTarget,
  editDeedForm,
  setEditDeedForm,
  editDeedLoading,
  handleSaveEditDeed,
}) => {
  return (
    <Modalbox open={open} onClose={onClose} outside={true}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-purple-900 flex items-center gap-2">
            <Edit3 size={18} className="text-purple-700" />
            Edit Registry Deed #{editingDeedTarget?.deed?.deedNumber}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-base">
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveEditDeed} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registry Deed Number *</label>
            <input
              type="text"
              required
              className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3.5 rounded-xl text-xs font-bold uppercase"
              value={editDeedForm.deedNumber}
              onChange={(e) => setEditDeedForm({ ...editDeedForm, deedNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deed Date *</label>
            <input
              type="date"
              required
              className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3.5 rounded-xl text-xs font-medium"
              value={editDeedForm.deedDate}
              onChange={(e) => setEditDeedForm({ ...editDeedForm, deedDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Registrar Office (SRO)</label>
            <input
              type="text"
              className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3.5 rounded-xl text-xs font-medium"
              value={editDeedForm.subRegistrarOffice}
              onChange={(e) => setEditDeedForm({ ...editDeedForm, subRegistrarOffice: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3.5 rounded-xl text-xs font-medium"
              value={editDeedForm.remarks}
              onChange={(e) => setEditDeedForm({ ...editDeedForm, remarks: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editDeedLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer"
            >
              {editDeedLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default EditDeedModal;
