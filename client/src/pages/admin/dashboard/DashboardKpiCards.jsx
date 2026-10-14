import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Landmark,
  Layers,
  Briefcase,
  ChevronRight,
  Filter
} from 'lucide-react';

const fmt = (n) =>
  typeof n === 'number'
    ? '\u20B9' + Math.round(n).toLocaleString('en-IN')
    : '\u20B90';

const fmtNum = (n) =>
  typeof n === 'number' ? n.toLocaleString('en-IN') : '0';

export const DashboardKpiCards = ({
  kpiData = {},
  onSelectSection,
  activeSection,
  roleScope = {}
}) => {
  const {
    totalIncome = 0,
    incomeBreakdown = {},
    totalExpense = 0,
    expenseBreakdown = {},
    customers = {},
    promoters = {},
    liquidLedger = {},
    sellers = {},
    employees = {}
  } = kpiData;

  const cards = [
    // 1. Total Income
    {
      id: 'income',
      title: '1. Total Income',
      value: fmt(totalIncome),
      subtext: 'Revenue from plot bookings & collections',
      icon: TrendingUp,
      color: 'emerald',
      borderColor: 'hover:border-emerald-500',
      tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      subFilters: [
        { id: 'down_payment', label: 'Down Payment', value: fmt(incomeBreakdown.downPayment?.amount) },
        { id: 'emi', label: 'EMI Payment', value: fmt(incomeBreakdown.emiPayment?.amount) },
        { id: 'voucher_receipt', label: 'Voucher Receipt', value: fmt(incomeBreakdown.voucherReceipt?.amount) },
      ]
    },

    // 2. Total Expense
    {
      id: 'expense',
      title: '2. Total Expense',
      value: fmt(totalExpense),
      subtext: 'Operating, salary & seller disbursements',
      icon: TrendingDown,
      color: 'rose',
      borderColor: 'hover:border-rose-500',
      tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
      subFilters: [
        { id: 'salary', label: 'Salary', value: fmt(expenseBreakdown.salary?.amount) },
        { id: 'voucher_expense', label: 'Voucher Expense', value: fmt(expenseBreakdown.voucherExpense?.amount) },
        { id: 'incentive', label: 'Incentives', value: fmt(expenseBreakdown.incentivePayment?.amount) },
        { id: 'refund', label: 'Refunds', value: fmt(expenseBreakdown.customerRefund?.amount) },
        { id: 'seller_payment', label: 'Seller Pay', value: fmt(expenseBreakdown.sellerPayment?.amount) },
      ]
    },

    // 3. All Customer
    {
      id: 'customers',
      title: '3. All Customer',
      value: `${fmtNum(customers.total)} Customers`,
      subtext: 'Active bookings across all schemes',
      icon: Users,
      color: 'teal',
      borderColor: 'hover:border-teal-500',
      tagColor: 'bg-teal-50 text-teal-800 border-teal-200',
      subFilters: [
        { id: 'FULL_PAYMENT', label: 'Full Payment', value: fmtNum(customers.FULL_PAYMENT) },
        { id: 'MONTHLY_INSTALLMENT', label: 'EMI Plan', value: fmtNum(customers.MONTHLY_INSTALLMENT) },
        { id: 'PLOT_PRODUCT', label: 'Plot Product', value: fmtNum(customers.PLOT_PRODUCT) },
      ]
    },

    // 4. All Promoters
    {
      id: 'promoters',
      title: '4. All Promoters',
      value: `${fmtNum(promoters.total)} Promoters`,
      subtext: 'Business partners & associates network',
      icon: Award,
      color: 'amber',
      borderColor: 'hover:border-amber-500',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      subFilters: [
        { id: 'partner', label: 'Partners', value: fmtNum(promoters.partner) },
        { id: 'associate', label: 'Associates', value: fmtNum(promoters.associate) },
      ]
    },

    // 5. Account Ledger
    {
      id: 'ledger',
      title: '5. Account Ledger',
      value: fmt(liquidLedger.totalLiquidBalance),
      subtext: `${fmtNum(liquidLedger.totalAccounts)} Bank & Cash Accounts`,
      icon: Landmark,
      color: 'sky',
      borderColor: 'hover:border-sky-500',
      tagColor: 'bg-sky-50 text-sky-800 border-sky-200',
      subFilters: [
        { id: 'all', label: 'All Banks', value: `${fmtNum(liquidLedger.totalAccounts)} Acc` },
      ]
    },

    // 6. All Seller
    {
      id: 'sellers',
      title: '6. All Seller',
      value: `${fmtNum(sellers.totalSellers)} Sellers`,
      subtext: `${fmtNum(sellers.totalAgreements)} Land Agreements`,
      icon: Layers,
      color: 'violet',
      borderColor: 'hover:border-violet-500',
      tagColor: 'bg-violet-50 text-violet-800 border-violet-200',
      subFilters: [
        { id: 'all', label: 'Filter by Plot No', value: `${fmtNum(sellers.totalAgreements)} Land Parcels` },
      ]
    },

    // 14. All Employee
    {
      id: 'employees',
      title: '14. All Employee',
      value: `${fmtNum(employees.totalEmployees)} Employees`,
      subtext: 'Staff & management across branches',
      icon: Briefcase,
      color: 'slate',
      borderColor: 'hover:border-slate-500',
      tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
      subFilters: [
        { id: 'all', label: 'Filter by Branch', value: `${fmtNum(employees.branchStats?.length || 0)} Branches` },
      ]
    },
  ];

  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100/70 text-emerald-800',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ring: 'ring-emerald-200',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100/70 text-rose-800',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      ring: 'ring-rose-200',
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      iconBg: 'bg-teal-100/70 text-teal-800',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      ring: 'ring-teal-200',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100/70 text-amber-800',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      ring: 'ring-amber-200',
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      iconBg: 'bg-sky-100/70 text-sky-800',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      ring: 'ring-sky-200',
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      iconBg: 'bg-violet-100/70 text-violet-800',
      badge: 'bg-violet-50 text-violet-700 border-violet-200',
      ring: 'ring-violet-200',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      iconBg: 'bg-slate-100 text-slate-700',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      ring: 'ring-slate-300',
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
      {cards.map((c) => {
        const Icon = c.icon;
        const sty = colorStyles[c.color] || colorStyles.teal;
        const isSelected = activeSection === c.id;

        return (
          <div
            key={c.id}
            onClick={() => onSelectSection?.(c.id, 'all')}
            className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
              isSelected ? `border-teal-700 ring-2 ${sty.ring}` : 'border-slate-200'
            }`}
          >
            <div>
              {/* Header with Icon and Title */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${sty.iconBg}`}>
                    <Icon size={17} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
                    {c.title}
                  </h3>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-700 shrink-0" />
              </div>

              {/* Main Metric Value */}
              <div className="my-1">
                <p className="text-xl font-bold font-mono text-slate-900 tracking-tight leading-tight truncate">
                  {c.value}
                </p>
                <p className="text-[0.68rem] text-slate-500 font-medium truncate mt-0.5">
                  {c.subtext}
                </p>
              </div>
            </div>

            {/* Sub-filter chips */}
            {c.subFilters && c.subFilters.length > 0 && (
              <div className="pt-2.5 border-t border-slate-100 mt-2.5 flex flex-wrap gap-1.5">
                {c.subFilters.map((sf) => (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSection?.(c.id, sf.id);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold bg-slate-50 border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition-colors cursor-pointer"
                    title={`Click to filter by ${sf.label}`}
                  >
                    <Filter size={9} className="opacity-60" />
                    <span className="truncate">{sf.label}:</span>
                    <span className="font-mono font-bold text-slate-800">{sf.value}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
