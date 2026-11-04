import React from 'react';
import {
  LayoutDashboard,
  Network,
  Users,
  UserCheck,
  CalendarCheck2,
  Building2,
  CalendarDays,
  BookOpen,
  UserCircle2,
  Settings,
  LogOut,
  FileText,
  History,
  TrendingUp,
  ShieldAlert,
  Gauge,
  KeyRound,
  Wallet,
  Award,
  Calculator,
  Grid3X3,
} from 'lucide-react';

export const OPERATIONAL_ROLES = [
  'admin',
  'superadmin',
  'manager',
  'accountant',
  'cashier',
  'hr',
  'sales',
  'operator',
  'auditor',
  'staff',
  'other',
  'demo',
];

/**
 * Returns the scoped hierarchical navigation menu structure for the active user role.
 */
export const getSidebarMenuConfig = ({ role, company, user }) => {
  return [
    {
      title: 'Menu',
      items: [
        {
          menu: 'Dashboard',
          link: '/dashboard',
          icon: <LayoutDashboard size={20} />,
          roles: [...OPERATIONAL_ROLES, 'employee', 'sponsor', 'developer'],
        },
        {
          menu: 'Permissions',
          link: '/dashboard/permission',
          icon: <KeyRound size={20} />,
          roles: ['developer'],
        },
        {
          menu: 'API Monitor',
          link: '/dashboard/api-monitor',
          icon: <Gauge size={20} />,
          roles: ['developer'],
        },
        {
          menu: 'Error Logs',
          link: '/dashboard/error-logs',
          icon: <ShieldAlert size={20} />,
          roles: ['developer'],
        },
        {
          menu: 'Organization',
          icon: <Network size={20} />,
          roles: ['admin', 'superadmin'],
          children: [
            { menu: 'Company Info', link: '/dashboard/organization/company', roles: ['admin', 'superadmin'] },
            { menu: 'Branches', link: '/dashboard/organization/branches', roles: ['admin', 'superadmin'], resource: 'branch' },
            { menu: 'Departments', link: '/dashboard/organization/departments', roles: ['admin', 'superadmin'], resource: 'department' },
            { menu: 'User Management', link: '/dashboard/organization/users', roles: ['superadmin'] },
            { menu: 'Attendance Rules', link: '/dashboard/organization/rules', roles: ['admin', 'superadmin'], resource: 'attandence' },
            { menu: 'Device Management', link: '/dashboard/organization/devices', roles: ['admin', 'superadmin'] },
            { menu: 'Telegram', link: '/dashboard/organization/telegram', roles: ['admin', 'superadmin'] },
            { menu: 'Payroll Policies', link: '/dashboard/organization/payroll', roles: ['admin', 'superadmin'], resource: 'salary' },
            { menu: 'Leave Policies', link: '/dashboard/organization/leave-policies', roles: ['admin', 'superadmin'], resource: 'leave' },
          ],
        },
        {
          menu: 'Employees',
          icon: <Users size={20} />,
          roles: [...OPERATIONAL_ROLES, 'employee'],
          children: [
            { menu: 'Employee', link: '/dashboard/employe', roles: OPERATIONAL_ROLES, resource: 'employee' },
            { menu: 'Leave Request', link: '/dashboard/leave-request', roles: [...OPERATIONAL_ROLES, 'employee'], resource: 'leave', icon: <FileText size={18} /> },
            { menu: 'Leave Balance', link: '/dashboard/leave-ledger', roles: OPERATIONAL_ROLES, resource: 'leave', icon: <History size={18} /> },
            { menu: 'Leave Ledger', link: '/dashboard/my-leave-ledger', roles: ['employee'], icon: <History size={18} />, hidden: !company?.leaveSettings?.allowEmployeeToSeeLedger },
          ].filter((c) => !c.hidden),
        },
        {
          menu: 'Attendance',
          icon: <CalendarCheck2 size={20} />,
          roles: [...OPERATIONAL_ROLES, 'employee'],
          children: [
            { menu: 'Attendance', link: '/dashboard/attandence', roles: OPERATIONAL_ROLES, resource: 'attandence' },
            { menu: 'Performance', link: '/dashboard/performance', roles: OPERATIONAL_ROLES, resource: 'attandence' },
            { menu: 'Emp Attendance', link: '/dashboard/empattandence', roles: ['employee'] },
            { menu: 'Report', link: '/dashboard/attandence_Report', roles: OPERATIONAL_ROLES, resource: 'attandence' },
          ],
        },
        {
          menu: 'Account',
          icon: <Wallet size={20} />,
          roles: OPERATIONAL_ROLES,
          children: [
            { menu: 'Down Payment', link: '/dashboard/plots/collections/downpayment', roles: OPERATIONAL_ROLES, resource: 'plot_collection' },
            { menu: 'EMI', link: '/dashboard/plots/collections/emi', roles: OPERATIONAL_ROLES, resource: 'plot_collection' },
            { menu: 'Investment Collection', link: '/dashboard/plots/collections/products', roles: OPERATIONAL_ROLES, resource: 'plot_collection' },
            { menu: 'Payroll', link: '/dashboard/payroll', roles: OPERATIONAL_ROLES, resource: 'salary' },
            { menu: 'Advance', link: '/dashboard/advance', roles: OPERATIONAL_ROLES, resource: 'advance' },
            { menu: 'Vouchers', link: '/dashboard/vouchers', roles: OPERATIONAL_ROLES, resource: 'voucher' },
          ],
        },
        {
          menu: 'Ledger',
          icon: <BookOpen size={20} />,
          roles: OPERATIONAL_ROLES,
          children: [
            { menu: 'Bank Accounts', link: '/dashboard/ledger/banks', roles: OPERATIONAL_ROLES, resource: 'bank_ledger' },
            { menu: 'Cash Accounts', link: '/dashboard/ledger/cash-accounts', roles: OPERATIONAL_ROLES, resource: 'cash_ledger' },
            { menu: 'Fund Transfers', link: '/dashboard/ledger/transfers', roles: OPERATIONAL_ROLES, resource: 'fund_transfer' },
            { menu: 'Employee', link: '/dashboard/ledger/employees', roles: OPERATIONAL_ROLES, resource: 'employee_ledger' },
            { menu: 'Seller', link: '/dashboard/ledger/sellers', roles: OPERATIONAL_ROLES, resource: 'kisan_ledger' },
            { menu: 'Business Associate', link: '/dashboard/ledger/business-associates', roles: OPERATIONAL_ROLES, resource: 'associate_ledger' },
            { menu: 'Business Partner', link: '/dashboard/ledger/business-partners', roles: OPERATIONAL_ROLES, resource: 'partner_ledger' },
            { menu: 'Branch Partner', link: '/dashboard/ledger/branch-partners', roles: OPERATIONAL_ROLES, resource: 'branch_ledger' },
          ],
        },
        {
          menu: 'Plot Management',
          icon: <Building2 size={20} />,
          roles: OPERATIONAL_ROLES,
          children: [
            { menu: 'Plot Purchase', link: '/dashboard/plots/purchase', roles: OPERATIONAL_ROLES, resource: ['plot_purchase', 'plot_inventory'] },
            { menu: 'Purchasers / Buyers', link: '/dashboard/plots/purchasers', roles: OPERATIONAL_ROLES, resource: ['purchasers_master', 'plot_purchase', 'plot_inventory'] },
            { menu: 'Series & Inventory', link: '/dashboard/plots/series-master', roles: OPERATIONAL_ROLES, resource: 'plot_inventory' },
            { menu: 'Plot Products', link: '/dashboard/plots/products', roles: OPERATIONAL_ROLES, resource: 'plot_inventory' },
            { menu: 'Business Developer', link: '/dashboard/plots/business-developer', roles: OPERATIONAL_ROLES, resource: ['associate', 'partner', 'plot_sponsor'] },
            { menu: 'Customers', link: '/dashboard/plots/customers', roles: OPERATIONAL_ROLES, resource: 'plot_customer' },
            { menu: 'Plot Booking', link: '/dashboard/plots/booking', roles: OPERATIONAL_ROLES, resource: 'plot_booking' },
            { menu: 'Investment Booking', link: '/dashboard/plots/investment-booking', roles: OPERATIONAL_ROLES, resource: 'investment_booking' },
            { menu: 'Incentive Closing', link: '/dashboard/plots/incentives', roles: OPERATIONAL_ROLES, resource: 'plot_incentive' },
            { menu: 'Reports', link: '/dashboard/plots/reports', roles: OPERATIONAL_ROLES, resource: 'plot_reports' },
          ],
        },
        { menu: 'Holiday', link: '/dashboard/holiday', icon: <CalendarDays size={20} />, roles: OPERATIONAL_ROLES, resource: 'holiday' },
        { menu: 'Activity Logs', link: '/dashboard/activity-logs', icon: <History size={20} />, roles: ['superadmin', 'admin', 'developer', 'auditor'], resource: 'audit_log' },
        { menu: 'Commission Ledger', link: '/dashboard/ledger', icon: <BookOpen size={20} />, roles: ['sponsor'] },
        {
          menu: (role === 'sponsor' && (user?.profile?.sponsorCode?.startsWith('BA-') || user?.profile?.isDeveloperSponsor === false)) ? 'My Customers' : 'My Network & Customers',
          link: '/dashboard/my-network',
          icon: (role === 'sponsor' && (user?.profile?.sponsorCode?.startsWith('BA-') || user?.profile?.isDeveloperSponsor === false)) ? <UserCheck size={20} /> : <Users size={20} />,
          roles: ['sponsor'],
        },
        { menu: 'My Plot Bookings', link: '/dashboard/my-bookings', icon: <Building2 size={20} />, roles: ['sponsor'] },
        { menu: 'Plot Availability', link: '/dashboard/plot-availability', icon: <Grid3X3 size={20} />, roles: ['sponsor'] },
        {
          menu: 'Plan & Commission',
          icon: <Award size={20} />,
          roles: ['sponsor'],
          children: [
            { menu: 'Plan', link: '/dashboard/my-plans', roles: ['sponsor'] },
            { menu: 'Commission', link: '/dashboard/my-commission-rates', roles: ['sponsor'] },
          ],
        },
        { menu: 'Price Calculator', link: '/dashboard/price-calculator', icon: <Calculator size={20} />, roles: ['sponsor'] },
        { menu: 'Business Report', link: '/dashboard/my-business', icon: <TrendingUp size={20} />, roles: ['sponsor'] },
      ],
    },
    {
      title: 'Others',
      items: [
        { menu: 'Profile', link: '/dashboard/profile', icon: <UserCircle2 size={20} />, roles: [...OPERATIONAL_ROLES, 'employee', 'grant', 'sponsor'] },
        { menu: 'Setting', link: '/dashboard/setting', icon: <Settings size={20} />, roles: [...OPERATIONAL_ROLES, 'employee'] },
        { menu: 'Logout', isLogout: true, icon: <LogOut size={20} />, roles: [...OPERATIONAL_ROLES, 'employee', 'developer', 'grant', 'sponsor'] },
      ],
    },
  ];
};

