import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Calendar,
  ShieldCheck,
  CreditCard,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Paperclip,
  Layers,
} from 'lucide-react';

const KisanAgreementsTable = ({
  agreements,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  setPage,
  fetchAgreements,
  openCreateDeedModal,
  openPaymentModal,
  loadAgreementDetails,
  openEditAgreement,
  handleDeleteAgreement,
}) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchAgreements();
          }}
          className="flex items-center gap-2 w-full sm:w-96"
        >
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Mauja, Khata, Khesra, Kisan, Agr #..."
              className="h-10 w-full pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active / Pending Registry</option>
            <option value="PARTIALLY_REGISTERED">Partially Registered</option>
            <option value="FULLY_REGISTERED">Fully Registered</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setPage(1);
              fetchAgreements();
            }}
            className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                <th className="p-3.5 uppercase">Agreement No & Date</th>
                <th className="p-3.5 uppercase">Land Particulars</th>
                <th className="p-3.5 uppercase">Land Seller</th>
                <th className="p-3.5 uppercase text-right">Agreed Area</th>
                <th className="p-3.5 uppercase text-right">Registered Area</th>
                <th className="p-3.5 uppercase text-right">Free Stock</th>
                <th className="p-3.5 uppercase text-left min-w-[210px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {agreements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No Plot Purchase Agreements found matching criteria. Click "+ New Plot Purchase" above to register one.
                  </td>
                </tr>
              ) : (
                agreements.map((agr) => {
                  const regDismil = agr.totalRegisteredDismil || 0;
                  const totalDismil = agr.araziDismil || 0;
                  const regPercent = totalDismil > 0 ? Math.round((regDismil / totalDismil) * 100) : 0;
                  const parcels = Array.isArray(agr.landParcels) && agr.landParcels.length > 0 ? agr.landParcels : null;
                  const attachmentsCount = Array.isArray(agr.attachments) ? agr.attachments.length : 0;

                  return (
                    <tr key={agr._id} className="hover:bg-slate-50/80 transition">
                      {/* Agreement No */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-teal-800 block text-xs">{agr.agreementNumber}</span>
                        <div className="space-y-0.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                            <Calendar size={11} className="text-teal-700" />
                            {new Date(agr.agreementDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {agr.agreementEndDate && (
                            <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60 w-fit">
                              End: {new Date(agr.agreementEndDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${agr.status === 'FULLY_REGISTERED'
                              ? 'bg-purple-100 text-purple-800'
                              : agr.status === 'PARTIALLY_REGISTERED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                              }`}
                          >
                            {agr.status?.replace('_', ' ')}
                          </span>
                          {attachmentsCount > 0 && (
                            <span
                              className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                              title={`${attachmentsCount} Document attachment(s)`}
                            >
                              <Paperclip size={10} /> {attachmentsCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Land Particulars: Thana, then Mauja, then Jamabandi only */}
                      <td className="p-3.5">
                        {parcels && parcels.length > 1 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                <Layers size={11} /> {parcels.length} Land Details
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-500">Thana: </span>
                              <strong>{[...new Set(parcels.map((p) => p.thanaNumber).filter(Boolean))].join(', ') || agr.thanaNumber || '—'}</strong>
                            </div>
                            <div className="text-xs font-bold text-slate-800">
                              <span className="text-slate-500 font-normal text-[11px]">Mauja: </span>
                              {[...new Set(parcels.map((p) => p.mauja).filter(Boolean))].join(', ') || '—'}
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-500">Jamabandi: </span>
                              <strong>{[...new Set(parcels.map((p) => p.jamabandiNumber).filter(Boolean))].join(', ') || agr.jamabandiNumber || '—'}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-500">Thana: </span>
                              <strong>{parcels?.[0]?.thanaNumber || agr.thanaNumber || '—'}</strong>
                            </div>
                            <div className="text-xs font-bold text-slate-800">
                              <span className="text-slate-500 font-normal text-[11px]">Mauja: </span>
                              {parcels?.[0]?.mauja || agr.mauja || '—'}
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-500">Jamabandi: </span>
                              <strong>{parcels?.[0]?.jamabandiNumber || agr.jamabandiNumber || '—'}</strong>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Land Seller (Buyers removed) */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {agr.farmers && agr.farmers.length > 0 ? (
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{agr.farmers[0].name}</span>
                              {agr.farmers[0].mobile && (
                                <span className="text-[10px] text-slate-400 block">{agr.farmers[0].mobile}</span>
                              )}
                              {agr.farmers.length > 1 && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                  +{agr.farmers.length - 1} more seller(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Agreed Area */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-slate-900 block">{agr.araziDismil} Dismil</span>
                        <span className="text-[10px] text-slate-400 block">
                          {agr.totalSqFt?.toLocaleString('en-IN')} SqFt
                        </span>
                      </td>

                      {/* Registered Area */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-purple-700 block">{regDismil} Dismil</span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, regPercent)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-purple-600 font-bold">{regPercent}%</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block">
                          ({agr.registryDeeds?.length || 0} Deed{agr.registryDeeds?.length === 1 ? '' : 's'})
                        </span>
                      </td>

                      {/* Available Free Stock */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-emerald-700 block">
                          {((agr.totalAvailableSqFt || 0) / 435.6).toFixed(2)} Dismil
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {agr.totalAvailableSqFt?.toLocaleString('en-IN')} SqFt free
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1.5 items-start">
                          {/* Row 1: Primary Viewing & Financial Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 1. View Agreement Overview / Audit */}
                            <button
                              onClick={() => loadAgreementDetails(agr._id, 'overview')}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="View Agreement Details, Land & Plot Details & Full Audit"
                            >
                              <Eye size={12} /> View
                            </button>

                            {/* 2. + Deed */}
                            <button
                              onClick={() => openCreateDeedModal(agr)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Create / Convert to Registry Deed from this agreement"
                            >
                              <ShieldCheck size={12} /> + Deed
                            </button>

                            {/* 3. Pay Kisan */}
                            <button
                              onClick={() => openPaymentModal(agr)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Record payment to Kisan"
                            >
                              <CreditCard size={12} /> Pay
                            </button>
                          </div>

                          {/* Row 2: Management & Ledger Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 4. Kisan Ledger */}
                            <button
                              onClick={() => navigate(`/dashboard/plots/purchase/${agr._id}/ledger`)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Open Kisan Financial Payment Ledger"
                            >
                              <FileText size={12} /> Ledger
                            </button>

                            {/* 5. Edit Agreement */}
                            <button
                              onClick={() => openEditAgreement(agr)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Edit Land Agreement"
                            >
                              <Edit3 size={12} /> Edit
                            </button>

                            {/* 6. Delete Agreement */}
                            <button
                              onClick={() => handleDeleteAgreement(agr)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Delete Agreement"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KisanAgreementsTable;
