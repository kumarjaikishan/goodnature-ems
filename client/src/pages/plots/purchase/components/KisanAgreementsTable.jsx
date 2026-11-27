import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePermission from '../../../../utils/CheckPermission';
import Select from '../../../../components/ui/Select';
import TablePagination from '../../../../components/common/TablePagination';
import {
  Search,
  RefreshCw,
  Calendar,
  ShieldCheck,
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
  projects = [],
  projectFilter = 'ALL',
  setProjectFilter,
  page = 1,
  setPage,
  limit = 10,
  setLimit,
  total = 0,
  fetchAgreements,
  openCreateDeedModal,
  loadAgreementDetails,
  openEditAgreement,
  handleDeleteAgreement,
}) => {
  const navigate = useNavigate();
  const canCreateDeed = usePermission(['plot_purchase', 'plot_inventory'], 2);
  const canUpdateAgreement = usePermission(['plot_purchase', 'plot_inventory'], 3);
  const canDeleteAgreement = usePermission(['plot_purchase', 'plot_inventory'], 4);

  return (
    <div className="space-y-4">
      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Mauja, Khata, Khesra, Kisan, Agr #..."
            className="h-10 w-full pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Project Filter */}
          <div className="w-[180px]">
            <Select
              size="sm"
              value={projectFilter}
              onChange={(e) => {
                if (setProjectFilter) setProjectFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Projects' },
                ...projects.map((proj) => ({
                  value: proj._id,
                  label: proj.name,
                })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="w-[180px]">
            <Select
              size="sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active / Pending Registry' },
                { value: 'PARTIALLY_REGISTERED', label: 'Partially Registered' },
                { value: 'FULLY_REGISTERED', label: 'Fully Registered' },
              ]}
            />
          </div>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              if (setProjectFilter) setProjectFilter('ALL');
              setPage(1);
              fetchAgreements();
            }}
            className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            title="Reset Filters"
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
                <th className="p-3.5 uppercase w-[110px]">Agreement No</th>
                <th className="p-3.5 uppercase min-w-[150px]">Project & Dates</th>
                <th className="p-3.5 uppercase">Land Particulars</th>
                <th className="p-3.5 uppercase w-[140px] max-w-[160px]">Land Seller</th>
                <th className="p-3.5 uppercase text-right w-[110px]">Agreed Area</th>
                <th className="p-3.5 uppercase text-right w-[130px]">Registered Area</th>
                <th className="p-3.5 uppercase text-left w-[195px] min-w-[185px] max-w-[205px]">Actions</th>
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
                        {attachmentsCount > 0 && (
                          <div className="mt-1">
                            <span
                              className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
                              title={`${attachmentsCount} Document attachment(s)`}
                            >
                              <Paperclip size={10} /> {attachmentsCount} files
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Project & Dates */}
                      <td className="p-3.5">
                        {agr.projectName ? (
                          <span className="font-semibold text-slate-800 text-xs block mb-0.5">
                            {agr.projectName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs block mb-0.5">—</span>
                        )}
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                            <Calendar size={11} className="text-teal-700 shrink-0" />
                            {new Date(agr.agreementDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {agr.agreementEndDate && (
                            <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                              End: {new Date(agr.agreementEndDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Land Particulars: Mauja, Thana, Khata, Khesra, Jamabandi */}
                      <td className="p-3.5">
                        {parcels && parcels.length > 1 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                <Layers size={11} /> {parcels.length} Land Details
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-800">
                              <span className="text-slate-500 font-normal text-[11px]">Mauja: </span>
                              {[...new Set(parcels.map((p) => p.mauja).filter(Boolean))].join(', ') || agr.mauja || '—'}
                              {([ ...new Set(parcels.map((p) => p.thanaNumber).filter(Boolean))].join(', ') || agr.thanaNumber) && (
                                <span className="text-[11px] font-normal text-slate-500 ml-1">
                                  (Thana: {[...new Set(parcels.map((p) => p.thanaNumber).filter(Boolean))].join(', ') || agr.thanaNumber})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-500">Khata: </span>
                              <strong>{[...new Set(parcels.map((p) => p.khataNumber).filter(Boolean))].join(', ') || agr.khataNumber || '—'}</strong>
                              <span className="text-slate-400 mx-1">|</span>
                              <span className="text-slate-500">Khesra: </span>
                              <strong className="text-purple-900">{[...new Set(parcels.map((p) => p.khesraNumber).filter(Boolean))].join(', ') || agr.khesraNumber || '—'}</strong>
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-teal-700 font-semibold">Jamabandi: </span>
                              <strong className="text-teal-900 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                {[...new Set(parcels.map((p) => p.jamabandiNumber).filter(Boolean))].join(', ') || agr.jamabandiNumber || '—'}
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-800">
                              <span className="text-slate-500 font-normal text-[11px]">Mauja: </span>
                              {parcels?.[0]?.mauja || agr.mauja || '—'}
                              {(parcels?.[0]?.thanaNumber || agr.thanaNumber) && (
                                <span className="text-[11px] font-normal text-slate-500 ml-1">
                                  (Thana: {parcels?.[0]?.thanaNumber || agr.thanaNumber})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-slate-500">Khata: </span>
                              <strong>{parcels?.[0]?.khataNumber || agr.khataNumber || '—'}</strong>
                              <span className="text-slate-400 mx-1">|</span>
                              <span className="text-slate-500">Khesra: </span>
                              <strong className="text-purple-900">{parcels?.[0]?.khesraNumber || agr.khesraNumber || '—'}</strong>
                            </div>
                            <div className="text-[11px] text-slate-700">
                              <span className="text-teal-700 font-semibold">Jamabandi: </span>
                              <strong className="text-teal-900 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                {parcels?.[0]?.jamabandiNumber || agr.jamabandiNumber || '—'}
                              </strong>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Land Seller (Buyers removed) */}
                      <td className="p-3.5 w-[150px] max-w-[170px]">
                        <div className="space-y-1">
                          {agr.farmers && agr.farmers.length > 0 ? (
                            <div>
                              <span
                                className="font-bold text-slate-800 block text-xs leading-snug break-words"
                                title={agr.farmers.map(f => f.name).filter(Boolean).join(', ')}
                              >
                                {agr.farmers[0].name ? agr.farmers[0].name.replace(/,([^\s])/g, ', $1') : ''}
                              </span>
                              {agr.farmers[0].mobile && (
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{agr.farmers[0].mobile}</span>
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
                        <span className="font-semibold text-slate-900 block">{regDismil} Dismil</span>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <div className="w-14 bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, regPercent)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium tabular-nums">{regPercent}%</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block tabular-nums mt-0.5">
                          ({agr.registryDeeds?.length || 0} Deed{agr.registryDeeds?.length === 1 ? '' : 's'})
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="w-[185px] space-y-1.5">
                          {/* Row 1: View, Deed, Ledger */}
                          <div className="flex items-center gap-1.5">
                            {/* 1. View Agreement Overview / Audit */}
                            <button
                              onClick={() => loadAgreementDetails(agr._id, 'overview')}
                              className="flex-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                              title="View Agreement Details, Land & Plot Details & Full Audit"
                            >
                              <Eye size={12} className="text-slate-500" /> View
                            </button>

                            {/* 2. Deed */}
                            {canCreateDeed && (
                              <button
                                onClick={() => openCreateDeedModal(agr)}
                                className="flex-1 px-2 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                                title="Create / Convert to Registry Deed from this agreement"
                              >
                                <ShieldCheck size={12} className="text-teal-700" /> Deed
                              </button>
                            )}

                            {/* 3. Kisan Ledger */}
                            <button
                              onClick={() => navigate(`/dashboard/plots/purchase/${agr._id}/ledger`)}
                              className="flex-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                              title="Open Kisan Financial Payment Ledger"
                            >
                              <FileText size={12} className="text-slate-500" /> Ledger
                            </button>
                          </div>

                          {/* Row 2: Edit, Delete */}
                          {(canUpdateAgreement || canDeleteAgreement) && (
                            <div className="flex items-center gap-1.5">
                              {/* 4. Edit Agreement */}
                              {canUpdateAgreement && (
                                <button
                                  onClick={() => openEditAgreement(agr)}
                                  className="flex-1 px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                                  title="Edit Land Agreement"
                                >
                                  <Edit3 size={12} className="text-amber-700" /> Edit
                                </button>
                              )}

                              {/* 5. Delete Agreement */}
                              {canDeleteAgreement && (
                                <button
                                  onClick={() => handleDeleteAgreement(agr)}
                                  className="flex-1 px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                                  title="Delete Agreement"
                                >
                                  <Trash2 size={12} className="text-rose-600" /> Del
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={page}
          totalItems={total}
          rowsPerPage={limit}
          onPageChange={setPage}
          onRowsPerPageChange={setLimit}
        />
      </div>
    </div>
  );
};

export default KisanAgreementsTable;
