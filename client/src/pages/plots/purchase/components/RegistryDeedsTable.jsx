import React from 'react';
import { Search, Calendar, Eye, Edit3, Trash2 } from 'lucide-react';

const RegistryDeedsTable = ({
  filteredDeeds,
  allRegistryDeeds,
  deedSearch,
  setDeedSearch,
  loadAgreementDetails,
  onViewDeed,
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
                <th className="p-3.5 uppercase text-right">Registered Area</th>
                <th className="p-3.5 uppercase text-left min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDeeds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                    No Registry Deeds found. Convert agreements into official registry deeds in the Agreements tab.
                  </td>
                </tr>
              ) : (
                filteredDeeds.map((deed) => {
                  return (
                    <tr key={deed._id} className="hover:bg-purple-50/30 transition">
                      {/* Deed Number with Parent Agreement: agr001/deed002 format */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => onViewDeed && onViewDeed(deed)}
                          className="font-mono font-bold text-purple-900 hover:underline block text-xs cursor-pointer text-left"
                          title="Click to view deed particulars"
                        >
                          {deed.deedNumber?.includes('/')
                            ? deed.deedNumber
                            : deed.parentAgreementNumber
                            ? `${deed.parentAgreementNumber}/${deed.deedNumber}`
                            : deed.deedNumber}
                        </button>
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
                          onClick={() => loadAgreementDetails(deed.parentAgreementId, 'overview')}
                          className="font-mono font-bold text-teal-800 hover:underline block text-xs cursor-pointer"
                          title="Preview Agreement Details"
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

                      {/* Registered Area */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-purple-950 block">{deed.registeredDismil} Dismil</span>
                        <span className="text-[10px] text-slate-400">
                          {deed.registeredSqFt?.toLocaleString('en-IN')} SqFt
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* View Deed Particulars */}
                          <button
                            onClick={() => onViewDeed && onViewDeed(deed)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="View Registry Deed Particulars & Land Details"
                          >
                            <Eye size={12} /> View
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
