import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import Button from '../../../../components/ui/Button';

/**
 * LandAcquisitionSourcingSection
 * Cascading 3-step Land Sourcing:
 *  1. Khata No. (Selectable & Searchable)
 *  2. Plot / Khesra No. (Selectable & Searchable, filtered by chosen Khata)
 *  3. Agreement No. (Selectable & Searchable, filtered by chosen Khata & Khesra)
 *  4. Allocated Area (SqFt)
 */
export const LandAcquisitionSourcingSection = ({
  landSources = [],
  landSourcing = [],
  setLandSourcing,
  requiredSqFt = 0,
  title = 'Land Acquisition Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड स्टॉक)',
  subtitle,
}) => {
  const reqSqFt = Number(requiredSqFt) || 0;

  // Flatten all available agreements and their parcels into selectable parcel-units
  const allParcelUnits = useMemo(() => {
    const units = [];
    for (const agr of landSources || []) {
      const agrId = String(agr.agreementId || agr._id || '');
      const agrNum = agr.agreementNumber || agr.label || '';
      const parcels = (agr.parcels && agr.parcels.length > 0)
        ? agr.parcels
        : [
            {
              parcelId: null,
              khataNumber: agr.khataNumber || '',
              khesraNumber: agr.khesraNumber || '',
              mauja: agr.mauja || '',
              thanaNumber: agr.thanaNumber || '',
              availableSqFt: agr.availableSqFt || 0,
              availableDismil: agr.availableDismil || 0,
            },
          ];

      for (const p of parcels) {
        units.push({
          agreementId: agrId,
          agreementNumber: agrNum,
          agrTotalAvailSqFt: agr.availableSqFt || 0,
          parcelId: p.parcelId ? String(p.parcelId) : null,
          khataNumber: String(p.khataNumber || agr.khataNumber || '').trim(),
          khesraNumber: String(p.khesraNumber || agr.khesraNumber || '').trim(),
          mauja: p.mauja || agr.mauja || '',
          thanaNumber: p.thanaNumber || agr.thanaNumber || '',
          availableSqFt: p.availableSqFt !== undefined ? p.availableSqFt : (agr.availableSqFt || 0),
          availableDismil: p.availableDismil !== undefined ? p.availableDismil : (agr.availableDismil || 0),
          sourceType: agr.sourceType || 'AGREEMENT',
          rawAgreement: agr,
          rawParcel: p,
        });
      }
    }
    return units;
  }, [landSources]);

  // Overall unique Khatas across all available land sources
  const overallKhataOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const u of allParcelUnits) {
      const k = u.khataNumber || 'General';
      if (!seen.has(k)) {
        seen.add(k);
        list.push({
          value: k,
          label: k === 'General' ? 'General' : k,
          subtitle: u.mauja ? `Mauja: ${u.mauja}${u.thanaNumber ? ` • Thana: ${u.thanaNumber}` : ''}` : undefined,
        });
      }
    }
    return list.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [allParcelUnits]);

  // Add new land source row
  const handleAddRow = () => {
    setLandSourcing([
      ...landSourcing,
      {
        sourceType: 'AGREEMENT',
        agreementId: '',
        agreementNumber: '',
        parcelId: null,
        khesraNumber: '',
        mauja: '',
        thanaNumber: '',
        khataNumber: '',
        allocatedSqFt: 0,
      },
    ]);
  };

  // Remove land source row
  const handleRemoveRow = (idx) => {
    setLandSourcing(landSourcing.filter((_, i) => i !== idx));
  };

  // 1. When Khata changes
  const handleKhataChange = (idx, chosenKhata) => {
    const updated = [...landSourcing];
    const rawKhata = chosenKhata === 'General' ? '' : (chosenKhata || '');

    // Reset subordinate selections
    updated[idx] = {
      ...updated[idx],
      khataNumber: rawKhata,
      khesraNumber: '',
      agreementId: '',
      agreementNumber: '',
      parcelId: null,
      mauja: '',
      thanaNumber: '',
      allocatedSqFt: 0,
    };

    // Auto-select Khesra if only 1 unique Khesra exists under this Khata
    const matchingUnits = allParcelUnits.filter((u) =>
      chosenKhata === 'General' ? (!u.khataNumber || u.khataNumber === 'General') : (u.khataNumber === rawKhata)
    );
    const uniqueKhesras = Array.from(new Set(matchingUnits.map((u) => u.khesraNumber || 'General Plot')));
    if (uniqueKhesras.length === 1) {
      const singleKhesra = uniqueKhesras[0] === 'General Plot' ? '' : uniqueKhesras[0];
      updated[idx].khesraNumber = singleKhesra;

      // Also check if only 1 agreement matches this single Khesra
      const matchingAgrs = matchingUnits.filter((u) =>
        singleKhesra ? (u.khesraNumber === singleKhesra) : (!u.khesraNumber || u.khesraNumber === 'General Plot')
      );
      if (matchingAgrs.length === 1) {
        const u = matchingAgrs[0];
        const otherRowsTotal = landSourcing
          .filter((_, i) => i !== idx)
          .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
        const remainingNeeded = Math.max(0, reqSqFt - otherRowsTotal);

        updated[idx].agreementId = u.agreementId;
        updated[idx].agreementNumber = u.agreementNumber;
        updated[idx].parcelId = u.parcelId;
        updated[idx].mauja = u.mauja;
        updated[idx].thanaNumber = u.thanaNumber;
        updated[idx].sourceType = u.sourceType || 'AGREEMENT';
        updated[idx].allocatedSqFt = remainingNeeded > 0 ? remainingNeeded : reqSqFt;
      }
    }

    setLandSourcing(updated);
  };

  // 2. When Plot / Khesra changes
  const handleKhesraChange = (idx, chosenKhesra) => {
    const updated = [...landSourcing];
    const rawKhesra = chosenKhesra === 'General Plot' ? '' : (chosenKhesra || '');

    updated[idx] = {
      ...updated[idx],
      khesraNumber: rawKhesra,
      agreementId: '',
      agreementNumber: '',
      parcelId: null,
      mauja: '',
      thanaNumber: '',
      allocatedSqFt: 0,
    };

    // Auto-select Agreement if only 1 agreement exists for this Khata + Khesra
    const curKhata = updated[idx].khataNumber;
    const matchingUnits = allParcelUnits.filter((u) => {
      const matchKhata = !curKhata || curKhata === 'General'
        ? (!u.khataNumber || u.khataNumber === 'General')
        : (u.khataNumber === curKhata);
      const matchKhesra = !rawKhesra
        ? (!u.khesraNumber || u.khesraNumber === 'General Plot')
        : (u.khesraNumber === rawKhesra);
      return matchKhata && matchKhesra;
    });

    if (matchingUnits.length === 1) {
      const u = matchingUnits[0];
      const otherRowsTotal = landSourcing
        .filter((_, i) => i !== idx)
        .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
      const remainingNeeded = Math.max(0, reqSqFt - otherRowsTotal);

      updated[idx].agreementId = u.agreementId;
      updated[idx].agreementNumber = u.agreementNumber;
      updated[idx].parcelId = u.parcelId;
      updated[idx].mauja = u.mauja;
      updated[idx].thanaNumber = u.thanaNumber;
      updated[idx].sourceType = u.sourceType || 'AGREEMENT';
      updated[idx].allocatedSqFt = remainingNeeded > 0 ? remainingNeeded : reqSqFt;
    }

    setLandSourcing(updated);
  };

  // 3. When Agreement changes
  const handleAgreementChange = (idx, chosenAgrId) => {
    const updated = [...landSourcing];
    if (!chosenAgrId) {
      updated[idx] = {
        ...updated[idx],
        agreementId: '',
        agreementNumber: '',
        parcelId: null,
        allocatedSqFt: 0,
      };
      setLandSourcing(updated);
      return;
    }

    const curKhata = updated[idx].khataNumber;
    const curKhesra = updated[idx].khesraNumber;

    // Find best matching parcel unit
    const matchingUnit = allParcelUnits.find((u) => {
      if (String(u.agreementId) !== String(chosenAgrId)) return false;
      const matchKhata = !curKhata || curKhata === 'General'
        ? (!u.khataNumber || u.khataNumber === 'General')
        : (u.khataNumber === curKhata);
      const matchKhesra = !curKhesra
        ? (!u.khesraNumber || u.khesraNumber === 'General Plot')
        : (u.khesraNumber === curKhesra);
      return matchKhata && matchKhesra;
    }) || allParcelUnits.find((u) => String(u.agreementId) === String(chosenAgrId));

    if (!matchingUnit) return;

    const otherRowsTotal = landSourcing
      .filter((_, i) => i !== idx)
      .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
    const remainingNeeded = Math.max(0, reqSqFt - otherRowsTotal);
    const currentAlloc = Number(updated[idx].allocatedSqFt) || 0;

    updated[idx] = {
      ...updated[idx],
      sourceType: matchingUnit.sourceType || 'AGREEMENT',
      agreementId: matchingUnit.agreementId,
      agreementNumber: matchingUnit.agreementNumber,
      parcelId: matchingUnit.parcelId,
      khesraNumber: updated[idx].khesraNumber || matchingUnit.khesraNumber,
      khataNumber: updated[idx].khataNumber || matchingUnit.khataNumber,
      mauja: matchingUnit.mauja || updated[idx].mauja || '',
      thanaNumber: matchingUnit.thanaNumber || updated[idx].thanaNumber || '',
      allocatedSqFt: currentAlloc > 0 ? currentAlloc : (remainingNeeded > 0 ? remainingNeeded : reqSqFt),
    };

    setLandSourcing(updated);
  };

  // 4. When Allocated Area changes
  const handleAreaChange = (idx, rawVal) => {
    const updated = [...landSourcing];
    const val = rawVal === '' ? '' : Math.max(0, Number(rawVal) || 0);
    updated[idx] = { ...updated[idx], allocatedSqFt: val };
    setLandSourcing(updated);
  };

  // Calculations for summary bar
  const validAllocatedSqFt = landSourcing
    .filter((s) => Boolean(s.agreementId))
    .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  const hasUnselectedRows = landSourcing.some((s) => !s.agreementId);
  const isAreaMatched = landSourcing.length > 0 &&
    !hasUnselectedRows &&
    Math.abs(validAllocatedSqFt - reqSqFt) < 0.01;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            {title}{' '}
            <span className="text-rose-500">*</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {subtitle || `Required: Allocate the entire area (${reqSqFt} Sq.Ft.) from active Kisan Agreements or Registry Deeds.`}
          </p>
        </div>

        {landSources.length > 0 && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAddRow}
          >
            + Add Land Source
          </Button>
        )}
      </div>

      {/* Empty State */}
      {landSourcing.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {landSources.length === 0
              ? 'No active agreements or registry deeds with available stock found for this project.'
              : 'No agreement or land parcel selected. Click "+ Add Land Source" above to allocate land stock.'}
          </span>
        </div>
      ) : (
        <div className="space-y-3 mt-1">
          {landSourcing.map((src, idx) => {
            const curKhata = src.khataNumber ? String(src.khataNumber).trim() : '';
            const curKhesra = src.khesraNumber ? String(src.khesraNumber).trim() : '';

            // Compute available Khesra options filtered strictly by chosen Khata
            const khesraOptions = (() => {
              if (!curKhata && overallKhataOptions.length > 0) return [];
              const seen = new Set();
              const list = [];
              for (const u of allParcelUnits) {
                const matchKhata = !curKhata || curKhata === 'General'
                  ? (!u.khataNumber || u.khataNumber === 'General')
                  : (u.khataNumber === curKhata);
                if (matchKhata) {
                  const p = u.khesraNumber || 'General Plot';
                  if (!seen.has(p)) {
                    seen.add(p);
                    list.push({
                      value: p,
                      label: p === 'General Plot' ? 'General' : p,
                      subtitle: `Avail: ${u.availableSqFt?.toLocaleString('en-IN')} SqFt${u.mauja ? ` • ${u.mauja}` : ''}`,
                    });
                  }
                }
              }
              return list.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
            })();

            // Compute available Agreements filtered by chosen Khata AND chosen Khesra
            const agreementOptions = (() => {
              if (!curKhesra && khesraOptions.length > 0) return [];
              const seen = new Set();
              const list = [];
              for (const u of allParcelUnits) {
                const matchKhata = !curKhata || curKhata === 'General'
                  ? (!u.khataNumber || u.khataNumber === 'General')
                  : (u.khataNumber === curKhata);
                const matchKhesra = !curKhesra || curKhesra === 'General Plot'
                  ? (!u.khesraNumber || u.khesraNumber === 'General Plot')
                  : (u.khesraNumber === curKhesra);

                if (matchKhata && matchKhesra) {
                  if (!seen.has(u.agreementId)) {
                    seen.add(u.agreementId);
                    list.push({
                      value: u.agreementId,
                      label: `${u.agreementNumber} (Avail: ${u.availableSqFt?.toLocaleString('en-IN')} SqFt)`,
                      subtitle: `${u.mauja ? `Mauja: ${u.mauja}` : ''}${u.thanaNumber ? ` • Thana: ${u.thanaNumber}` : ''} • ${u.availableDismil} Dismil`,
                    });
                  }
                }
              }
              return list;
            })();

            // Find current active unit for stock metrics
            const activeUnit = allParcelUnits.find((u) => {
              if (src.agreementId && String(u.agreementId) !== String(src.agreementId)) return false;
              if (curKhesra && u.khesraNumber !== curKhesra) return false;
              if (curKhata && u.khataNumber !== curKhata) return false;
              return true;
            }) || allParcelUnits.find((u) => String(u.agreementId) === String(src.agreementId));

            const maxAvailSqFt = activeUnit?.availableSqFt ?? 0;
            const maxAvailDismil = activeUnit?.availableDismil ?? (maxAvailSqFt ? (maxAvailSqFt / 435.6).toFixed(2) : 0);

            return (
              <div
                key={idx}
                className="flex flex-col gap-2.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* 1. Khata No. Dropdown (Searchable) */}
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <span>1. Khata No.</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      size="sm"
                      placeholder="-- Select Khata --"
                      searchPlaceholder="Search Khata..."
                      options={overallKhataOptions}
                      value={src.khataNumber ? String(src.khataNumber) : (overallKhataOptions.some(o => o.value === 'General') && !src.khataNumber ? '' : '')}
                      onChange={(val) => handleKhataChange(idx, val)}
                      allowClear={true}
                    />
                  </div>

                  {/* 2. Plot / Khesra No. Dropdown (Searchable, filtered by Khata) */}
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <span>2. Plot / Khesra No.</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      size="sm"
                      placeholder={src.khataNumber || overallKhataOptions.length === 0 ? '-- Select Khesra --' : 'Select Khata first'}
                      searchPlaceholder="Search Khesra..."
                      options={khesraOptions}
                      value={src.khesraNumber ? String(src.khesraNumber) : ''}
                      onChange={(val) => handleKhesraChange(idx, val)}
                      disabled={!src.khataNumber && overallKhataOptions.length > 0}
                      allowClear={true}
                    />
                  </div>

                  {/* 3. Agreement No. Dropdown (Searchable, filtered by Khata & Khesra) */}
                  <div className="sm:col-span-4 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <span>3. Choose Agreement *</span>
                    </label>
                    <SearchableSelect
                      size="sm"
                      placeholder={src.khesraNumber || khesraOptions.length === 0 ? '-- Select Agreement --' : 'Select Khesra first'}
                      searchPlaceholder="Search Agreement..."
                      options={agreementOptions}
                      value={src.agreementId ? String(src.agreementId) : ''}
                      onChange={(val) => handleAgreementChange(idx, val)}
                      disabled={!src.khesraNumber && khesraOptions.length > 0}
                      allowClear={true}
                    />
                  </div>

                  {/* 4. Allocated Area (SqFt) Input & Delete */}
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        Allocated Area *
                      </label>
                      {(() => {
                        const otherRowsTotal = landSourcing
                          .filter((_, i) => i !== idx)
                          .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                        const remainingNeeded = Math.max(0, reqSqFt - otherRowsTotal);
                        if (remainingNeeded > 0 && Number(src.allocatedSqFt) !== remainingNeeded) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleAreaChange(idx, remainingNeeded)}
                              className="text-[9px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                              title="Fill remaining unallocated area"
                            >
                              Fill {remainingNeeded}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1"
                          max={maxAvailSqFt > 0 ? maxAvailSqFt : undefined}
                          value={src.allocatedSqFt || ''}
                          onChange={(e) => handleAreaChange(idx, e.target.value)}
                          placeholder="Sq.Ft."
                          className="h-8 px-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none w-full text-right pr-8 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 shadow-2xs"
                        />
                        <span className="absolute right-1.5 top-2 text-[9px] text-slate-400 font-bold pointer-events-none">
                          SqFt
                        </span>
                      </div>

                      {landSourcing.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title="Remove land source"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Details Tag */}
                {src.agreementId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Khata: {src.khataNumber || 'General'}
                      </span>
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Plot / Khesra: {src.khesraNumber || 'General'}
                      </span>
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Agreement: {src.agreementNumber || 'N/A'}
                      </span>
                      {src.mauja && (
                        <span className="text-slate-500">
                          Mauja: <strong className="text-slate-700">{src.mauja}</strong>
                        </span>
                      )}
                      {src.thanaNumber && (
                        <span className="text-slate-500">
                          Thana: <strong className="text-slate-700">{src.thanaNumber}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-right font-medium">
                      <span className="text-emerald-700 font-semibold">
                        Avail Stock: {maxAvailSqFt?.toLocaleString('en-IN')} SqFt
                      </span>
                      {maxAvailDismil ? (
                        <span className="text-slate-400 ml-1">({maxAvailDismil} Dismil)</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sourcing Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200 text-xs font-semibold">
        <div className="flex items-center gap-2">
          {isAreaMatched ? (
            <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
              <CheckCircle2 size={14} /> Total Area Fully Allocated ({validAllocatedSqFt} / {reqSqFt} SqFt)
            </span>
          ) : (
            <span className="text-amber-800 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-xs">
              <AlertCircle size={14} />
              {hasUnselectedRows
                ? (validAllocatedSqFt === 0
                    ? `Please choose Khata, Khesra, and Agreement to allocate ${reqSqFt} Sq.Ft.`
                    : `Please choose Agreement for all rows (Allocated: ${validAllocatedSqFt} of ${reqSqFt} SqFt)`)
                : validAllocatedSqFt < reqSqFt
                ? `Under-allocated: ${validAllocatedSqFt} of ${reqSqFt} SqFt (${reqSqFt - validAllocatedSqFt} SqFt remaining)`
                : validAllocatedSqFt > reqSqFt
                ? `Over-allocated: ${validAllocatedSqFt} of ${reqSqFt} SqFt (${validAllocatedSqFt - reqSqFt} SqFt excess)`
                : `Total Area Fully Allocated (${validAllocatedSqFt} / {reqSqFt} SqFt)`}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          {validAllocatedSqFt} / {reqSqFt} Sq. Ft.
        </div>
      </div>
    </div>
  );
};

export default LandAcquisitionSourcingSection;

