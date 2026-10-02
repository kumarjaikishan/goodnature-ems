import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { updateAttendance, setEmployees } from '../../../store/userSlice';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
import { apiClient } from '../../utils/apiClient';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import {
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineExclamationCircle,
  HiOutlineTag,
  HiOutlineReceiptPercent,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlineArrowsRightLeft,
  HiMiniArrowRight,
} from 'react-icons/hi2';

// --- Role Groups ---------------------------------------------------------------
const FULL_ACCESS = ['superadmin', 'admin', 'demo'];
const HR_ROLES    = ['hr', 'manager'];
const FIN_ROLES   = ['accountant', 'cashier', 'auditor'];
const OPS_ROLES   = ['sales', 'operator'];
const ALL_MGMT    = [...FULL_ACCESS, ...HR_ROLES, ...FIN_ROLES, ...OPS_ROLES, 'staff', 'other'];

// --- Permission Helper ---------------------------------------------------------
// `permissions` is a plain object (Map serialised to object by Redux) or a Map
// e.g. { plot_booking: [1,2], attandence: [1], ... }
const hasPerm = (permissions, module, action = 1) => {
  if (!permissions) return false;
  const perms =
    permissions instanceof Map
      ? permissions.get(module)
      : permissions[module];
  return Array.isArray(perms) && perms.includes(action);
};

// --- Helpers ------------------------------------------------------------------
const fmt    = (n) => typeof n === 'number' ? '\u20B9' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '\u20B90';
const fmtNum = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : 0;

// --- KPI Card -----------------------------------------------------------------
const KPICard = ({ icon: Icon, label, value, sub, color = 'teal', onClick, highlight }) => {
  const colorMap = {
    teal:    'bg-teal-50 text-teal-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    rose:    'bg-rose-50 text-rose-700',
    slate:   'bg-slate-100 text-slate-600',
    violet:  'bg-violet-50 text-violet-700',
    sky:     'bg-sky-50 text-sky-700',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-start gap-4
        ${highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className={`p-3 rounded-xl shrink-0 ${colorMap[color] || colorMap.teal}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 font-mono leading-tight truncate">{value}</p>
        {sub && <p className="text-[0.7rem] text-slate-500 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// --- Section Panel -------------------------------------------------------------
const Section = ({ icon: Icon, title, action, onAction, children, accent = 'white' }) => {
  const bg = accent === 'white' ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200';
  return (
    <div className={`${bg} border rounded-2xl shadow-xs p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
        </div>
        {action && (
          <button onClick={onAction}
            className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors">
            {action} <HiMiniArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

// --- Inventory Badge ----------------------------------------------------------
const InvBadge = ({ label, count, cls }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center ${cls}`}>
    <span className="text-xl font-bold font-mono">{fmtNum(count)}</span>
    <span className="text-[0.62rem] font-bold uppercase tracking-wider mt-0.5 opacity-75">{label}</span>
  </div>
);


// --- Employee Avatar ----------------------------------------------------------
const EmpAvatar = ({ emp, isPunchIn, isPresent, isAbsent, isLeave }) => {
  const border = isAbsent || isLeave ? 'border-rose-500'
    : isPunchIn ? 'border-emerald-500'
    : isPresent ? 'border-amber-400'
    : 'border-slate-300';
  return (
    <div className="flex flex-col items-center group cursor-pointer" title={emp?.userid?.name}>
      <span className={`${border} p-[2px] border-2 rounded-full transition-transform group-hover:scale-110`}>
        {emp?.profileimage ? (
          <img src={cloudinaryUrl(emp.profileimage, { format: 'webp', width: 60, height: 60 })}
            alt={emp.userid?.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <HiOutlineUser className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </span>
      <p className="text-[10px] font-semibold text-slate-600 text-center truncate w-12 mt-1 leading-tight">
        {emp?.userid?.name?.split(' ')[0]}
      </p>
    </div>
  );
};

// --- Role Badge ---------------------------------------------------------------
const ROLE_LABELS = {
  superadmin: { label: 'Super Admin', color: 'bg-teal-900 text-teal-100' },
  admin:      { label: 'Admin',       color: 'bg-teal-700 text-white' },
  manager:    { label: 'Manager',     color: 'bg-sky-600 text-white' },
  accountant: { label: 'Accountant',  color: 'bg-violet-600 text-white' },
  cashier:    { label: 'Cashier',     color: 'bg-amber-600 text-white' },
  hr:         { label: 'HR',          color: 'bg-emerald-600 text-white' },
  sales:      { label: 'Sales',       color: 'bg-rose-600 text-white' },
  operator:   { label: 'Operator',    color: 'bg-slate-600 text-white' },
  auditor:    { label: 'Auditor',     color: 'bg-indigo-600 text-white' },
  staff:      { label: 'Staff',       color: 'bg-slate-500 text-white' },
  other:      { label: 'Staff',       color: 'bg-slate-500 text-white' },
  demo:       { label: 'Demo',        color: 'bg-teal-700 text-white' },
};

// --- Main Dashboard -----------------------------------------------------------
const AdminDashboard = () => {
  const { attandence, employee, profile, branch } = useSelector((s) => s.user);
  const { islogin }   = useSelector((s) => s.auth);
  const navigate      = useNavigate();
  const dispatch      = useDispatch();

  const role        = profile?.role || '';
  const permissions = profile?.permissions || {};
  const branchIds   = profile?.branchIds || [];

  // -- Permission shortcuts ------------------------------------------
  const can = useMemo(() => ({
    plots:      hasPerm(permissions, 'plot_booking', 1) || hasPerm(permissions, 'plot_reports', 1),
    investment: hasPerm(permissions, 'investment', 1),
    hr:         hasPerm(permissions, 'attandence', 1) || hasPerm(permissions, 'employee', 1),
    payroll:    hasPerm(permissions, 'payroll', 1),
    leave:      hasPerm(permissions, 'leave', 1),
    ledger:     hasPerm(permissions, 'accounts', 1) || hasPerm(permissions, 'ledger', 1),
    voucher:    hasPerm(permissions, 'voucher', 1),
    advance:    hasPerm(permissions, 'advance', 1),
    transfer:   hasPerm(permissions, 'fund_transfer', 1),
  }), [permissions]);

  // Full-access roles always see everything
  const isFullAccess  = FULL_ACCESS.includes(role);
  const isManager     = role === 'manager';
  const isFinance     = FIN_ROLES.includes(role);
  const isHR          = role === 'hr';
  const isOps         = OPS_ROLES.includes(role);

  // Section visibility  -  superadmin/admin always see all; others follow permissions
  const showPlots      = isFullAccess || can.plots;
  const showInvestment = isFullAccess || can.investment;
  const showHR         = isFullAccess || isHR || isManager || can.hr;
  const showFinance    = isFullAccess || isFinance || can.ledger || can.transfer || can.voucher;

  // -- State ---------------------------------------------------------
  const [plotStats,   setPlotStats]   = useState(null);
  const [investStats, setInvestStats] = useState(null);
  const [loading,     setLoading]     = useState(true);

  const [currentpresent, setCurrentPresent] = useState([]);
  const [todaypresent,   setTodayPresent]   = useState([]);
  const [todayabsent,    setTodayAbsent]    = useState([]);
  const [todayleave,     setTodayLeave]     = useState([]);

  useEffect(() => { if (!islogin) navigate('/login'); }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Build requests based on what the role/permissions allow
      const requests = [
        apiClient({ url: 'getemployee' }),
        apiClient({ url: 'attandence/list', params: { date: dayjs().format('YYYY-MM-DD') } }),
      ];
      const doPlots  = showPlots;
      const doInvest = showInvestment;
      if (doPlots)  requests.push(api.get('/plots/dashboard/stats'));
      if (doInvest) requests.push(api.get('/investment/dashboard-stats'));

      const results = await Promise.allSettled(requests);
      const [empRes, attRes, ...rest] = results;

      if (empRes.status === 'fulfilled' && Array.isArray(empRes.value))
        dispatch(setEmployees(empRes.value));
      if (attRes.status === 'fulfilled' && Array.isArray(attRes.value?.data))
        dispatch(updateAttendance(attRes.value.data));

      let idx = 0;
      if (doPlots && rest[idx]) {
        if (rest[idx].status === 'fulfilled')
          setPlotStats(rest[idx].value?.data?.data || rest[idx].value?.data || null);
        idx++;
      }
      if (doInvest && rest[idx]) {
        if (rest[idx].status === 'fulfilled')
          setInvestStats(rest[idx].value?.data?.data || rest[idx].value?.data || null);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Attendance buckets
  useEffect(() => {
    if (!attandence?.length) return;
    const todayKey = dayjs().format('YYYY-MM-DD');
    const cp = [], tp = [], ta = [], tl = [];
    attandence.forEach((e) => {
      if (dayjs(e.date).format('YYYY-MM-DD') !== todayKey) return;
      if (e.status === 'absent') ta.push(e);
      else if (e.status === 'leave') tl.push(e);
      else if (e.status === 'present' || e.status === 'halfday') {
        tp.push(e);
        if (e.punchIn && !e.punchOut) cp.push(e);
      }
    });
    setCurrentPresent(cp); setTodayPresent(tp); setTodayAbsent(ta); setTodayLeave(tl);
  }, [attandence]);

  // For manager: scope to their branches
  const activeEmployees = useMemo(() => {
    const all = employee?.filter((e) => e.status) || [];
    if (isManager && branchIds.length > 0) {
      return all.filter((e) => branchIds.map(String).includes(String(e.branchId)));
    }
    return all;
  }, [employee, isManager, branchIds]);

  const plots      = plotStats?.plots      || {};
  const bookings   = plotStats?.bookings   || {};
  const collections = plotStats?.collections || {};
  const inv        = investStats            || {};

  const roleInfo   = ROLE_LABELS[role] || { label: role, color: 'bg-slate-500 text-white' };

  // -- Branch label for manager --------------------------------------
  const managerBranchNames = useMemo(() => {
    if (!isManager || !branch?.length || !branchIds.length) return null;
    const names = branch.filter((b) => branchIds.map(String).includes(String(b._id))).map((b) => b.name);
    return names.join(', ') || null;
  }, [isManager, branch, branchIds]);

  if (loading) {
    return (
      <PageLoader
        title="Loading Dashboard..."
        subtitle="Fetching your personalised metrics"
        fullScreen={false}
      />
    );
  }

  return (
    <div className="p-0 md:p-4 max-w-7xl mx-auto space-y-5 pb-6">

      {/* -- Header ---------------------------------------------------- */}
      <div className="flex items-center gap-3 flex-wrap mb-1">
        <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${roleInfo.color}`}>
          {roleInfo.label}
        </span>
        <p className="text-xs text-slate-500 font-medium">
          {dayjs().format('dddd, D MMMM YYYY')}
            {managerBranchNames && <span className="text-teal-700 font-semibold"> &middot; {managerBranchNames}</span>}
            {' · '}{profile?.name || 'Welcome back'}
        </p>
      </div>

      {/* -- SECTION 1: Real Estate - visible if has plot permission -- */}
      {showPlots && (
        <Section icon={HiOutlineBuildingOffice2} title="Real Estate"
          action="View Reports" onAction={() => navigate('/dashboard/plots/reports')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <KPICard icon={HiOutlineCurrencyRupee} label="Gross Sales Value"
              value={fmt(bookings.totalValue)} sub={`${fmtNum(bookings.count)} active bookings`}
              color="teal" onClick={() => navigate('/dashboard/plots/reports')} />
            <KPICard icon={HiOutlineBanknotes} label="Collected Funds"
              value={fmt(collections.totalCollection)} sub="Total receipts received"
              color="emerald" onClick={() => navigate('/dashboard/plots/collections/downpayment')} />
            <KPICard icon={HiOutlineExclamationCircle} label="Outstanding Balance"
              value={fmt(bookings.remainingAmount)} sub="Pending receivables"
              color="amber" highlight={bookings.remainingAmount > 0}
              onClick={() => navigate('/dashboard/plots/collections/emi')} />
            <KPICard icon={HiOutlineTag} label="Total Discounts"
              value={fmt(bookings.totalDiscount)} sub="Applied across all bookings" color="rose" />
          </div>
          <div>
            <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mb-2">Inventory Status</p>
            <div className="grid grid-cols-5 gap-2">
              <InvBadge label="Available" count={plots.AVAILABLE || 0} cls="bg-emerald-50 border-emerald-200 text-emerald-700" />
              <InvBadge label="On Hold"   count={plots.HOLD      || 0} cls="bg-amber-50  border-amber-200  text-amber-700" />
              <InvBadge label="Booked"    count={plots.BOOKED    || 0} cls="bg-teal-50   border-teal-200   text-teal-700" />
              <InvBadge label="Registered" count={plots.REGISTERED || 0} cls="bg-sky-50  border-sky-200    text-sky-700" />
              <InvBadge label="Cancelled" count={plots.CANCELLED || 0} cls="bg-slate-100 border-slate-200  text-slate-600" />
            </div>
          </div>
        </Section>
      )}

      {/* -- SECTION 2: Investment - visible if has investment perm --- */}
      {showInvestment && (
        <Section icon={HiOutlineArrowTrendingUp} title="Investment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <KPICard icon={HiOutlineUsers}     label="Active Accounts"
              value={fmtNum(inv.activeAccounts)}
              sub={`RD: ${fmtNum(inv.rdAccounts)}  -  FD: ${fmtNum(inv.fdAccounts)}`} color="teal" />
            <KPICard icon={HiOutlineBanknotes} label="Total Collected"
              value={fmt(inv.totalCollection)} sub="RD + FD receipts" color="emerald" />
            <KPICard icon={HiOutlineCheckBadge} label="Matured Accounts"
              value={fmtNum(inv.maturedAccounts)}
              sub={`${fmtNum(inv.prematureClosedAccounts)} premature closed`} color="sky" />
            <KPICard icon={HiOutlineClock} label="Pending Approvals"
              value={fmtNum(inv.pendingApprovals)} sub="Receipts awaiting approval"
              color={inv.pendingApprovals > 0 ? 'amber' : 'slate'}
              highlight={inv.pendingApprovals > 0} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <p className="text-[0.68rem] font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HiOutlineReceiptPercent className="w-3.5 h-3.5" /> Recurring Deposit (RD)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Total Deposited',    fmt(inv.rd?.totalDeposited),         false],
                  ['Expected Maturity',  fmt(inv.rd?.totalExpectedMaturity),  false],
                  ['Overdue Dues',       fmt(inv.rd?.pendingDues),            (inv.rd?.pendingDues || 0) > 0],
                  ['Overdue Count',      fmtNum(inv.rd?.overdueCount),        (inv.rd?.overdueCount || 0) > 0],
                ].map(([lbl, val, danger]) => (
                  <div key={lbl}>
                    <p className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wide">{lbl}</p>
                    <p className={`text-base font-bold font-mono ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <p className="text-[0.68rem] font-bold text-violet-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HiOutlineBanknotes className="w-3.5 h-3.5" /> Fixed Deposit (FD)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Principal Invested', fmt(inv.fd?.totalPrincipal),         false],
                  ['Expected Maturity',  fmt(inv.fd?.totalExpectedMaturity),  false],
                  ['Total Received',     fmt(inv.fd?.totalReceived),          false],
                  ['Pending Deposit',    fmt(inv.fd?.pendingDeposit),         (inv.fd?.pendingDeposit || 0) > 0],
                ].map(([lbl, val, warn]) => (
                  <div key={lbl}>
                    <p className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-wide">{lbl}</p>
                    <p className={`text-base font-bold font-mono ${warn ? 'text-amber-600' : 'text-slate-800'}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* -- SECTION 3: Finance (Accountant / Cashier / Auditor) ------- */}
      {showFinance && !isFullAccess && (
        <Section icon={HiOutlineBanknotes} title="Finance Overview">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {can.ledger && (
              <KPICard icon={HiOutlineBanknotes} label="Bank & Cash Ledgers"
                value="View Ledgers" sub="Bank accounts & cash-in-hand"
                color="teal" onClick={() => navigate('/dashboard/ledger/banks')} />
            )}
            {can.voucher && (
              <KPICard icon={HiOutlineDocumentText} label="Vouchers"
                value="View Vouchers" sub="Approval & disbursement vouchers"
                color="violet" onClick={() => navigate('/dashboard/vouchers')} />
            )}
            {can.transfer && (
              <KPICard icon={HiOutlineArrowsRightLeft} label="Fund Transfers"
                value="View Transfers" sub="Maker-checker inter-ledger"
                color="amber" onClick={() => navigate('/dashboard/ledger/transfers')} />
            )}
          </div>
        </Section>
      )}

      {/* -- SECTION 4: HR Today - visible for admin/manager/hr ------- */}
      {showHR && (
        <Section icon={HiOutlineUsers} title={isManager ? `Branch Attendance (${managerBranchNames || 'Your Branch'})` : "Attendance"}
          action="Full Attendance" onAction={() => navigate('/dashboard/attandence')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KPICard icon={HiOutlineUsers} label="Total Employees"
              value={fmtNum(activeEmployees.length)} color="slate"
              onClick={() => navigate('/dashboard/employe')} />
            <KPICard icon={HiOutlineCheckBadge} label="Present Today"
              value={fmtNum(todaypresent.length)}
              sub={`${fmtNum(currentpresent.length)} currently in office`} color="emerald" />
            <KPICard icon={HiOutlineClock} label="Leave / Absent"
              value={fmtNum(todayleave.length + todayabsent.length)}
              sub={`${fmtNum(todayleave.length)} leave  -  ${fmtNum(todayabsent.length)} absent`}
              color="rose" highlight={todayabsent.length > 0} />
            <KPICard icon={HiOutlineCalendarDays} label="Today"
              value={dayjs().format('D MMM')} sub={dayjs().format('dddd')} color="teal" />
          </div>

          {activeEmployees.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
              {activeEmployees.slice(0, 40).map((emp) => {
                const isPunchIn = currentpresent.some((a) => a.employeeId?._id === emp._id);
                const isPresent = todaypresent.some((a)  => a.employeeId?._id === emp._id);
                const isAbsent  = todayabsent.some((a)   => a.employeeId?._id === emp._id);
                const isLeave   = todayleave.some((a)    => a.employeeId?._id === emp._id);
                return <EmpAvatar key={emp._id} emp={emp} isPunchIn={isPunchIn}
                  isPresent={isPresent} isAbsent={isAbsent} isLeave={isLeave} />;
              })}
            </div>
          )}

          <div className="flex gap-4 flex-wrap pt-3 border-t border-slate-100 mt-3">
            {[
              { label: 'In Office',      color: 'bg-emerald-500', text: 'text-emerald-600' },
              { label: 'Present',        color: 'bg-amber-500',   text: 'text-amber-700' },
              { label: 'Leave / Absent', color: 'bg-rose-500',    text: 'text-rose-500' },
              { label: 'No Status',      color: 'bg-slate-400',   text: 'text-slate-400' },
            ].map(({ label, color, text }) => (
              <span key={label} className={`flex items-center gap-1.5 text-xs font-semibold ${text}`}>
                <span className={`block w-2 h-2 rounded-full ${color}`} /> {label}
              </span>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
};

export default AdminDashboard;

