import React from 'react';
import {
  Paperclip,
  ExternalLink,
  Layers,
  Users,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';

const KisanLedgersDrawer = ({
  open,
  onClose,
  detailData,
}) => {
  if (!detailData) return null;

  const agr = detailData.agreement || {};
  const parcels = Array.isArray(agr.landParcels) && agr.landParcels.length > 0
    ? agr.landParcels
    : [
        {
          mauja: agr.mauja || '—',
          khataNumber: agr.khataNumber || '—',
          khesraNumber: agr.khesraNumber || '—',
          thanaNumber: agr.thanaNumber || '—',
          jamabandiNumber: agr.jamabandiNumber || '—',
          chaudhi: agr.chaudhi || { north: '', south: '', east: '', west: '' },
          araziDismil: agr.araziDismil || 0,
          totalSqFt: agr.totalSqFt || 0,
          ratePerDismil: agr.ratePerDismil || 0,
          totalAmount: agr.totalAgreementAmount || 0,
        },
      ];

  const attachments = Array.isArray(agr.attachments) ? agr.attachments : [];
  const purchasers = Array.isArray(agr.purchasers) && agr.purchasers.length > 0
    ? agr.purchasers
    : [{ name: 'Good Nature Developers Pvt Ltd' }];

  return (
    <Modalbox open={open} onClose={onClose} outside={true}>
      <div className="bg-white rounded-3xl p-5 md:p-6 max-w-5xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-teal-900">
                #{agr.agreementNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  agr.status === 'FULLY_REGISTERED'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : agr.status === 'PARTIALLY_REGISTERED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {agr.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Agreement Date:{' '}
              <strong className="text-slate-700 font-semibold">
                {agr.agreementDate ? new Date(agr.agreementDate).toLocaleDateString('en-IN') : '—'}
              </strong>
              {agr.agreementEndDate && (
                <span>
                  {' '}• End Date:{' '}
                  <strong className="text-amber-700 font-semibold">
                    {new Date(agr.agreementEndDate).toLocaleDateString('en-IN')}
                  </strong>
                </span>
              )}
              {' '}• Total Parcels: <strong className="text-teal-800">{parcels.length} Plot(s)</strong> • Total Area:{' '}
              <strong className="text-slate-800">{agr.araziDismil} Dismil ({agr.totalSqFt?.toLocaleString('en-IN')} Sq.Ft.)</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer text-base self-end sm:self-center"
          >
            ✕
          </button>
        </div>

        {/* ── AGREEMENT DETAILS BODY ── */}
        <div className="space-y-5 text-xs">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Agreed Area</span>
              <span className="font-bold text-slate-800 text-sm">
                {agr.araziDismil} Dismil
              </span>
              <span className="text-[10px] text-slate-400 block">
                {agr.totalSqFt?.toLocaleString('en-IN')} SqFt
              </span>
            </div>
            <div>
              <span className="text-[10px] text-teal-700 block uppercase font-bold">Total Agreement Cost</span>
              <span className="font-bold text-teal-800 text-sm">
                ₹{(Number(agr.totalAgreementAmount) || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Avg Rate: ₹{(Number(agr.ratePerDismil) || 0).toLocaleString('en-IN')}/Dismil
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Land Parcels</span>
              <span className="font-bold text-slate-800 text-sm">
                {parcels.length} Parcel / Plot(s)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Agreement Dates</span>
              <span className="font-bold text-slate-800 text-xs block">
                Start: {agr.agreementDate ? new Date(agr.agreementDate).toLocaleDateString('en-IN') : '—'}
              </span>
              {agr.agreementEndDate && (
                <span className="font-semibold text-amber-700 text-xs block">
                  End: {new Date(agr.agreementEndDate).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {agr.remarks && (
            <div className="p-3 bg-teal-50/50 border border-teal-200/60 rounded-xl text-slate-700">
              <strong className="text-teal-900 block text-[11px] mb-0.5">Agreement Remarks / Notes:</strong>
              {agr.remarks}
            </div>
          )}

          {/* Section 1: Multi-Parcel Land Particulars */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Layers size={16} className="text-teal-700" />
              <span>Land Parcels & Plot Particulars ({parcels.length})</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Mauja & Thana</th>
                      <th className="py-2.5 px-3">Khata & Khesra</th>
                      <th className="py-2.5 px-3">Chaudhi (चौहद्दी)</th>
                      <th className="py-2.5 px-3 text-right">Arazi (Dismil)</th>
                      <th className="py-2.5 px-3 text-right">Rate / Dismil</th>
                      <th className="py-2.5 px-3 text-right">Total Cost</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parcels.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {p.mauja}
                          {p.thanaNumber && (
                            <span className="text-[10px] text-slate-400 font-normal block">
                              Thana: {p.thanaNumber}
                            </span>
                          )}
                          {p.jamabandiNumber && (
                            <span className="text-[10px] text-slate-400 font-normal block">
                              JB: {p.jamabandiNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          Khata: <strong>{p.khataNumber}</strong>
                          <span className="block text-teal-800 font-bold">Khesra: {p.khesraNumber}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[10px] text-slate-600 max-w-xs">
                          {p.chaudhi && Object.values(p.chaudhi).some(Boolean) ? (
                            <div className="space-y-0.5 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/60">
                              {p.chaudhi.north && <div>N: {p.chaudhi.north}</div>}
                              {p.chaudhi.south && <div>S: {p.chaudhi.south}</div>}
                              {p.chaudhi.east && <div>E: {p.chaudhi.east}</div>}
                              {p.chaudhi.west && <div>W: {p.chaudhi.west}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">No chaudhi specified</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {p.araziDismil} Dismil
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {p.totalSqFt?.toLocaleString('en-IN')} SqFt
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ₹{(Number(p.ratePerDismil) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          ₹{(Number(p.totalAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {p.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Associated Land Owners / Sellers (Kisans) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Users size={16} className="text-teal-700" />
              <span>Associated Land Owners / Sellers (Kisans) ({agr.farmers?.length || 0})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agr.farmers?.map((f, i) => (
                <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 block text-sm">{f.name}</span>
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full font-bold text-[10px]">
                      {f.sharePercent}% Share
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Guardian: {f.guardianName || '—'}</p>
                  <p className="text-slate-500 text-[11px]">Mobile: {f.mobile || '—'}</p>
                  <p className="text-slate-500 text-[11px]">
                    Aadhaar: {f.aadhaarNumber || '—'} | PAN: {f.panNumber || '—'}
                  </p>
                  {f.address && <p className="text-slate-400 text-[10px]">Address: {f.address}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Purchasers / Buyers */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <UserCheck size={16} className="text-emerald-700" />
              <span>Purchasers / Buyers (क्रेता / ख़रीदार) ({purchasers.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {purchasers.map((p, i) => (
                <div key={i} className="p-3.5 bg-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 block text-sm">{p.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px]">
                      Buyer #{i + 1}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Contact: <strong className="text-slate-800">{p.contact || p.mobile || '—'}</strong>
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Aadhaar: <strong className="text-slate-800">{p.aadhaarNumber || '—'}</strong>
                    {p.panNumber && <span> | PAN: <strong className="text-slate-800">{p.panNumber}</strong></span>}
                  </p>
                  {p.address && <p className="text-slate-400 text-[10px]">Address: {p.address}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Land Documents & Attachments */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Paperclip size={16} className="text-teal-700" />
              <span>Land Documents & Attachments ({attachments.length})</span>
            </div>

            {attachments.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs italic">
                No documents attached to this agreement.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 flex flex-col justify-between"
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
      </div>
    </Modalbox>
  );
};

export default KisanLedgersDrawer;
