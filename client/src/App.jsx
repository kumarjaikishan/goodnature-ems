import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, Suspense, lazy } from 'react';
import { FirstFetch } from '../store/userSlice';
import { empFirstFetch } from '../store/employee';
import { setlogin } from '../store/authSlice';
import ProtectedRoutes from './utils/protectedRoute';
import { Settings, User } from 'lucide-react';
import { connectSSE, closeSSE } from "./utils/sse";
import { notificationSound } from "./utils/sound";
import dayjs from 'dayjs';

import ScrollToTop from './components/ScrollToTop';
import { swal } from './utils/confirmDialog';
import { isTokenValid, clearAuthSession, getRoleFromToken } from './utils/auth';
import RoutePermissionGuard from './utils/RoutePermissionGuard';
// import  Errorpage  from './pages/error/Errorpage';


// ✅ Lazy imports
const Login = lazy(() => import('./pages/Login'));
const Logout = lazy(() => import('./pages/logout'));
const Errorpage = lazy(() => import('./pages/error/Errorpage'));

const LeaveBalancePage = lazy(() => import('./pages/leaveledger/leaveledger'));

// Admin/Manager
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Employe = lazy(() => import('./pages/admin/employee/Employe'));
const OrganizationSettings = lazy(() => import('./pages/admin/organization/organization'));
const CompanyInfoPage = lazy(() => import('./pages/admin/organization/pages/CompanyInfoPage'));
const BranchManagerPage = lazy(() => import('./pages/admin/organization/pages/BranchManagerPage'));
const DepartmentPage = lazy(() => import('./pages/admin/organization/pages/DepartmentPage'));
const DeviceManagementPage = lazy(() => import('./pages/admin/organization/pages/DeviceManagementPage'));
const TelegramIntegrationPage = lazy(() => import('./pages/admin/organization/pages/TelegramIntegrationPage'));
const AdminManagerPage = lazy(() => import('./pages/admin/organization/pages/AdminManagerPage'));
const AdminUserFormPage = lazy(() => import('./pages/admin/organization/pages/AdminUserFormPage'));
const AttendanceRulesPage = lazy(() => import('./pages/admin/organization/pages/AttendanceRulesPage'));
const PayrollPoliciesPage = lazy(() => import('./pages/admin/organization/pages/PayrollPoliciesPage'));
const LeavePoliciesPage = lazy(() => import('./pages/admin/organization/pages/LeavePoliciesPage'));
const Attandence = lazy(() => import('./pages/admin/attandence/Attandence'));
const AttenPerformance = lazy(() => import('./pages/admin/attandence/AttenPerformance'));
const Adminleave = lazy(() => import('./pages/admin/leave/Adminleave'));
const HolidayForm = lazy(() => import('./pages/holidays/Holiday'));
const Setting = lazy(() => import('./pages/settingPage'));
const AttendanceReport = lazy(() => import('./pages/report/attandenceReport'));
const PayrollPage = lazy(() => import('./pages/common/payroll/payroll'));
const PayrollCreatePage = lazy(() => import('./pages/common/payroll/payrollCreating'));
const PayrollEdit = lazy(() => import('./pages/common/payroll/payrollEdit'));
const PayslipPrintPage = lazy(() => import('./pages/common/payroll/payrollprint'));
const EmployeeAdvancePage = lazy(() => import('./pages/advance/advance'));
const EmployeeLedgerPage = lazy(() => import('./pages/admin/ledger/EmployeeLedgerPage'));
const SellerLedgerPage = lazy(() => import('./pages/admin/ledger/SellerLedgerPage'));
const BusinessAssociateLedgerPage = lazy(() => import('./pages/admin/ledger/BusinessAssociateLedgerPage'));
const BusinessPartnerLedgerPage = lazy(() => import('./pages/admin/ledger/BusinessPartnerLedgerPage'));
const BranchPartnerLedgerPage = lazy(() => import('./pages/admin/ledger/BranchPartnerLedgerPage'));
const BankLedgersPage = lazy(() => import('./pages/admin/ledger/BankLedgersPage'));
const CashLedgersPage = lazy(() => import('./pages/admin/ledger/CashLedgersPage'));
const FundTransfersPage = lazy(() => import('./pages/admin/ledger/FundTransfersPage'));
const LedgerDetailPage = lazy(() => import('./pages/admin/ledger/ledgerdetailpage'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const VoucherList = lazy(() => import('./pages/vouchers/VoucherList'));
const VoucherDetails = lazy(() => import('./pages/vouchers/VoucherDetails'));
const AttendanceExcelImport = lazy(() => import('./pages/admin/attandence/AttendanceExcelImport'));
const ActivityLogs = lazy(() => import('./pages/admin/activityLogs/ActivityLogs'));
const PasswordReset = lazy(() => import('./utils/PasswordReset'));

// Employee
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmpAttenPerformance = lazy(() => import('./pages/employee/attandencee/empAttandence'));
const EmpLeave = lazy(() => import('./pages/employee/leave/Leave'));
const MyLeaveLedger = lazy(() => import('./pages/employee/leave/MyLeaveLedger'));
const EmployeeFinancialLedger = lazy(() => import('./pages/employee/ledger/EmployeeFinancialLedger'));

// Developer
const DeveloperDashboard = lazy(() => import('./pages/developer/Dashboard'));
const Permission = lazy(() => import('./pages/developer/Permission'));
const ApiMonitor = lazy(() => import('./pages/developer/ApiMonitor'));
const ErrorLogs = lazy(() => import('./pages/developer/ErrorLogs'));

// Profile
const EmployeeProfile = lazy(() => import('./pages/profile/profile'));
const AdminManagerProfile = lazy(() => import('./pages/profile/adminManagerProfile'));

// Plots
const PlotBusinessDevelopers = lazy(() => import('./pages/plots/businessDevelopers/PlotBusinessDevelopers'));
const PlotCustomers = lazy(() => import('./pages/plots/customers/PlotCustomers'));
const PlotCustomerFormPage = lazy(() => import('./pages/plots/customers/PlotCustomerFormPage'));
const PlotBooking = lazy(() => import('./pages/plots/booking/PlotBooking'));
const PlotBookingFormPage = lazy(() => import('./pages/plots/booking/PlotBookingFormPage'));
const PlotBookingDetails = lazy(() => import('./pages/plots/booking/PlotBookingDetails'));
const InstallmentCollection = lazy(() => import('./pages/plots/installments/InstallmentCollection'));
const ProductCollectionsPage = lazy(() => import('./pages/plots/products/ProductCollectionsPage'));
const PlotSeriesMaster = lazy(() => import('./pages/plots/seriesMaster/PlotSeriesMaster'));
const PlotProductsPage = lazy(() => import('./pages/plots/products/PlotProductsPage'));
const ProductBookingPage = lazy(() => import('./pages/plots/products/ProductBookingPage'));
const PlotReports = lazy(() => import('./pages/plots/reports/PlotReports'));
const PlotPayoutLedgerPage = lazy(() => import('./pages/plots/incentives/PlotPayoutLedgerPage'));
const PlotAgreementViewer = lazy(() => import('./pages/plots/printViewers/PlotAgreementViewer'));
const ProductAgreementViewer = lazy(() => import('./pages/plots/printViewers/ProductAgreementViewer'));
const BookingCertificateViewer = lazy(() => import('./pages/plots/printViewers/BookingCertificateViewer'));
const ReceiptViewer = lazy(() => import('./pages/plots/printViewers/ReceiptViewer'));
const PlotPayoutVoucherPrint = lazy(() => import('./pages/plots/incentives/PlotPayoutVoucherPrint'));
const PlotInterestCalculator = lazy(() => import('./pages/plots/calculator/PlotInterestCalculator'));
const BusinessDeveloperLedgerPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperLedgerPage'));
const BusinessDeveloperDashboard = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperDashboard'));
const BusinessDeveloperReportPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperReportPage'));
const BusinessDeveloperBookingsPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperBookingsPage'));
const BusinessDeveloperNetworkPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperNetworkPage'));
const PlotIncentivesPage = lazy(() => import('./pages/plots/incentives/PlotIncentivesPage'));
const PlotIncentiveProcessPage = lazy(() => import('./pages/plots/incentives/PlotIncentiveProcessPage'));
const PlotPurchasePage = lazy(() => import('./pages/plots/purchase/PlotPurchasePage'));
const PlotKisanLedgerPage = lazy(() => import('./pages/plots/purchase/PlotKisanLedgerPage'));
const PlotBookingEditPage = lazy(() => import('./pages/plots/booking/PlotBookingEditPage'));
const PlotBookingLedgerPage = lazy(() => import('./pages/plots/booking/PlotBookingLedgerPage'));


// 🔹 Operational / Management Roles Constant
const MANAGEMENT_ROLES = [
  'superadmin',
  'admin',
  'manager',
  'accountant',
  'cashier',
  'hr',
  'sales',
  'operator',
  'auditor',
  'staff',
  'other',
  'demo'
];

const managementRoutes = (
  <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={MANAGEMENT_ROLES} />}>
    <Route index element={<AdminDashboard />} />
    <Route path="employe" element={<RoutePermissionGuard resource="employee" action={1}><Employe /></RoutePermissionGuard>} />
    <Route path="organization" element={<OrganizationSettings />} />
    <Route path="organization/company" element={<CompanyInfoPage />} />
    <Route path="organization/branches" element={<RoutePermissionGuard resource="branch" action={1}><BranchManagerPage /></RoutePermissionGuard>} />
    <Route path="organization/departments" element={<RoutePermissionGuard resource="department" action={1}><DepartmentPage /></RoutePermissionGuard>} />
    <Route path="organization/devices" element={<DeviceManagementPage />} />
    <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
    <Route path="organization/admin" element={<AdminManagerPage />} />
    <Route path="organization/admin/new" element={<AdminUserFormPage />} />
    <Route path="organization/admin/:id/edit" element={<AdminUserFormPage />} />
    <Route path="organization/users" element={<AdminManagerPage />} />
    <Route path="organization/users/new" element={<AdminUserFormPage />} />
    <Route path="organization/users/:id/edit" element={<AdminUserFormPage />} />
    <Route path="organization/rules" element={<RoutePermissionGuard resource="attandence" action={1}><AttendanceRulesPage /></RoutePermissionGuard>} />
    <Route path="organization/payroll" element={<RoutePermissionGuard resource="salary" action={1}><PayrollPoliciesPage /></RoutePermissionGuard>} />
    <Route path="organization/leave-policies" element={<RoutePermissionGuard resource="leave" action={1}><LeavePoliciesPage /></RoutePermissionGuard>} />
    <Route path="attandence" element={<RoutePermissionGuard resource="attandence" action={1}><Attandence /></RoutePermissionGuard>} />
    <Route path="attandence-import" element={<RoutePermissionGuard resource="attandence" action={2}><AttendanceExcelImport /></RoutePermissionGuard>} />
    <Route path="attandence_Report" element={<RoutePermissionGuard resource="attandence" action={1}><AttendanceReport /></RoutePermissionGuard>} />
    <Route path="holiday" element={<RoutePermissionGuard resource="holiday" action={1}><HolidayForm /></RoutePermissionGuard>} />
    <Route path="activity-logs" element={<RoutePermissionGuard resource="audit_log" action={1}><ActivityLogs /></RoutePermissionGuard>} />
    <Route path="leave-request" element={<RoutePermissionGuard resource="leave" action={1}><Adminleave /></RoutePermissionGuard>} />
    <Route path="leave-ledger" element={<RoutePermissionGuard resource="leave" action={1}><LeaveBalancePage /></RoutePermissionGuard>} />
    <Route path="advance" element={<RoutePermissionGuard resource="advance" action={1}><EmployeeAdvancePage /></RoutePermissionGuard>} />
    <Route path="setting" element={<Setting />} />
    <Route path="profile" element={<AdminManagerProfile />} />
    <Route path="ledger" element={<Navigate to="/dashboard/ledger/banks" replace />} />
    <Route path="ledger/employees" element={<RoutePermissionGuard resource="employee_ledger" action={1}><EmployeeLedgerPage /></RoutePermissionGuard>} />
    <Route path="ledger/sellers" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><SellerLedgerPage /></RoutePermissionGuard>} />
    <Route path="ledger/business-associates" element={<RoutePermissionGuard resource="sponsor_ledger" action={1}><BusinessAssociateLedgerPage /></RoutePermissionGuard>} />
    <Route path="ledger/business-partners" element={<RoutePermissionGuard resource="sponsor_ledger" action={1}><BusinessPartnerLedgerPage /></RoutePermissionGuard>} />
    <Route path="ledger/branch-partners" element={<RoutePermissionGuard resource={["branch_ledger", "sponsor_ledger"]} action={1}><BranchPartnerLedgerPage /></RoutePermissionGuard>} />
    <Route path="ledger/banks" element={<RoutePermissionGuard resource="bank_ledger" action={1}><BankLedgersPage /></RoutePermissionGuard>} />
    <Route path="ledger/cash-accounts" element={<RoutePermissionGuard resource="cash_ledger" action={1}><CashLedgersPage /></RoutePermissionGuard>} />
    <Route path="ledger/transfers" element={<RoutePermissionGuard resource="fund_transfer" action={1}><FundTransfersPage /></RoutePermissionGuard>} />
    <Route path="ledger/:id" element={<RoutePermissionGuard resource="ledger" action={1}><LedgerDetailPage /></RoutePermissionGuard>} />
    <Route path="performance" element={<RoutePermissionGuard resource="attandence" action={1}><AttenPerformance /></RoutePermissionGuard>} />
    <Route path="performance/:userid" element={<RoutePermissionGuard resource="attandence" action={1}><AttenPerformance /></RoutePermissionGuard>} />
    <Route path="payroll" element={<RoutePermissionGuard resource="salary" action={1}><PayrollPage /></RoutePermissionGuard>} />
    <Route path="payroll/add" element={<RoutePermissionGuard resource="salary" action={2}><PayrollCreatePage /></RoutePermissionGuard>} />
    <Route path="payroll/print/:id" element={<RoutePermissionGuard resource="salary" action={1}><PayslipPrintPage /></RoutePermissionGuard>} />
    <Route path="payroll/edit/:id" element={<RoutePermissionGuard resource="salary" action={3}><PayrollEdit /></RoutePermissionGuard>} />
    <Route path="vouchers" element={<RoutePermissionGuard resource="voucher" action={1}><VoucherList /></RoutePermissionGuard>} />
    <Route path="vouchers/:id" element={<RoutePermissionGuard resource="voucher" action={1}><VoucherDetails /></RoutePermissionGuard>} />

    <Route path="plots/purchase" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotPurchasePage /></RoutePermissionGuard>} />
    <Route path="plots/purchase/:id/ledger" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/agreements" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotPurchasePage /></RoutePermissionGuard>} />
    <Route path="plots/kisan-land" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotPurchasePage /></RoutePermissionGuard>} />
    <Route path="plots/kisan-ledger/:id" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/agreements/:id/ledger" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/kisan-land/:id/ledger" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/inventory" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotSeriesMaster /></RoutePermissionGuard>} />
    <Route path="plots/business-developer" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotBusinessDevelopers /></RoutePermissionGuard>} />
    <Route path="plots/business-developers" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotBusinessDevelopers /></RoutePermissionGuard>} />
    <Route path="plots/business-developer/:id/ledger" element={<RoutePermissionGuard resource="sponsor_ledger" action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/business-developers/:id/ledger" element={<RoutePermissionGuard resource="sponsor_ledger" action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/business-developer/:id/business-report" element={<RoutePermissionGuard resource="plot_reports" action={1}><BusinessDeveloperReportPage /></RoutePermissionGuard>} />
    <Route path="plots/business-developers/:id/business-report" element={<RoutePermissionGuard resource="plot_reports" action={1}><BusinessDeveloperReportPage /></RoutePermissionGuard>} />
    <Route path="plots/business-developer/:id/network" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><BusinessDeveloperNetworkPage /></RoutePermissionGuard>} />
    <Route path="plots/business-developers/:id/network" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><BusinessDeveloperNetworkPage /></RoutePermissionGuard>} />
    <Route path="plots/sponsors" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotBusinessDevelopers /></RoutePermissionGuard>} />
    <Route path="plots/sponsors/:id/ledger" element={<RoutePermissionGuard resource="sponsor_ledger" action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/sponsors/:id/business-report" element={<RoutePermissionGuard resource="plot_reports" action={1}><BusinessDeveloperReportPage /></RoutePermissionGuard>} />
    <Route path="plots/sponsor-ledger/:id" element={<RoutePermissionGuard resource="sponsor_ledger" action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/customers" element={<RoutePermissionGuard resource="plot_customer" action={1}><PlotCustomers /></RoutePermissionGuard>} />
    <Route path="plots/customers/new" element={<RoutePermissionGuard resource="plot_customer" action={2}><PlotCustomerFormPage /></RoutePermissionGuard>} />
    <Route path="plots/customers/edit/:id" element={<RoutePermissionGuard resource="plot_customer" action={3}><PlotCustomerFormPage /></RoutePermissionGuard>} />
    <Route path="plots/booking" element={<RoutePermissionGuard resource="plot_booking" action={1}><PlotReports /></RoutePermissionGuard>} />
    <Route path="plots/addbooking" element={<RoutePermissionGuard resource="plot_booking" action={2}><PlotBooking /></RoutePermissionGuard>} />
    <Route path="plots/booking/new" element={<RoutePermissionGuard resource="plot_booking" action={2}><PlotBookingFormPage /></RoutePermissionGuard>} />
    <Route path="plots/booking/:id" element={<RoutePermissionGuard resource="plot_booking" action={1}><PlotBookingDetails /></RoutePermissionGuard>} />
    <Route path="plots/booking/:id/ledger" element={<RoutePermissionGuard resource="plot_booking" action={1}><PlotBookingLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/booking/ledger/:id" element={<RoutePermissionGuard resource="plot_booking" action={1}><PlotBookingLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/booking/edit/:id" element={<RoutePermissionGuard resource="plot_booking" action={3}><PlotBookingEditPage /></RoutePermissionGuard>} />
    <Route path="plots/installments" element={<Navigate to="/dashboard/plots/collections/emi" replace />} />
    <Route path="plots/collections/downpayment" element={<RoutePermissionGuard resource="plot_collection" action={1}><InstallmentCollection type="DOWNPAYMENT" /></RoutePermissionGuard>} />
    <Route path="plots/collections/downpayment/add" element={<RoutePermissionGuard resource="plot_collection" action={2}><InstallmentCollection type="DOWNPAYMENT" initialView="add" /></RoutePermissionGuard>} />
    <Route path="plots/collections/emi" element={<RoutePermissionGuard resource="plot_collection" action={1}><InstallmentCollection type="EMI" /></RoutePermissionGuard>} />
    <Route path="plots/collections/emi/add" element={<RoutePermissionGuard resource="plot_collection" action={2}><InstallmentCollection type="EMI" initialView="add" /></RoutePermissionGuard>} />
    <Route path="plots/collections/products" element={<RoutePermissionGuard resource="plot_collection" action={1}><ProductCollectionsPage /></RoutePermissionGuard>} />
    <Route path="plots/collections/products/add" element={<RoutePermissionGuard resource="plot_collection" action={2}><ProductCollectionsPage initialView="add" /></RoutePermissionGuard>} />
    <Route path="plots/series-master" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotSeriesMaster /></RoutePermissionGuard>} />
    <Route path="plots/products" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotProductsPage /></RoutePermissionGuard>} />
    <Route path="plots/products/book" element={<RoutePermissionGuard resource="plot_booking" action={2}><ProductBookingPage /></RoutePermissionGuard>} />
    <Route path="plots/reports" element={<RoutePermissionGuard resource="plot_reports" action={1}><PlotReports /></RoutePermissionGuard>} />
    <Route path="plots/payout-ledger" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotPayoutLedgerPage /></RoutePermissionGuard>} />
    <Route path="plots/agreements/:id" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotAgreementViewer /></RoutePermissionGuard>} />
    <Route path="plots/product-agreements/:id" element={<RoutePermissionGuard resource="plot_inventory" action={1}><ProductAgreementViewer /></RoutePermissionGuard>} />
    <Route path="plots/certificates/:id" element={<RoutePermissionGuard resource="plot_booking" action={1}><BookingCertificateViewer /></RoutePermissionGuard>} />
    <Route path="plots/product-certificates/:id" element={<RoutePermissionGuard resource="plot_booking" action={1}><BookingCertificateViewer /></RoutePermissionGuard>} />
    <Route path="plots/receipts/:id" element={<RoutePermissionGuard resource="plot_collection" action={1}><ReceiptViewer /></RoutePermissionGuard>} />
    <Route path="plots/vouchers/:id" element={<RoutePermissionGuard resource="voucher" action={1}><PlotPayoutVoucherPrint /></RoutePermissionGuard>} />
    <Route path="plots/interest-calculator" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotInterestCalculator /></RoutePermissionGuard>} />
    <Route path="plots/incentives" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotIncentivesPage /></RoutePermissionGuard>} />
    <Route path="plots/incentives/new" element={<RoutePermissionGuard resource="plot_sponsor" action={2}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />
    <Route path="plots/incentives/edit/:id" element={<RoutePermissionGuard resource="plot_sponsor" action={3}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />
    <Route path="plots/closings" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotIncentivesPage /></RoutePermissionGuard>} />
    <Route path="plots/closings/new" element={<RoutePermissionGuard resource="plot_sponsor" action={2}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />
    <Route path="plots/closings/edit/:id" element={<RoutePermissionGuard resource="plot_sponsor" action={3}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />

    <Route path="*" element={<Errorpage />} />
  </Route>
);

const employeeRoutes = (
  <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['employee']} />}>
    <Route index element={<EmployeeDashboard />} />
    <Route path="empattandence" element={<EmpAttenPerformance />} />
    <Route path="profile" element={<EmployeeProfile />} />
    <Route path="leave-request" element={<EmpLeave />} />
    <Route path="my-leave-ledger" element={<MyLeaveLedger />} />
    <Route path="my-ledger" element={<EmployeeFinancialLedger />} />
    <Route path="setting" element={<Setting />} />
    <Route path="*" element={<Errorpage />} />
  </Route>
);

const sponsorRoutes = (
  <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['sponsor']} />}>
    <Route index element={<BusinessDeveloperDashboard />} />
    <Route path="sponsor-dashboard" element={<BusinessDeveloperDashboard />} />
    <Route path="business-developer-dashboard" element={<BusinessDeveloperDashboard />} />
    <Route path="ledger" element={<BusinessDeveloperLedgerPage />} />
    <Route path="ledger/:id" element={<LedgerDetailPage />} />
    <Route path="plots/business-developer/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
    <Route path="plots/business-developers/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
    <Route path="plots/business-developer/:id/business-report" element={<BusinessDeveloperReportPage />} />
    <Route path="plots/business-developers/:id/business-report" element={<BusinessDeveloperReportPage />} />
    <Route path="plots/sponsors/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
    <Route path="plots/sponsors/:id/business-report" element={<BusinessDeveloperReportPage />} />
    <Route path="plots/sponsor-ledger/:id" element={<BusinessDeveloperLedgerPage />} />
    <Route path="my-business" element={<BusinessDeveloperReportPage />} />
    <Route path="my-network" element={<BusinessDeveloperNetworkPage />} />
    <Route path="my-customers" element={<BusinessDeveloperNetworkPage />} />
    <Route path="network" element={<BusinessDeveloperNetworkPage />} />
    <Route path="plots/business-developer/:id/network" element={<BusinessDeveloperNetworkPage />} />
    <Route path="my-bookings" element={<BusinessDeveloperBookingsPage />} />
    <Route path="plots/bookings" element={<BusinessDeveloperBookingsPage />} />
    <Route path="plots/booking/:id" element={<PlotBookingDetails />} />
    <Route path="plots/bookings/:id" element={<PlotBookingDetails />} />
    <Route path="plots/booking/:id/ledger" element={<PlotBookingLedgerPage />} />
    <Route path="plots/bookings/:id/ledger" element={<PlotBookingLedgerPage />} />
    <Route path="plots/certificates/:id" element={<BookingCertificateViewer />} />
    <Route path="plots/product-certificates/:id" element={<BookingCertificateViewer />} />
    <Route path="plots/product-agreements/:id" element={<ProductAgreementViewer />} />
    <Route path="plots/receipts/:id" element={<ReceiptViewer />} />
    <Route path="profile" element={<AdminManagerProfile />} />
    <Route path="*" element={<Errorpage />} />
  </Route>
);

const developerRoutes = (
  <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['developer']} />}>
    <Route index element={<DeveloperDashboard />} />
    <Route path="permission" element={<Permission />} />
    <Route path="api-monitor" element={<ApiMonitor />} />
    <Route path="error-logs" element={<ErrorLogs />} />
    <Route path="activity-logs" element={<ActivityLogs />} />
  </Route>
);

// 🔹 Role-based route definitions
const routesByRole = {
  admin: managementRoutes,
  superadmin: managementRoutes,
  demo: managementRoutes,
  manager: managementRoutes,
  accountant: managementRoutes,
  cashier: managementRoutes,
  hr: managementRoutes,
  sales: managementRoutes,
  operator: managementRoutes,
  auditor: managementRoutes,
  staff: managementRoutes,
  other: managementRoutes,
  employee: employeeRoutes,
  sponsor: sponsorRoutes,
  developer: developerRoutes,
};

function App() {
  const dispatch = useDispatch();
  const { islogin } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const primaryColor = useSelector((state) => state.user.primaryColor) || "#115e59";

  const effectiveRole = user?.profile?.role || getRoleFromToken();

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (token) {
      if (isTokenValid(token)) {
        if (!islogin) {
          dispatch(setlogin(true));
        }
      } else {
        // Token exists but is expired or invalid — purge immediately
        clearAuthSession(dispatch, false);
      }
    } else if (islogin) {
      // Redux thought we're logged in, but token is missing — purge immediately
      clearAuthSession(dispatch, false);
    }
  }, [islogin, dispatch]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (!islogin || !isTokenValid(token)) return;

    const role = effectiveRole;
    if (MANAGEMENT_ROLES.includes(role)) {
      dispatch(FirstFetch());
    } else if (role === 'employee') {
      dispatch(empFirstFetch());
    }
  }, [islogin, effectiveRole, dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (islogin && isTokenValid(token)) {
      jwtcheck();
    }
  }, [islogin]);

  const tokenErrors = {
    "jwt expired": ['Session Expired', 'Your session has expired. Please log in again.'],
    "Invalid Token": ['Invalid Token', 'You need to log in again.']
  };

  const jwtcheck = async () => {
    try {
      const token = localStorage.getItem('emstoken');
      if (!token || !isTokenValid(token)) {
        clearAuthSession(dispatch, false);
        return;
      }
      const responsee = await fetch(`${import.meta.env.VITE_API_ADDRESS}jwtcheck`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (responsee.status === 401) {
        clearAuthSession(dispatch, false);
        navigate('/login', { replace: true });
        return;
      }

      const data = await responsee.json();

      if (tokenErrors[data.message]) {
        const title = tokenErrors[data.message][0];
        const text = tokenErrors[data.message][1];
        clearAuthSession(dispatch, false);
        swal({
          title, text, icon: 'warning',
          button: {
            text: 'OK',
          },
        }).then(() => {
          navigate('/login', { replace: true });
        });
      }
    } catch (error) {
      console.log("Token check:", error);
    }
  };

  const hasValidAuth = islogin && isTokenValid(typeof window !== 'undefined' ? localStorage.getItem('emstoken') : null);
  const roleRoute = hasValidAuth && effectiveRole ? routesByRole[effectiveRole] || [] : [];

  useEffect(() => {
    if (hasValidAuth && user?.liveAttandence && ["superadmin", "admin", "manager", "demo"].includes(user?.profile?.role)) {
      const es = connectSSE((data) => {
        // console.log("sse se event ayaa")
        if (data.type === "attendance_update") {
          const emp = data.payload.data.employeeId;

          if (data.payload.action === "checkin") {
            if (user?.notificationSoundEnabled ?? true) {
              notificationSound.playSuccess();
            }
            toast.info(
              <div className="flex items-center gap-2 pr-1">
                {emp.profileimage ? (
                  <img src={emp.profileimage} alt={emp.employeename} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {emp.userid?.name?.charAt(0) || <User size={14} />}
                  </div>
                )}
                <span className="text-[14px]">
                  <span className="text-green-700 capitalize font-semibold">
                    {emp.userid?.name}
                  </span>{" "}
                  has Punched In at{" "}
                  <span className="text-green-700">
                    {dayjs(data.payload.data.punchIn).format("hh:mm A")}
                  </span>
                </span>
              </div>,
              { duration: 20000 }
            );
            window.dispatchEvent(new CustomEvent('attendance_updated', { detail: data.payload }));
          }

          if (data.payload.action === "checkOut") {
            if (user?.notificationSoundEnabled ?? true) {
              notificationSound.playPunchOut();
            }
            toast.info(
              <div className="flex items-center gap-2 pr-1">
                {emp.profileimage ? (
                  <img src={emp.profileimage} alt={emp.employeename} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    {emp.userid?.name?.charAt(0) || <User size={14} />}
                  </div>
                )}
                <span className="text-[14px]">
                  <span className="text-amber-700 capitalize font-semibold">
                    {emp.userid?.name}
                  </span>{" "}
                  has Punched Out at{" "}
                  <span className="text-amber-700">
                    {dayjs(data.payload.data.punchOut).format("hh:mm A")}
                  </span>
                </span>
              </div>,
              { duration: 20000 }
            );
            window.dispatchEvent(new CustomEvent('attendance_updated', { detail: data.payload }));
          }
        }
      });

      return () => {
        closeSSE();
      };
    }
  }, [user?.liveAttandence, user?.notificationSoundEnabled]);

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={true}
        visibleToasts={6}
        gap={10}
        duration={5000}
        toastOptions={{
          style: {
            fontSize: '13px',
            padding: '12px 16px',
            borderRadius: '12px',
          },
        }}
      />
      <ScrollToTop />
      <Suspense
        fallback={<div className="flex items-center justify-center h-screen w-screen bg-white">
          <div className="relative">
            <Settings
              className="animate-spin"
              style={{ animationDuration: "2.5s" }}
              size={60}
              color="teal"
            />
            <Settings
              className="absolute -bottom-4 left-0 animate-spin"
              style={{ animationDuration: "3s" }}
              size={25}
              color="teal"
            />
          </div>
        </div>}
      >
        {hasValidAuth && !effectiveRole ? (
          <div className="flex items-center justify-center h-screen w-screen bg-white">
            <div className="relative">
              <Settings
                className="animate-spin"
                style={{ animationDuration: "2.5s" }}
                size={60}
                color="teal"
              />
              <Settings
                className="absolute -bottom-4 left-0 animate-spin"
                style={{ animationDuration: "3s" }}
                size={25}
                color="teal"
              />
            </div>
          </div>
        ) : (
          <Routes>
            {/* Public routes */}
            <Route path="/resetpassword/:token" element={<PasswordReset />} />

            <Route
              path="/login"
              element={hasValidAuth ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/"
              element={!hasValidAuth ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/logout" element={<Logout />} />

            {/* Role based routes */}
            {roleRoute}

            {/* Fallback */}
            <Route
              path="*"
              element={!hasValidAuth ? <Navigate to="/login" replace /> : <Errorpage />}
            />
          </Routes>
        )}
      </Suspense>
    </>
  );
}

export default App;
