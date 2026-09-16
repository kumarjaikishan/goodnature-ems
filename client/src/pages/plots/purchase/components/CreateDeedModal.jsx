import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckSquare, Square, Check, AlertCircle } from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { toast } from '../../../../utils/toast';

const CreateDeedModal = ({
  open,
  onClose,
  targetAgreementForDeed,
  deedForm,
  setDeedForm,
  deedLoading,
  handleSaveRegistryDeed,
}) => {
  const [parcelRows, setParcelRows] = useState([]);

  // Initialize parcel breakdown whenever modal opens or targetAgreementForDeed changes
  useEffect(() => {
    if (!targetAgreementForDeed) {
      setParcelRows([]);
      return;
    }

    const rawParcels = Array.isArray(targetAgreementForDeed.landParcels) && targetAgreementForDeed.landParcels.length > 0
      ? targetAgreementForDeed.landParcels
      : [
          {
            _id: targetAgreementForDeed._id,
            mauja: targetAgreementForDeed.mauja || '',
            khataNumber: targetAgreementForDeed.khataNumber || '',
            khesraNumber: targetAgreementForDeed.khesraNumber || '',
            thanaNumber: targetAgreementForDeed.thanaNumber || '',
            araziDismil: targetAgreementForDeed.araziDismil || 0,
            registeredDismil: targetAgreementForDeed.totalRegisteredDismil || 0,
          },
        ];

    const initialRows = rawParcels.map((p) => {
      const totalD = Number(p.araziDismil) || 0;
      const regD = Number(p.registeredDismil) || 0;
      const remD = Math.max(0, Math.round((totalD - regD) * 1000) / 1000);
      return {
        parcelId: p._id,
        mauja: p.mauja,
        khataNumber: p.khataNumber,
        khesraNumber: p.khesraNumber,
        thanaNumber: p.thanaNumber,
        araziDismil: totalD,
        alreadyRegisteredDismil: regD,
        remainingDismil: remD,
        selected: remD > 0,
        registerDismil: remD > 0 ? remD.toString() : '',
      };
    });

    setParcelRows(initialRows);
  }, [targetAgreementForDeed, open]);

  // Handle individual parcel changes
  const handleToggleParcel = (idx) => {
    const updated = [...parcelRows];
    const row = updated[idx];
    const newSelected = !row.selected;
    row.selected = newSelected;
    if (newSelected && (!row.registerDismil || Number(row.registerDismil) === 0)) {
      row.registerDismil = row.remainingDismil.toString();
    } else if (!newSelected) {
      row.registerDismil = '';
    }
    setParcelRows(updated);
  };

  const handleParcelDismilChange = (idx, val) => {
    const updated = [...parcelRows];
    updated[idx].registerDismil = val;
    if (Number(val) > 0) {
      updated[idx].selected = true;
    }
    setParcelRows(updated);
  };

  const handleSelectAll = () => {
    const allSelected = parcelRows.every((r) => r.selected || r.remainingDismil === 0);
    const updated = parcelRows.map((r) => ({
      ...r,
      selected: !allSelected && r.remainingDismil > 0,
      registerDismil: !allSelected && r.remainingDismil > 0 ? r.remainingDismil.toString() : '',
    }));
    setParcelRows(updated);
  };

  // Calculations
  const selectedParcels = parcelRows.filter((r) => r.selected && Number(r.registerDismil) > 0);
  const totalSelectedDismil = Math.round(
    selectedParcels.reduce((sum, r) => sum + (Number(r.registerDismil) || 0), 0) * 1000
  ) / 1000;
  const totalSelectedSqFt = Math.round(totalSelectedDismil * 435.6 * 100) / 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    const prefix = targetAgreementForDeed?.agreementNumber ? `${targetAgreementForDeed.agreementNumber}/` : '';
    const deedNumberValue = deedForm.deedNumber || '';
    const codeOnly = deedNumberValue.startsWith(prefix) ? deedNumberValue.slice(prefix.length).trim() : deedNumberValue.trim();

    if (!codeOnly) {
      toast.error('Please enter a deed number / code.');
      return;
    }

    if (selectedParcels.length === 0 || totalSelectedDismil <= 0) {
      toast.error('Please select at least one parcel and enter a valid registration dismil area.');
      return;
    }

    // Validate no parcel exceeds remaining available
    for (const r of selectedParcels) {
      const val = Number(r.registerDismil) || 0;
      if (val > r.remainingDismil + 0.001) {
        toast.error(
          `Cannot register ${val} Dismil for Mauja ${r.mauja} (Khesra: ${r.khesraNumber}). Max remaining is ${r.remainingDismil} Dismil.`
        );
        return;
      }
    }

    const payload = {
      ...deedForm,
      deedNumber: deedNumberValue,
      registeredDismil: totalSelectedDismil,
      parcels: selectedParcels.map((r) => ({
        parcelId: r.parcelId,
        registeredDismil: Number(r.registerDismil),
      })),
    };

    setDeedForm(payload);
    handleSaveRegistryDeed(e, payload);
  };

  return (
    <Modalbox open={open} onClose={onClose} outside={false} maxWidth="max-w-3xl" showClose={false}>
      <div className="p-4 sm:p-6 w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200/60">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-purple-950">
                Convert to Registered Land Deed
              </h3>
              {targetAgreementForDeed && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Parent Agreement: <strong className="text-teal-800 font-bold">#{targetAgreementForDeed.agreementNumber}</strong>{' '}
                  • Total Agreed: {targetAgreementForDeed.araziDismil} Dismil
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top Deed Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Registry Deed Number *
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600">
                <span className="bg-purple-100 text-purple-900 font-mono font-bold text-xs px-2.5 py-2 border-r border-purple-200 select-none shrink-0">
                  {targetAgreementForDeed?.agreementNumber}/
                </span>
                <input
                  type="text"
                  required
                  placeholder="DEED001"
                  className="h-9 w-full bg-transparent outline-none px-2.5 text-xs font-bold uppercase text-purple-900 placeholder:text-slate-400 placeholder:font-normal"
                  value={
                    targetAgreementForDeed?.agreementNumber && (deedForm.deedNumber || '').startsWith(`${targetAgreementForDeed.agreementNumber}/`)
                      ? (deedForm.deedNumber || '').slice(`${targetAgreementForDeed.agreementNumber}/`.length)
                      : deedForm.deedNumber || ''
                  }
                  onChange={(e) => {
                    const typed = e.target.value.trim().toUpperCase();
                    const prefix = targetAgreementForDeed?.agreementNumber ? `${targetAgreementForDeed.agreementNumber}/` : '';
                    setDeedForm({ ...deedForm, deedNumber: `${prefix}${typed}` });
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
                value={deedForm.deedDate || ''}
                onChange={(e) => setDeedForm({ ...deedForm, deedDate: e.target.value })}
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
                value={deedForm.subRegistrarOffice || ''}
                onChange={(e) => setDeedForm({ ...deedForm, subRegistrarOffice: e.target.value })}
              />
            </div>
          </div>

          {/* ── LAND DETAILS SELECTIVE REGISTRY TABLE ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Land / Plot(s) to Register ({parcelRows.length} total)
                </h4>
                <p className="text-[11px] text-slate-500">
                  You can register all plots at once or custom Dismil per row. Remaining Dismil stays in agreement stock.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                <CheckSquare size={13} />
                <span>Select / Deselect All</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Mauja / Village</th>
                      <th className="py-2.5 px-3">Khata / Khesra</th>
                      <th className="py-2.5 px-3 text-right">Agreed Arazi</th>
                      <th className="py-2.5 px-3 text-right">Already Registered</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800">Remaining Avail.</th>
                      <th className="py-2.5 px-3 text-right w-44">Register Now (Dismil)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parcelRows.map((row, idx) => {
                      const isFullyReg = row.remainingDismil <= 0;
                      const isOver = Number(row.registerDismil) > row.remainingDismil;
                      return (
                        <tr
                          key={idx}
                          className={`transition ${
                            row.selected ? 'bg-purple-50/40 font-medium' : isFullyReg ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              disabled={isFullyReg}
                              onClick={() => handleToggleParcel(idx)}
                              className="text-purple-700 hover:text-purple-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {row.selected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>
                          </td>

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

                          <td className="py-2.5 px-3 text-right text-purple-700 font-semibold">
                            {row.alreadyRegisteredDismil}{' '}
                            <span className="text-[10px] text-slate-400">Dismil</span>
                          </td>

                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {row.remainingDismil}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">Dismil</span>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                max={row.remainingDismil}
                                disabled={isFullyReg}
                                placeholder="0"
                                className={`h-8 w-24 text-right px-2 rounded-lg text-xs font-bold outline-none border transition ${
                                  isOver
                                    ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-2 focus:ring-rose-500'
                                    : row.selected
                                    ? 'border-purple-300 bg-white text-purple-950 focus:ring-2 focus:ring-purple-600'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                                }`}
                                value={row.registerDismil}
                                onChange={(e) => handleParcelDismilChange(idx, e.target.value)}
                              />
                              {!isFullyReg && (
                                <button
                                  type="button"
                                  title="Fill all remaining dismil for this parcel"
                                  onClick={() => handleParcelDismilChange(idx, row.remainingDismil.toString())}
                                  className="px-1.5 py-1 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-800 rounded text-[10px] font-bold cursor-pointer transition"
                                >
                                  Max
                                </button>
                              )}
                            </div>
                            {isOver && (
                              <span className="text-[10px] text-rose-600 font-semibold block text-right mt-0.5">
                                Exceeds max {row.remainingDismil} Dismil
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

          {/* Deed Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Deed Remarks / Volume & Book Details
            </label>
            <input
              type="text"
              placeholder="Volume, Page, Book details or notes..."
              className="h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-purple-600 outline-none px-3 rounded-xl text-xs font-medium text-slate-800"
              value={deedForm.remarks || ''}
              onChange={(e) => setDeedForm({ ...deedForm, remarks: e.target.value })}
            />
          </div>

          {/* Summary KPI Banner & Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-2xl">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Registering:{' '}
                <strong className="text-purple-900 font-bold text-sm">
                  {totalSelectedDismil} Dismil
                </strong>{' '}
                (≈ {totalSelectedSqFt.toLocaleString('en-IN')} Sq.Ft.)
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Selected: <strong>{selectedParcels.length}</strong> of {parcelRows.length} Parcel(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deedLoading || totalSelectedDismil <= 0 || selectedParcels.length === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>{deedLoading ? 'Saving Deed...' : 'Register Deed'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default CreateDeedModal;
