import React, { useEffect, useState } from 'react';
import { Edit3, CheckCircle2 } from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { toast } from '../../../../utils/toast';

const EditDeedModal = ({
  open,
  onClose,
  editingDeedTarget,
  editDeedForm,
  setEditDeedForm,
  editDeedLoading,
  handleSaveEditDeed,
}) => {
  const deed = editingDeedTarget?.deed;
  const parentAgreement = editingDeedTarget?.parentAgreement;
  const parentAgreementNumber = parentAgreement?.agreementNumber || deed?.parentAgreementNumber || '';

  const [parcelRows, setParcelRows] = useState([]);

  useEffect(() => {
    if (!open || !editingDeedTarget) {
      setParcelRows([]);
      return;
    }

    const agrParcels = Array.isArray(parentAgreement?.landParcels) && parentAgreement.landParcels.length > 0
      ? parentAgreement.landParcels
      : [
          {
            _id: parentAgreement?._id || deed?._id,
            mauja: parentAgreement?.mauja || deed?.mauja || '',
            khataNumber: parentAgreement?.khataNumber || deed?.khataNumber || '',
            khesraNumber: parentAgreement?.khesraNumber || deed?.khesraNumber || '',
            thanaNumber: parentAgreement?.thanaNumber || deed?.thanaNumber || '',
            araziDismil: parentAgreement?.araziDismil || deed?.registeredDismil || 0,
            registeredDismil: parentAgreement?.totalRegisteredDismil || deed?.registeredDismil || 0,
          },
        ];

    const deedParcelsMap = new Map();
    if (Array.isArray(deed?.parcels)) {
      deed.parcels.forEach((dp) => {
        deedParcelsMap.set(String(dp.parcelId), Number(dp.registeredDismil) || 0);
      });
    }

    const rows = agrParcels.map((p) => {
      const thisDeedDismil = deedParcelsMap.has(String(p._id))
        ? deedParcelsMap.get(String(p._id))
        : deed?.registeredDismil || 0;

      const totalParcelArazi = Number(p.araziDismil) || 0;
      const totalParcelReg = Number(p.registeredDismil) || 0;
      const otherDeedsReg = Math.max(0, Math.round((totalParcelReg - thisDeedDismil) * 1000) / 1000);
      const maxAllowed = Math.max(0, Math.round((totalParcelArazi - otherDeedsReg) * 1000) / 1000);

      return {
        parcelId: p._id,
        mauja: p.mauja,
        khataNumber: p.khataNumber,
        khesraNumber: p.khesraNumber,
        thanaNumber: p.thanaNumber,
        araziDismil: totalParcelArazi,
        otherDeedsReg,
        maxAllowed,
        registeredDismil: thisDeedDismil > 0 ? thisDeedDismil.toString() : '0',
      };
    });

    setParcelRows(rows);
  }, [open, editingDeedTarget, parentAgreement, deed]);

  const handleDismilChange = (idx, val) => {
    const updated = [...parcelRows];
    updated[idx].registeredDismil = val;
    setParcelRows(updated);
  };

  const totalRegisteredDismil = Math.round(
    parcelRows.reduce((sum, r) => sum + (Number(r.registeredDismil) || 0), 0) * 1000
  ) / 1000;
  const totalRegisteredSqFt = Math.round(totalRegisteredDismil * 435.6 * 100) / 100;

  const onSubmit = (e) => {
    e.preventDefault();
    if (totalRegisteredDismil <= 0) {
      toast.error('Registered Dismil must be greater than 0');
      return;
    }

    for (const r of parcelRows) {
      const val = Number(r.registeredDismil) || 0;
      if (val > r.maxAllowed + 0.001) {
        toast.error(
          `Cannot register ${val} Dismil for Mauja ${r.mauja} (Khesra: ${r.khesraNumber}). Max available is ${r.maxAllowed} Dismil.`
        );
        return;
      }
    }

    const payload = {
      ...editDeedForm,
      registeredDismil: totalRegisteredDismil,
      registeredSqFt: totalRegisteredSqFt,
      parcels: parcelRows.map((r) => ({
        parcelId: r.parcelId,
        registeredDismil: Number(r.registeredDismil) || 0,
      })),
    };

    setEditDeedForm(payload);
    handleSaveEditDeed(e, payload);
  };

  return (
    <Modalbox open={open} onClose={onClose} outside={false} maxWidth="max-w-3xl" showClose={false}>
      <div className="p-4 sm:p-6 w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200/60">
              <Edit3 size={22} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-purple-950">
                Edit Registry Deed #{deed?.deedNumber}
              </h3>
              {parentAgreementNumber && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Parent Agreement: <strong className="text-teal-800 font-bold">#{parentAgreementNumber}</strong>
                  {parentAgreement?.araziDismil ? ` • Total Agreement: ${parentAgreement.araziDismil} Dismil` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Top Deed Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Registry Deed Number *
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600">
                {parentAgreementNumber && (
                  <span className="bg-purple-100 text-purple-900 font-mono font-bold text-xs px-2.5 py-2 border-r border-purple-200 select-none shrink-0">
                    {parentAgreementNumber}/
                  </span>
                )}
                <input
                  type="text"
                  required
                  placeholder="DEED001"
                  className="h-9 w-full bg-transparent outline-none px-2.5 text-xs font-bold uppercase text-purple-900 placeholder:text-slate-400 placeholder:font-normal"
                  value={
                    parentAgreementNumber && (editDeedForm.deedNumber || '').startsWith(`${parentAgreementNumber}/`)
                      ? (editDeedForm.deedNumber || '').slice(`${parentAgreementNumber}/`.length)
                      : editDeedForm.deedNumber || ''
                  }
                  onChange={(e) => {
                    const typed = e.target.value.trim().toUpperCase();
                    const prefix = parentAgreementNumber ? `${parentAgreementNumber}/` : '';
                    setEditDeedForm({ ...editDeedForm, deedNumber: `${prefix}${typed}` });
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Registry Date *
              </label>
              <input
                type="date"
                required
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3 rounded-xl text-xs font-medium text-slate-800"
                value={editDeedForm.deedDate || ''}
                onChange={(e) => setEditDeedForm({ ...editDeedForm, deedDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sub-Registrar Office (SRO)
              </label>
              <input
                type="text"
                placeholder="Sub-Registrar Office / Location"
                className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3 rounded-xl text-xs font-medium text-slate-800"
                value={editDeedForm.subRegistrarOffice || ''}
                onChange={(e) => setEditDeedForm({ ...editDeedForm, subRegistrarOffice: e.target.value })}
              />
            </div>
          </div>

          {/* Land Particulars Table with increase/decrease editable Dismil */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Registered Land Particulars ({parcelRows.length} total)
                </h4>
                <p className="text-[11px] text-slate-500">
                  You can increase or decrease the registered Dismil for each parcel below.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <th className="py-2.5 px-3">Mauja / Village</th>
                      <th className="py-2.5 px-3">Khata / Khesra</th>
                      <th className="py-2.5 px-3 text-right">Agreed Arazi</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800">Max Available</th>
                      <th className="py-2.5 px-3 text-right w-44">Deed Registered (Dismil)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parcelRows.map((row, idx) => {
                      const numVal = Number(row.registeredDismil) || 0;
                      const isOver = numVal > row.maxAllowed + 0.001;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {row.mauja || '—'}
                            {row.thanaNumber && (
                              <span className="text-[10px] text-slate-400 block">Thana: {row.thanaNumber}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            Khata: <strong>{row.khataNumber || '—'}</strong>
                            <span className="block text-teal-800 font-bold">Khesra: {row.khesraNumber || '—'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            {row.araziDismil} <span className="text-[10px] text-slate-400">Dismil</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {row.maxAllowed} <span className="text-[10px] text-slate-400 font-normal">Dismil</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                max={row.maxAllowed}
                                placeholder="0"
                                className={`h-8 w-24 text-right px-2 rounded-lg text-xs font-bold outline-none border transition ${
                                  isOver
                                    ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-2 focus:ring-rose-500'
                                    : numVal > 0
                                    ? 'border-purple-300 bg-white text-purple-950 focus:ring-2 focus:ring-purple-600'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                                }`}
                                value={row.registeredDismil}
                                onChange={(e) => handleDismilChange(idx, e.target.value)}
                              />
                              <button
                                type="button"
                                title="Fill max available dismil for this parcel"
                                onClick={() => handleDismilChange(idx, row.maxAllowed.toString())}
                                className="px-1.5 py-1 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-800 rounded text-[10px] font-bold cursor-pointer transition"
                              >
                                Max
                              </button>
                            </div>
                            {isOver && (
                              <span className="text-[10px] text-rose-600 font-semibold block text-right mt-0.5">
                                Exceeds max {row.maxAllowed} Dismil
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Deed Remarks / Volume & Book Details */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Deed Remarks / Volume & Book Details
            </label>
            <input
              type="text"
              placeholder="Volume, Page, Book details or notes..."
              className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3 rounded-xl text-xs font-medium text-slate-800"
              value={editDeedForm.remarks || ''}
              onChange={(e) => setEditDeedForm({ ...editDeedForm, remarks: e.target.value })}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-purple-600" />
              <span>
                Total Deed Registered:{' '}
                <strong className="text-purple-950 font-bold">
                  {totalRegisteredDismil} Dismil
                </strong>{' '}
                <span className="text-slate-400">
                  (≈ {totalRegisteredSqFt.toLocaleString('en-IN')} Sq.Ft.)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {editDeedLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default EditDeedModal;
