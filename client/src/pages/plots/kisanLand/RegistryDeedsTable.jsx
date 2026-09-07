import React from 'react';
import { Search, Calendar, Eye, Edit3, Trash2 } from 'lucide-react';

const RegistryDeedsTable = ({
  filteredDeeds,
  allRegistryDeeds,
  deedSearch,
  setDeedSearch,
  loadAgreementDetails,
  openEditDeedModal,
  handleDeleteDeed,
}) => {
  return (
    <div className="space-y-4">
      {/* Deeds Filter / Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Deed #, Mauja, Khata, Khesra, SRO, Farmer..."
            className="h-10 w-full pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
            value={deedSearch}
            onChange={(e) => setDeedSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <span>
            Showing {filteredDeeds.length} of {allRegistryDeeds.length} deeds
          </span>
          {deedSearch && (
            <button
              onClick={() => setDeedSearch('')}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Registry Deeds Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                <th className="p-3.5 uppercase">Deed Number & Date</th>
                <th className="p-3.5 uppercase">Parent Agreement</th>
                <th className="p-3.5 uppercase">Land Location</th>
                <th className="p-3.5 uppercase">Sub-Registrar Office</th>
                <th className="p-3.5 uppercase text-right">Registered Area</th>
                <th className="p-3.5 uppercase text-right">Allocated Area</th>
                <th className="p-3.5 uppercase text-right">Available Free Stock</th>
                <th className="p-3.5 uppercase text-center">Status</th>
                <th className="p-3.5 uppercase text-left min-w-[240px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDeeds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    No Registry Deeds found. Convert agreements into official registry deeds in the Agreements tab.
                  </td>
                </tr>
              ) : (
                filteredDeeds.map((deed) => {
                  const avail = deed.availableSqFt || 0;
                  const isExhausted = avail <= 0;
                  const isPartial = (deed.allocatedSqFt || 0) > 0 && avail > 0;

                  return (
                    <tr key={deed._id} className="hover:bg-purple-50/30 transition">
                      {/* Deed Number */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-purple-900 block text-xs">{deed.deedNumber}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {new Date(deed.deedDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Parent Agreement */}
                      <td className="p-3.5">
                        <button
                          onClick={() => loadAgreementDetails(deed.parentAgreementId, 'deeds')}
                          className="font-mono font-bold text-teal-800 hover:underline block text-xs cursor-pointer"
                        >
                          {deed.parentAgreementNumber}
                        </button>
                        <span className="text-[10px] text-slate-400 block">
                          {deed.farmers?.[0]?.name || 'Farmer'}
                        </span>
                      </td>

                      {/* Land Location */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">Mauja: {deed.mauja}</span>
                        <span className="text-[11px] text-slate-500 block">
                          Khata: {deed.khataNumber} | Khesra: <strong>{deed.khesraNumber}</strong>
                        </span>
                      </td>

                      {/* SRO Office */}
                      <td className="p-3.5 text-slate-700">
                        {deed.subRegistrarOffice || <span className="text-slate-400 italic">Not Specified</span>}
                      </td>

                      {/* Registered Area */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-slate-900 block">{deed.registeredDismil} Dismil</span>
                        <span className="text-[10px] text-slate-400">
                          {deed.registeredSqFt?.toLocaleString('en-IN')} SqFt
                        </span>
                      </td>

                      {/* Allocated Area */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-amber-700 block">
                          {(deed.allocatedSqFt || 0).toLocaleString('en-IN')} SqFt
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(((deed.allocatedSqFt || 0) / 435.6) || 0).toFixed(2)} Dismil
                        </span>
                      </td>

                      {/* Available Free Stock */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-emerald-700 block">
                          {(deed.availableSqFt || 0).toLocaleString('en-IN')} SqFt
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(((deed.availableSqFt || 0) / 435.6) || 0).toFixed(2)} Dismil
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isExhausted
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : isPartial
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isExhausted ? 'Exhausted' : isPartial ? 'Partially Booked' : 'Available'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* View Ledgers */}
                          <button
                            onClick={() => loadAgreementDetails(deed.parentAgreementId, 'deeds')}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="View Parent Ledgers"
                          >
                            <Eye size={12} /> Ledgers
                          </button>

                          {/* Edit Deed */}
                          <button
                            onClick={() => openEditDeedModal(deed.parentAgreementId, deed)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="Edit Deed Details"
                          >
                            <Edit3 size={12} /> Edit
                          </button>

                          {/* Delete Deed */}
                          <button
                            onClick={() => handleDeleteDeed(deed.parentAgreementId, deed)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="Delete Deed & Restore Stock"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
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

export default RegistryDeedsTable;
