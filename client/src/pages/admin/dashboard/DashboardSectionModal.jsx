import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Landmark,
  Layers,
  Briefcase
} from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import PageLoader from '../../../components/common/PageLoader';
import dayjs from 'dayjs';

const fmt = (n) =>
  typeof n === 'number'
    ? '\u20B9' + Math.round(n).toLocaleString('en-IN')
    : '\u20B90';

const SECTION_METAS = {
  income: {
    title: '1. Total Income Details',
    icon: TrendingUp,
    color: 'emerald',
    subFilterOptions: [
      { id: 'all', label: 'All Income' },
      { id: 'down_payment', label: 'Down Payment' },
      { id: 'emi', label: 'EMI Payment' },
      { id: 'voucher_receipt', label: 'Voucher Receipt' },
    ]
  },
  expense: {
    title: '2. Total Expense Details',
    icon: TrendingDown,
    color: 'rose',
    subFilterOptions: [
      { id: 'all', label: 'All Expenses' },
      { id: 'salary', label: 'Salary' },
      { id: 'voucher_expense', label: 'Voucher Expense' },
      { id: 'incentive', label: 'Incentive Payment' },
      { id: 'refund', label: 'Customer Refund' },
      { id: 'seller_payment', label: 'Seller Payment' },
    ]
  },
  customers: {
    title: '3. All Customers',
    icon: Users,
    color: 'teal',
    subFilterOptions: [
      { id: 'all', label: 'All Plans' },
      { id: 'FULL_PAYMENT', label: 'Full Payment' },
      { id: 'MONTHLY_INSTALLMENT', label: 'Monthly EMI' },
      { id: 'PLOT_PRODUCT', label: 'Plot Products' },
    ]
  },
  promoters: {
    title: '4. All Promoters',
    icon: Award,
    color: 'amber',
    subFilterOptions: [
      { id: 'all', label: 'All Ranks' },
      { id: 'partner', label: 'Business Partners' },
      { id: 'associate', label: 'Business Associates' },
    ]
  },
  ledger: {
    title: '5. Account Ledger Details',
    icon: Landmark,
    color: 'sky',
    subFilterOptions: [
      { id: 'all', label: 'All Ledgers' },
    ]
  },
  sellers: {
    title: '6. All Sellers (Kisan Land)',
    icon: Layers,
    color: 'violet',
    subFilterOptions: [
      { id: 'all', label: 'All Sellers' },
    ]
  },
  employees: {
    title: '14. All Employees',
    icon: Briefcase,
    color: 'slate',
    subFilterOptions: [
      { id: 'all', label: 'All Branches' },
    ]
  }
};

export const DashboardSectionModal = ({
  isOpen,
  onClose,
  section,
  initialSubFilter = 'all',
  globalFilters = {}
}) => {
  const [subFilter, setSubFilter] = useState(initialSubFilter);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState(null);

  useEffect(() => {
    setSubFilter(initialSubFilter || 'all');
    setPage(1);
    setSearch('');
  }, [section, initialSubFilter]);

  const meta = SECTION_METAS[section] || SECTION_METAS.income;
  const Icon = meta.icon;

  const fetchData = useCallback(async () => {
    if (!isOpen || !section) return;
    setLoading(true);
    try {
      const res = await apiClient({
        url: 'dashboard/section-details',
        params: {
          section,
          subFilter,
          search,
          page,
          limit: 12,
          filterType: globalFilters.filterType,
          date: globalFilters.date,
          financialYear: globalFilters.financialYear,
          month: globalFilters.month,
          startDate: globalFilters.startDate,
          endDate: globalFilters.endDate,
          branchId: globalFilters.branchId,
        }
      });
      if (res && res.data) {
        setSectionData(res.data);
      }
    } catch (err) {
      console.error('Error fetching section details:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, section, subFilter, search, page, globalFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isOpen) return null;

  const records = sectionData?.records || [];
  const pagination = sectionData?.pagination || { page: 1, limit: 12, total: 0 };
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800">
              <Icon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                {meta.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {globalFilters.dateLabel || 'Filtered view'} &middot; {pagination.total} records found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Sub-Filter Tabs */}
            {meta.subFilterOptions && meta.subFilterOptions.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {meta.subFilterOptions.map((opt) => {
                  const active = subFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSubFilter(opt.id);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  section === 'sellers'
                    ? 'Search by Plot No (Khesra)...'
                    : section === 'promoters'
                    ? 'Search by Rank, Name, Code...'
                    : section === 'ledger'
                    ? 'Search by Bank Name...'
                    : 'Search records...'
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {loading ? (
            <div className="py-12 flex justify-center">
              <PageLoader
                title="Loading Details..."
                subtitle="Aggregating records matching selected criteria"
                fullScreen={false}
              />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Filter size={22} />
              </div>
              <p className="text-sm font-bold text-slate-700">No records found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No data exists for this specific filter and period combination. Try adjusting your range or search terms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    {section === 'income' && (
                      <>
                        <th className="p-3">Receipt / Voucher #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Branch</th>
                        <th className="p-3">Created By</th>
                        <th className="p-3 text-right">Amount</th>
                      </>
                    )}
                    {section === 'expense' && (
                      <>
                        <th className="p-3">Reference / #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Beneficiary / Dept</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Amount</th>
                      </>
                    )}
                    {section === 'customers' && (
                      <>
                        <th className="p-3">Customer ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">Plan / Scheme</th>
                        <th className="p-3">Plot #</th>
                        <th className="p-3 text-right">Value</th>
                      </>
                    )}
                    {section === 'promoters' && (
                      <>
                        <th className="p-3">Code</th>
                        <th className="p-3">Promoter Name</th>
                        <th className="p-3">Rank / Role</th>
                        <th className="p-3">Parent Promoter</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">Comm Rate</th>
                      </>
                    )}
                    {section === 'ledger' && (
                      <>
                        <th className="p-3">Account Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Bank Name</th>
                        <th className="p-3">Account #</th>
                        <th className="p-3 text-right">Period Debit</th>
                        <th className="p-3 text-right">Period Credit</th>
                        <th className="p-3 text-right">Balance</th>
                      </>
                    )}
                    {section === 'sellers' && (
                      <>
                        <th className="p-3">Agreement #</th>
                        <th className="p-3">Seller Name</th>
                        <th className="p-3">Plot No (Khesra)</th>
                        <th className="p-3">Mauja / Khata</th>
                        <th className="p-3">Area (Dismil)</th>
                        <th className="p-3 text-right">Agreed Value</th>
                        <th className="p-3 text-right">Total Paid</th>
                      </>
                    )}
                    {section === 'employees' && (
                      <>
                        <th className="p-3">Emp ID</th>
                        <th className="p-3">Employee Name</th>
                        <th className="p-3">Branch</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3">Phone</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r, idx) => (
                    <tr key={r._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {section === 'income' && (
                        <>
                          <td className="p-3 font-mono font-bold text-teal-800">
                            {r.receiptNumber || r.voucherNo || '—'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {dayjs(r.createdAt || r.date).format('DD MMM YYYY')}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {r.receiptType || 'VOUCHER'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{r.branchId?.name || '—'}</td>
                          <td className="p-3 text-slate-600">{r.createdBy?.name || 'System'}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {fmt(r.amount || r.totalAmount)}
                          </td>
                        </>
                      )}

                      {section === 'expense' && (
                        <>
                          <td className="p-3 font-mono font-bold text-rose-800">
                            {r.voucherNo || r.voucherNumber || r.bookingNumber || `SAL-${r.month}/${r.year}`}
                          </td>
                          <td className="p-3 text-slate-600">
                            {dayjs(r.date || r.payoutDate || r.updatedAt || r.createdAt).format('DD MMM YYYY')}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {r.type || (r.netSalary ? 'SALARY' : r.amountPaid ? 'INCENTIVE' : 'EXPENSE')}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">
                            {r.employeeId?.name || r.customerId?.name || r.branchId?.name || '—'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              {r.status || 'PAID'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700">
                            {fmt(r.netSalary || r.totalAmount || r.amountPaid || r.debit || r.bookingAmount)}
                          </td>
                        </>
                      )}

                      {section === 'customers' && (
                        <>
                          <td className="p-3 font-mono font-bold text-teal-800">
                            {r.customerId?.customerId || '—'}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {r.customerId?.name || '—'}
                          </td>
                          <td className="p-3 text-slate-600">{r.customerId?.mobile || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              {r.scheme || 'PLOT PRODUCT'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {r.plotId?.plotNumber || r.productName || '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {fmt(r.plotValue || r.totalAmount)}
                          </td>
                        </>
                      )}

                      {section === 'promoters' && (
                        <>
                          <td className="p-3 font-mono font-bold text-amber-800">
                            {r.sponsorCode || '—'}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{r.name}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                r.sponsorId
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-teal-900 text-teal-100'
                              }`}
                            >
                              {r.sponsorId ? 'Business Associate' : 'Business Partner'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{r.sponsorId?.name || 'Direct'}</td>
                          <td className="p-3 text-slate-600">{r.mobile || '—'}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {r.commissionRate ? `${r.commissionRate}%` : '—'}
                          </td>
                        </>
                      )}

                      {section === 'ledger' && (
                        <>
                          <td className="p-3 font-semibold text-slate-800">{r.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                              {r.ledgerType}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{r.bankName || 'Cash In Hand'}</td>
                          <td className="p-3 font-mono text-slate-600">{r.accountNumber || '—'}</td>
                          <td className="p-3 text-right font-mono text-rose-600">
                            {fmt(r.periodDebit || 0)}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-600">
                            {fmt(r.periodCredit || 0)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {fmt(r.currentBalance || r.advance)}
                          </td>
                        </>
                      )}

                      {section === 'sellers' && (
                        <>
                          <td className="p-3 font-mono font-bold text-purple-800">
                            {r.agreementNumber || '—'}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{r.sellerName}</td>
                          <td className="p-3 font-mono font-bold text-teal-800">
                            {r.plotNumbers}
                          </td>
                          <td className="p-3 text-slate-600">
                            Mauja: {r.mauja} | Khata: {r.khataNumber}
                          </td>
                          <td className="p-3 font-mono text-slate-700">{r.totalAreaDismil}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {fmt(r.agreementValue)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {fmt(r.totalPaid)}
                          </td>
                        </>
                      )}

                      {section === 'employees' && (
                        <>
                          <td className="p-3 font-mono font-bold text-slate-800">{r.empId}</td>
                          <td className="p-3 font-semibold text-slate-800">{r.name}</td>
                          <td className="p-3 text-slate-600">{r.branchName}</td>
                          <td className="p-3 text-slate-600">{r.department}</td>
                          <td className="p-3 text-slate-600">{r.designation}</td>
                          <td className="p-3 text-slate-600">{r.phone || '—'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Page {pagination.page} of {totalPages} &middot; Showing {records.length} items
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
