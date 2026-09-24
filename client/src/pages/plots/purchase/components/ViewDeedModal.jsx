import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Building2,
  Layers,
  Users,
  MapPin,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';

const ViewDeedModal = ({ open, onClose, deed }) => {
  if (!deed) return null;

  const fullDeedNumber = deed.deedNumber?.includes('/')
    ? deed.deedNumber
    : deed.parentAgreementNumber
    ? `${deed.parentAgreementNumber}/${deed.deedNumber}`
    : deed.deedNumber;

  // Build lookup map of parent agreement parcels by ID and by khata_khesra
  const agrParcelsMap = new Map();
  (deed.agreementParcels || []).forEach((ap) => {
    if (ap._id) agrParcelsMap.set(String(ap._id), ap);
    if (ap.khataNumber && ap.khesraNumber) {
      agrParcelsMap.set(`${ap.khataNumber}_${ap.khesraNumber}`, ap);
    }
  });

  // Registered parcels resolved with parent parcel particulars
  const rawParcels = Array.isArray(deed.parcels) && deed.parcels.length > 0
    ? deed.parcels
    : Array.isArray(deed.agreementParcels) && deed.agreementParcels.length > 0
    ? deed.agreementParcels
    : [
        {
          mauja: deed.mauja || '—',
          khataNumber: deed.khataNumber || '—',
          khesraNumber: deed.khesraNumber || '—',
          thanaNumber: deed.thanaNumber || '—',
          jamabandiNumber: '—',
          registeredDismil: deed.registeredDismil || 0,
          registeredSqFt: deed.registeredSqFt || 0,
        },
      ];

  const parcels = rawParcels.map((p) => {
    const parentP =
      (p.parcelId && agrParcelsMap.get(String(p.parcelId))) ||
      (p._id && agrParcelsMap.get(String(p._id))) ||
      (p.khataNumber && p.khesraNumber && agrParcelsMap.get(`${p.khataNumber}_${p.khesraNumber}`)) ||
      {};

    return {
      ...parentP,
      ...p,
      mauja: p.mauja || parentP.mauja || deed.mauja || '—',
      thanaNumber: p.thanaNumber || parentP.thanaNumber || deed.thanaNumber || '—',
      khataNumber: p.khataNumber || parentP.khataNumber || deed.khataNumber || '—',
      khesraNumber: p.khesraNumber || parentP.khesraNumber || deed.khesraNumber || '—',
      jamabandiNumber: p.jamabandiNumber || parentP.jamabandiNumber || '—',
      chaudhi:
        p.chaudhi && (p.chaudhi.north || p.chaudhi.south || p.chaudhi.east || p.chaudhi.west)
          ? p.chaudhi
          : parentP.chaudhi || { north: '', south: '', east: '', west: '' },
      registeredDismil: p.registeredDismil !== undefined ? p.registeredDismil : p.araziDismil || 0,
      registeredSqFt:
        p.registeredSqFt !== undefined
          ? p.registeredSqFt
          : p.totalSqFt || Math.round((p.araziDismil || 0) * 435.6 * 100) / 100,
    };
  });

  const farmers = Array.isArray(deed.farmers) ? deed.farmers : [];
  const purchasers = Array.isArray(deed.purchasers) && deed.purchasers.length > 0
    ? deed.purchasers
    : [{ name: 'Good Nature Developers Pvt Ltd' }];

  const allocatedSqFt = Number(deed.allocatedSqFt) || 0;
  const totalSqFt = Number(deed.registeredSqFt) || 0;
  const availableSqFt = deed.availableSqFt !== undefined ? Number(deed.availableSqFt) : Math.max(0, totalSqFt - allocatedSqFt);
  const allocPercent = totalSqFt > 0 ? Math.round((allocatedSqFt / totalSqFt) * 100) : 0;

  return (
    <Modalbox open={open} onClose={onClose} outside={false} maxWidth="max-w-4xl" showClose={false}>
      <div className="flex flex-col max-h-[88vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-5 md:p-6 pb-4 gap-3 bg-white shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-black text-purple-950">
                Deed #{fullDeedNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  deed.status === 'FULLY_ALLOCATED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : deed.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {deed.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Parent Agreement:{' '}
              <strong className="text-teal-800 font-bold">#{deed.parentAgreementNumber || '—'}</strong>
              {deed.subRegistrarOffice && (
                <span>
                  {' '}• SRO Office: <strong className="text-slate-700 font-semibold">{deed.subRegistrarOffice}</strong>
                </span>
              )}
              <span>
                {' '}• Deed Date:{' '}
                <strong className="text-slate-700 font-semibold">
                  {deed.deedDate ? new Date(deed.deedDate).toLocaleDateString('en-IN') : '—'}
                </strong>
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer text-base self-end sm:self-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 md:p-6 pt-4 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
            <div>
              <span className="text-[10px] text-purple-600 block uppercase font-bold tracking-wider">Registered Area</span>
              <span className="font-mono font-bold text-purple-950 text-base">
                {deed.registeredDismil} Dismil
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {deed.registeredSqFt?.toLocaleString('en-IN')} Sq.Ft.
              </span>
            </div>

            <div>
              <span className="text-[10px] text-purple-600 block uppercase font-bold tracking-wider">Stock Allocated</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {allocatedSqFt.toLocaleString('en-IN')} Sq.Ft.
              </span>
              <span className="text-[10px] text-purple-700 font-semibold block">
                {allocPercent}% to inventory
              </span>
            </div>

            <div>
              <span className="text-[10px] text-purple-600 block uppercase font-bold tracking-wider">Available Stock</span>
              <span className="font-mono font-bold text-emerald-700 text-base">
                {availableSqFt.toLocaleString('en-IN')} Sq.Ft.
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                Ready for sale
              </span>
            </div>

            <div>
              <span className="text-[10px] text-purple-600 block uppercase font-bold tracking-wider">Deed Status</span>
              <span className="font-bold text-slate-800 text-sm block mt-0.5">
                {deed.status || 'Active in Land Stock'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {deed.subRegistrarOffice ? `SRO ${deed.subRegistrarOffice}` : 'Official Record'}
              </span>
            </div>
          </div>

          {/* 1. Land Parcels Covered by This Deed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Layers size={14} className="text-purple-700" />
                Land Parcels & Coordinates ({parcels.length})
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 select-none text-[11px]">
                  <tr>
                    <th className="p-2.5">Mauja / Thana</th>
                    <th className="p-2.5">Khata / Khesra</th>
                    <th className="p-2.5">Jamabandi</th>
                    <th className="p-2.5">Chaudhi (Boundaries)</th>
                    <th className="p-2.5 text-right">Registered Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                  {parcels.map((p, idx) => {
                    const dismil = p.registeredDismil !== undefined ? p.registeredDismil : p.araziDismil || 0;
                    const sqft = p.registeredSqFt !== undefined ? p.registeredSqFt : p.totalSqFt || Math.round(dismil * 435.6 * 100) / 100;
                    const ch = p.chaudhi || {};
                    return (
                      <tr key={p._id || idx} className="hover:bg-purple-50/20 transition">
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{p.mauja || '—'}</strong>
                          <span className="text-[10px] text-slate-400">Thana: {p.thanaNumber || '—'}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="text-slate-700 block">Khata: {p.khataNumber || '—'}</span>
                          <strong className="text-slate-900 block font-mono">Khesra: {p.khesraNumber || '—'}</strong>
                        </td>
                        <td className="p-2.5">
                          <span className="text-slate-700 font-mono">{p.jamabandiNumber || '—'}</span>
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-500 max-w-xs">
                          {ch.north || ch.south || ch.east || ch.west ? (
                            <div>
                              <span>N: {ch.north || '—'} | S: {ch.south || '—'}</span>
                              <br />
                              <span>E: {ch.east || '—'} | W: {ch.west || '—'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">As per parent agreement</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <strong className="text-purple-900 block">{dismil} Dismil</strong>
                          <span className="text-[10px] text-slate-400 block">{sqft?.toLocaleString('en-IN')} Sq.Ft.</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Land Sellers & Purchasers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sellers (Farmers) */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Users size={14} className="text-teal-700" />
                Land Sellers / Farmers ({farmers.length})
              </h4>
              <div className="space-y-2">
                {farmers.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic text-[11px]">
                    No farmer details linked.
                  </div>
                ) : (
                  farmers.map((f, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold text-xs">{f.name}</strong>
                        {f.sharePercent !== undefined && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {f.sharePercent}% Share
                          </span>
                        )}
                      </div>
                      {f.guardianName && (
                        <p className="text-[11px] text-slate-500">
                          {f.relation || "Father"}: {f.guardianName}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5 flex-wrap">
                        {f.mobile && <span>📞 {f.mobile}</span>}
                        {f.aadhaarNumber && <span>Aadhaar: {f.aadhaarNumber}</span>}
                        {f.panNumber && <span>PAN: {f.panNumber}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Purchasers (Company/Buyers) */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Building2 size={14} className="text-purple-700" />
                Purchasers / Buyers ({purchasers.length})
              </h4>
              <div className="space-y-2">
                {purchasers.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-bold text-xs block">{p.name}</strong>
                    {p.contact && (
                      <p className="text-[11px] text-slate-500">Contact: {p.contact}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5 flex-wrap">
                      {p.aadhaarNumber && <span>Aadhaar: {p.aadhaarNumber}</span>}
                      {p.panNumber && <span>PAN: {p.panNumber}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Remarks */}
          {deed.remarks && (
            <div className="space-y-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deed Remarks / Notes</h5>
              <p className="text-slate-700 text-xs">{deed.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modalbox>
  );
};

export default ViewDeedModal;
