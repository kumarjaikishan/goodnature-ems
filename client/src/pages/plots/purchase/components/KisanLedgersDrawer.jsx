import React from 'react';
import {
  Paperclip,
  ExternalLink,
  Layers,
  Users,
  UserCheck,
  Building2,
  Calendar,
  ShieldCheck,
  CreditCard,
  MapPin,
  FileText,
  X,
  Compass,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';

const KisanLedgersDrawer = ({
  open,
  onClose,
  detailData,
}) => {
  if (!detailData) return null;

  const agr = detailData.agreement || {};
  const finSummary = detailData.financialSummary || {};

  // Standardize parcels array with complete fallbacks
  const parcels = Array.isArray(agr.landParcels) && agr.landParcels.length > 0
    ? agr.landParcels.map((p) => ({
        ...p,
        mauja: p.mauja || agr.mauja || '—',
        thanaNumber: p.thanaNumber || agr.thanaNumber || '',
        khataNumber: p.khataNumber || agr.khataNumber || '—',
        khesraNumber: p.khesraNumber || agr.khesraNumber || '—',
        jamabandiNumber: p.jamabandiNumber || agr.jamabandiNumber || '',
        chaudhi: p.chaudhi || agr.chaudhi || { north: '', south: '', east: '', west: '' },
        araziDismil: p.araziDismil !== undefined ? p.araziDismil : agr.araziDismil || 0,
        totalSqFt: p.totalSqFt || (p.araziDismil ? Math.round(p.araziDismil * 435.6 * 100) / 100 : agr.totalSqFt || 0),
        ratePerDismil: p.ratePerDismil || agr.ratePerDismil || 0,
        totalAmount: p.totalAmount !== undefined ? p.totalAmount : agr.totalAgreementAmount || 0,
      }))
    : [
        {
          mauja: agr.mauja || '—',
          thanaNumber: agr.thanaNumber || '',
          khataNumber: agr.khataNumber || '—',
          khesraNumber: agr.khesraNumber || '—',
          jamabandiNumber: agr.jamabandiNumber || '',
          chaudhi: agr.chaudhi || { north: '', south: '', east: '', west: '' },
          araziDismil: agr.araziDismil || 0,
          totalSqFt: agr.totalSqFt || (agr.araziDismil ? Math.round(agr.araziDismil * 435.6 * 100) / 100 : 0),
          ratePerDismil: agr.ratePerDismil || 0,
          totalAmount: agr.totalAgreementAmount || 0,
        },
      ];

  const attachments = Array.isArray(agr.attachments) ? agr.attachments : [];
  const farmers = Array.isArray(agr.farmers) ? agr.farmers : [];
  const purchasers = Array.isArray(agr.purchasers) && agr.purchasers.length > 0
    ? agr.purchasers
    : [{ name: 'Good Nature Developers Pvt Ltd' }];
  const registryDeeds = Array.isArray(agr.registryDeeds) ? agr.registryDeeds : [];

  // Summary figures
  const totalCost = Number(finSummary.totalCost !== undefined ? finSummary.totalCost : agr.totalAgreementAmount) || 0;
  const totalPaid = Number(finSummary.totalPaid !== undefined ? finSummary.totalPaid : 0);
  const balanceDue = Number(finSummary.balanceDue !== undefined ? finSummary.balanceDue : totalCost - totalPaid);

  const allMaujas = [...new Set(parcels.map((p) => p.mauja).filter(Boolean))].join(', ') || agr.mauja || '—';
  const allThanas = [...new Set(parcels.map((p) => p.thanaNumber).filter(Boolean))].join(', ') || agr.thanaNumber || '—';
  const allJamabandis = [...new Set(parcels.map((p) => p.jamabandiNumber).filter(Boolean))].join(', ') || agr.jamabandiNumber || '—';
  const allKhatas = [...new Set(parcels.map((p) => p.khataNumber).filter(Boolean))].join(', ') || agr.khataNumber || '—';
  const allKhesras = [...new Set(parcels.map((p) => p.khesraNumber).filter(Boolean))].join(', ') || agr.khesraNumber || '—';

  return (
    <Modalbox open={open} onClose={onClose} outside={false} maxWidth="max-w-6xl" showClose={false}>
      <div className="flex flex-col max-h-[90vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 p-5 md:p-6 pb-4 gap-3 bg-white shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xl font-black text-teal-900">
                Plot Purchase Agreement #{agr.agreementNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  agr.status === 'FULLY_REGISTERED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : agr.status === 'PARTIALLY_REGISTERED'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {agr.status?.replace('_', ' ') || 'ACTIVE'}
              </span>
            </div>

            {/* Quick Land Identifiers Pill Bar */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 pt-0.5">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                📍 Mauja: <strong className="text-slate-900">{allMaujas}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                🏛️ Thana No: <strong className="text-slate-900">{allThanas}</strong>
              </span>
              <span className="bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 font-medium text-teal-900">
                📜 Jamabandi No: <strong className="text-teal-950 font-bold">{allJamabandis}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                Khata: <strong className="text-slate-900">{allKhatas}</strong> | Khesra: <strong className="text-slate-900">{allKhesras}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer text-base self-end sm:self-center rounded-lg hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── AGREEMENT DETAILS BODY (SCROLLABLE) ── */}
        <div className="p-5 md:p-6 pt-4 space-y-6 text-xs overflow-y-auto flex-1">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Agreed Area</span>
              <span className="font-mono font-bold text-slate-900 text-base">
                {agr.araziDismil} Dismil
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {agr.totalSqFt?.toLocaleString('en-IN')} Sq.Ft.
              </span>
            </div>

            <div>
              <span className="text-[10px] text-teal-700 block uppercase font-bold tracking-wider">Total Agreement Cost</span>
              <span className="font-mono font-bold text-teal-900 text-base">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Rate: ₹{(Number(agr.ratePerDismil) || 0).toLocaleString('en-IN')}/Dismil
              </span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-700 block uppercase font-bold tracking-wider">Farmer Payment Paid</span>
              <span className="font-mono font-bold text-emerald-800 text-base">
                ₹{totalPaid.toLocaleString('en-IN')}
              </span>
              <span className={`text-[10px] font-semibold block ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Due: ₹{balanceDue.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Agreement Validity</span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5">
                Start: {agr.agreementDate ? new Date(agr.agreementDate).toLocaleDateString('en-IN') : '—'}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold block">
                End: {agr.agreementEndDate ? new Date(agr.agreementEndDate).toLocaleDateString('en-IN') : 'Open / Unset'}
              </span>
            </div>
          </div>

          {agr.remarks && (
            <div className="p-3.5 bg-teal-50/50 border border-teal-200/70 rounded-xl text-slate-700">
              <strong className="text-teal-900 block text-[11px] font-bold mb-0.5">Agreement Remarks & Notes:</strong>
              <p className="text-slate-700 text-xs">{agr.remarks}</p>
            </div>
          )}

          {/* ── SECTION 1: DETAILED LAND & PLOT PARTICULARS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm uppercase tracking-wide">
                <Layers size={17} className="text-teal-700" />
                <span>Land & Plot Particulars (जमीन, खेसरा एवं जमाबंदी विवरण) ({parcels.length})</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold text-[11px] select-none">
                      <th className="py-3 px-3.5 w-10 text-center">#</th>
                      <th className="py-3 px-3.5">Mauja / Village</th>
                      <th className="py-3 px-3.5">Thana No.</th>
                      <th className="py-3 px-3.5">Jamabandi No.</th>
                      <th className="py-3 px-3.5">Khata No.</th>
                      <th className="py-3 px-3.5">Plot / Khesra No.</th>
                      <th className="py-3 px-3.5 min-w-[200px]">Chaudhi (चौहद्दी)</th>
                      <th className="py-3 px-3.5 text-right">Arazi Area</th>
                      <th className="py-3 px-3.5 text-right">Rate & Valuation</th>
                      <th className="py-3 px-3.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parcels.map((p, idx) => {
                      const parcelTotalSqFt = p.totalSqFt || (p.araziDismil ? Math.round(p.araziDismil * 435.6 * 100) / 100 : 0);
                      const ch = p.chaudhi || {};
                      const hasChaudhi = ch.north || ch.south || ch.east || ch.west;

                      return (
                        <tr key={p._id || idx} className="hover:bg-slate-50/80 transition">
                          {/* Row Index */}
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Mauja */}
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-slate-900 block text-xs">{p.mauja}</span>
                          </td>

                          {/* Thana Number */}
                          <td className="py-3 px-3.5 font-mono">
                            {p.thanaNumber ? (
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                                {p.thanaNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Jamabandi Number */}
                          <td className="py-3 px-3.5 font-mono">
                            {p.jamabandiNumber ? (
                              <span className="font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 inline-block">
                                {p.jamabandiNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </td>

                          {/* Khata Number */}
                          <td className="py-3 px-3.5 font-mono">
                            <strong className="text-slate-900">{p.khataNumber}</strong>
                          </td>

                          {/* Khesra / Plot Number */}
                          <td className="py-3 px-3.5 font-mono">
                            <span className="font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 inline-block">
                              {p.khesraNumber}
                            </span>
                          </td>

                          {/* Chaudhi (Boundaries) */}
                          <td className="py-3 px-3.5 text-[11px] text-slate-600">
                            {hasChaudhi ? (
                              <div className="space-y-0.5 bg-amber-50/60 p-2 rounded-xl border border-amber-200/70 text-[10px]">
                                {ch.north && <div><strong className="text-slate-700 font-semibold">उत्तर (N):</strong> {ch.north}</div>}
                                {ch.south && <div><strong className="text-slate-700 font-semibold">दक्षिण (S):</strong> {ch.south}</div>}
                                {ch.east && <div><strong className="text-slate-700 font-semibold">पूरब (E):</strong> {ch.east}</div>}
                                {ch.west && <div><strong className="text-slate-700 font-semibold">पश्चिम (W):</strong> {ch.west}</div>}
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">No boundaries specified</span>
                            )}
                          </td>

                          {/* Arazi Area */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <strong className="text-slate-900 text-xs block">{p.araziDismil} Dismil</strong>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {parcelTotalSqFt?.toLocaleString('en-IN')} Sq.Ft.
                            </span>
                          </td>

                          {/* Rate & Valuation */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <span className="text-slate-700 text-[11px] block">
                              ₹{(Number(p.ratePerDismil) || 0).toLocaleString('en-IN')} /Dismil
                            </span>
                            <strong className="text-emerald-800 text-xs block">
                              ₹{(Number(p.totalAmount) || 0).toLocaleString('en-IN')}
                            </strong>
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3.5 text-slate-500 text-[11px] max-w-xs">
                            {p.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: LAND OWNERS / SELLERS & PURCHASERS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Land Sellers (Kisans) */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <Users size={16} className="text-teal-700" />
                <span>Land Sellers / Farmers (क्रेता / ज़मीन मालिक) ({farmers.length})</span>
              </h4>
              <div className="space-y-2.5">
                {farmers.length === 0 ? (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic text-[11px]">
                    No farmer details linked.
                  </div>
                ) : (
                  farmers.map((f, i) => (
                    <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold text-xs">{f.name}</strong>
                        {f.sharePercent !== undefined && (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full font-bold text-[10px]">
                            {f.sharePercent}% Share
                          </span>
                        )}
                      </div>
                      {f.guardianName && (
                        <p className="text-slate-500 text-[11px]">
                          {f.relation || "Father"}: <strong className="text-slate-700">{f.guardianName}</strong>
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap pt-0.5">
                        {f.mobile && <span>📞 {f.mobile}</span>}
                        {f.aadhaarNumber && <span>Aadhaar: <strong>{f.aadhaarNumber}</strong></span>}
                        {f.panNumber && <span>PAN: <strong>{f.panNumber}</strong></span>}
                      </div>
                      {f.address && (
                        <p className="text-slate-400 text-[10px] pt-0.5 border-t border-slate-100">
                          🏠 Address: {f.address}
                        </p>
                      )}
                      {f.bankDetails && (f.bankDetails.accountNumber || f.bankDetails.bankName) && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                          <span className="font-bold text-slate-700 block">Bank Account:</span>
                          <div>A/C: <strong>{f.bankDetails.accountNumber || '—'}</strong> | IFSC: {f.bankDetails.ifscCode || '—'}</div>
                          <div>Bank: {f.bankDetails.bankName || '—'} {f.bankDetails.branch ? `(${f.bankDetails.branch})` : ''}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Purchasers (Company/Buyers) */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <UserCheck size={16} className="text-emerald-700" />
                <span>Purchasers / Buyers (क्रेता / ख़रीदार) ({purchasers.length})</span>
              </h4>
              <div className="space-y-2.5">
                {purchasers.map((p, i) => (
                  <div key={i} className="p-3.5 bg-emerald-50/30 border border-emerald-200/80 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold text-xs">{p.name}</strong>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px]">
                        Buyer #{i + 1}
                      </span>
                    </div>
                    {p.contact && (
                      <p className="text-slate-600 text-[11px]">
                        Contact: <strong className="text-slate-800">{p.contact || p.mobile}</strong>
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap pt-0.5">
                      {p.aadhaarNumber && <span>Aadhaar: <strong>{p.aadhaarNumber}</strong></span>}
                      {p.panNumber && <span>PAN: <strong>{p.panNumber}</strong></span>}
                    </div>
                    {p.address && (
                      <p className="text-slate-400 text-[10px] pt-0.5 border-t border-emerald-100">
                        🏠 Address: {p.address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION 3: CONVERTED REGISTRY DEEDS ── */}
          {registryDeeds.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <ShieldCheck size={16} className="text-purple-700" />
                <span>Registry Deeds Converted From This Agreement ({registryDeeds.length})</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Deed Number</th>
                      <th className="p-2.5">Deed Date</th>
                      <th className="p-2.5">SRO Office</th>
                      <th className="p-2.5 text-right">Registered Area</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                    {registryDeeds.map((d, idx) => (
                      <tr key={d._id || idx} className="hover:bg-purple-50/20">
                        <td className="p-2.5 font-mono font-bold text-purple-900">
                          {d.deedNumber}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {d.deedDate ? new Date(d.deedDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {d.subRegistrarOffice || '—'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-purple-950">
                          {d.registeredDismil} Dismil ({d.registeredSqFt?.toLocaleString('en-IN')} Sq.Ft.)
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[10px]">
                            {d.status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SECTION 4: DOCUMENTS & ATTACHMENTS ── */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Paperclip size={16} className="text-teal-700" />
              <span>Land Documents & Attachments ({attachments.length})</span>
            </h4>

            {attachments.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs italic">
                No documents attached to this agreement.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate text-xs">{att.fileName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {att.fileType || 'Document'}
                        </span>
                      </div>
                      {att.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{att.description}</p>
                      )}
                    </div>

                    {att.fileUrl && (
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer mt-2"
                      >
                        <span>View Document</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modalbox>
  );
};

export default KisanLedgersDrawer;
