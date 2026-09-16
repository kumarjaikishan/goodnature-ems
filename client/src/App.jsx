import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, Suspense, lazy } from 'react';
import { FirstFetch } from '../store/userSlice';
import { empFirstFetch } from '../store/employee';
import { setlogin } from '../store/authSlice';
import ProtectedRoutes from './utils/protectedRoute';
import { Settings, User } from 'lucide-react';
import { connectSSE, closeSSE } from "./utils/sse";
import dayjs from 'dayjs';

import ScrollToTop from './components/ScrollToTop';
import { swal } from './utils/confirmDialog';
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
const LedgerListPage = lazy(() => import('./pages/admin/ledger/ledgerpagelist'));
const LedgerDetailPage = lazy(() => import('./pages/admin/ledger/ledgerdetailpage'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const VoucherList = lazy(() => import('./pages/vouchers/VoucherList'));
const VoucherDetails = lazy(() => import('./pages/vouchers/VoucherDetails'));
const LeavePolicyManager = lazy(() => import('./pages/admin/leave/LeavePolicyManager'));
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
const PlotDashboard = lazy(() => import('./pages/plots/dashboard/PlotDashboard'));
const PlotInventory = lazy(() => import('./pages/plots/seriesMaster/PlotInventory'));
const PlotBusinessDevelopers = lazy(() => import('./pages/plots/businessDevelopers/PlotBusinessDevelopers'));
const PlotCustomers = lazy(() => import('./pages/plots/customers/PlotCustomers'));
const PlotCustomerFormPage = lazy(() => import('./pages/plots/customers/PlotCustomerFormPage'));
const PlotBooking = lazy(() => import('./pages/plots/booking/PlotBooking'));
const PlotBookingFormPage = lazy(() => import('./pages/plots/booking/PlotBookingFormPage'));
const PlotBookingDetails = lazy(() => import('./pages/plots/booking/PlotBookingDetails'));
const InstallmentCollection = lazy(() => import('./pages/plots/installments/InstallmentCollection'));
const PlotSeriesMaster = lazy(() => import('./pages/plots/seriesMaster/PlotSeriesMaster'));
const PlotReports = lazy(() => import('./pages/plots/reports/PlotReports'));
const PlotPayoutLedgerPage = lazy(() => import('./pages/plots/incentives/PlotPayoutLedgerPage'));
const PlotAgreementViewer = lazy(() => import('./pages/plots/printViewers/PlotAgreementViewer'));
const BookingCertificateViewer = lazy(() => import('./pages/plots/printViewers/BookingCertificateViewer'));
const ReceiptViewer = lazy(() => import('./pages/plots/printViewers/ReceiptViewer'));
const PlotPayoutVoucherPrint = lazy(() => import('./pages/plots/incentives/PlotPayoutVoucherPrint'));
const PlotInterestCalculator = lazy(() => import('./pages/plots/calculator/PlotInterestCalculator'));
const BusinessDeveloperLedgerPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperLedgerPage'));
const BusinessDeveloperDashboard = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperDashboard'));
const BusinessDeveloperReportPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperReportPage'));
const BusinessDeveloperBookingsPage = lazy(() => import('./pages/plots/businessDevelopers/BusinessDeveloperBookingsPage'));
const PlotIncentivesPage = lazy(() => import('./pages/plots/incentives/PlotIncentivesPage'));
const PlotIncentiveProcessPage = lazy(() => import('./pages/plots/incentives/PlotIncentiveProcessPage'));
const PlotClosingsPage = lazy(() => import('./pages/plots/incentives/PlotIncentivesPage'));
const PlotClosingProcessPage = lazy(() => import('./pages/plots/incentives/PlotIncentiveProcessPage'));
const PlotPurchasePage = lazy(() => import('./pages/plots/purchase/PlotPurchasePage'));
const PlotKisanLedgerPage = lazy(() => import('./pages/plots/purchase/PlotKisanLedgerPage'));
const PlotBookingEditPage = lazy(() => import('./pages/plots/booking/PlotBookingEditPage'));

// Investments (RD / FD)
const InvestmentDashboard = lazy(() => import('./pages/investments/InvestmentDashboard'));
const InvestmentSchemeMaster = lazy(() => import('./pages/investments/InvestmentSchemeMaster'));
const InvestmentNewAccount = lazy(() => import('./pages/investments/InvestmentNewAccount'));
const InvestmentAccountsLedger = lazy(() => import('./pages/investments/InvestmentAccountsLedger'));
const InvestmentCollections = lazy(() => import('./pages/investments/InvestmentCollections'));
const InvestmentDuesReport = lazy(() => import('./pages/investments/InvestmentDuesReport'));
const InvestmentSettlementPage = lazy(() => import('./pages/investments/InvestmentSettlementPage'));
const InvestmentCertificateViewer = lazy(() => import('./pages/investments/InvestmentCertificateViewer'));
const InvestmentPassbookViewer = lazy(() => import('./pages/investments/InvestmentPassbookViewer'));
const InvestmentReceiptViewer = lazy(() => import('./pages/investments/InvestmentReceiptViewer'));

// 🔹 Role-based route definitions
const routesByRole = {
  admin: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['admin']} />}>
      <Route index element={<AdminDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="organization" element={<OrganizationSettings />} />
      <Route path="organization/company" element={<CompanyInfoPage />} />
      <Route path="organization/branches" element={<BranchManagerPage />} />
      <Route path="organization/departments" element={<DepartmentPage />} />
      <Route path="organization/devices" element={<DeviceManagementPage />} />
      <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
      <Route path="organization/admin" element={<AdminManagerPage />} />
      <Route path="organization/rules" element={<AttendanceRulesPage />} />
      <Route path="organization/payroll" element={<PayrollPoliciesPage />} />
      <Route path="organization/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence-import" element={<AttendanceExcelImport />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="holiday" element={<HolidayForm />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="setting" element={<Setting />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="vouchers" element={<VoucherList />} />
      <Route path="vouchers/:id" element={<VoucherDetails />} />
      <Route path="leave-policies" element={<LeavePolicyManager />} />
      <Route path="plots/dashboard" element={<PlotDashboard />} />
      <Route path="plots/purchase" element={<PlotPurchasePage />} />
      <Route path="plots/purchase/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/agreements" element={<PlotPurchasePage />} />
      <Route path="plots/kisan-land" element={<PlotPurchasePage />} />
      <Route path="plots/kisan-ledger/:id" element={<PlotKisanLedgerPage />} />
      <Route path="plots/agreements/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/kisan-land/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/inventory" element={<PlotSeriesMaster />} />
      <Route path="plots/business-developer" element={<PlotBusinessDevelopers />} />
      <Route path="plots/business-developers" element={<PlotBusinessDevelopers />} />
      <Route path="plots/business-developer/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/business-developers/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/business-developer/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/business-developers/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/sponsors" element={<PlotBusinessDevelopers />} />
      <Route path="plots/sponsors/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/sponsors/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/sponsor-ledger/:id" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/customers" element={<PlotCustomers />} />
      <Route path="plots/customers/new" element={<PlotCustomerFormPage />} />
      <Route path="plots/customers/edit/:id" element={<PlotCustomerFormPage />} />
      <Route path="plots/booking" element={<PlotReports />} />
      <Route path="plots/addbooking" element={<PlotBooking />} />
      <Route path="plots/booking/new" element={<PlotBookingFormPage />} />
      <Route path="plots/booking/:id" element={<PlotBookingDetails />} />
      <Route path="plots/bookings/:id" element={<PlotBookingDetails />} />
      <Route path="plots/booking/edit/:id" element={<PlotBookingEditPage />} />
      <Route path="plots/installments" element={<InstallmentCollection />} />
      <Route path="plots/collections/downpayment" element={<InstallmentCollection type="DOWNPAYMENT" />} />
      <Route path="plots/collections/emi" element={<InstallmentCollection type="EMI" />} />
      <Route path="plots/series-master" element={<PlotSeriesMaster />} />
      <Route path="plots/reports" element={<PlotReports />} />
      <Route path="plots/payout-ledger" element={<PlotPayoutLedgerPage />} />
      <Route path="plots/agreements/:id" element={<PlotAgreementViewer />} />
      <Route path="plots/certificates/:id" element={<BookingCertificateViewer />} />
      <Route path="plots/receipts/:id" element={<ReceiptViewer />} />
      <Route path="plots/vouchers/:id" element={<PlotPayoutVoucherPrint />} />
      <Route path="plots/interest-calculator" element={<PlotInterestCalculator />} />
      <Route path="plots/incentives" element={<PlotIncentivesPage />} />
      <Route path="plots/incentives/new" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/incentives/edit/:id" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/closings" element={<PlotIncentivesPage />} />
      <Route path="plots/closings/new" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/closings/edit/:id" element={<PlotIncentiveProcessPage />} />

      {/* Investments (RD / FD) */}
      <Route path="investments/dashboard" element={<InvestmentDashboard />} />
      <Route path="investments/schemes" element={<InvestmentSchemeMaster />} />
      <Route path="investments/new" element={<InvestmentNewAccount />} />
      <Route path="investments/accounts" element={<InvestmentAccountsLedger />} />
      <Route path="investments/collections" element={<InvestmentCollections />} />
      <Route path="investments/dues" element={<InvestmentDuesReport />} />
      <Route path="investments/settlement" element={<InvestmentSettlementPage />} />
      <Route path="investments/certificates/:id" element={<InvestmentCertificateViewer />} />
      <Route path="investments/passbook/:id" element={<InvestmentPassbookViewer />} />
      <Route path="investments/receipts/:id" element={<InvestmentReceiptViewer />} />

      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  demo: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['demo']} />}>
      <Route index element={<AdminDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="organization" element={<OrganizationSettings />} />
      <Route path="organization/company" element={<CompanyInfoPage />} />
      <Route path="organization/branches" element={<BranchManagerPage />} />
      <Route path="organization/departments" element={<DepartmentPage />} />
      <Route path="organization/devices" element={<DeviceManagementPage />} />
      <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
      <Route path="organization/admin" element={<AdminManagerPage />} />
      <Route path="organization/rules" element={<AttendanceRulesPage />} />
      <Route path="organization/payroll" element={<PayrollPoliciesPage />} />
      <Route path="organization/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence-import" element={<AttendanceExcelImport />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="holiday" element={<HolidayForm />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="setting" element={<Setting />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="vouchers" element={<VoucherList />} />
      <Route path="vouchers/:id" element={<VoucherDetails />} />
      <Route path="leave-policies" element={<LeavePolicyManager />} />
      <Route path="plots/dashboard" element={<PlotDashboard />} />
      <Route path="plots/purchase" element={<PlotPurchasePage />} />
      <Route path="plots/purchase/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/agreements" element={<PlotPurchasePage />} />
      <Route path="plots/kisan-land" element={<PlotPurchasePage />} />
      <Route path="plots/kisan-ledger/:id" element={<PlotKisanLedgerPage />} />
      <Route path="plots/agreements/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/kisan-land/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/inventory" element={<PlotSeriesMaster />} />
      <Route path="plots/business-developer" element={<PlotBusinessDevelopers />} />
      <Route path="plots/business-developers" element={<PlotBusinessDevelopers />} />
      <Route path="plots/business-developer/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/business-developers/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/business-developer/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/business-developers/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/sponsors" element={<PlotBusinessDevelopers />} />
      <Route path="plots/sponsors/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/sponsors/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/sponsor-ledger/:id" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/customers" element={<PlotCustomers />} />
      <Route path="plots/customers/new" element={<PlotCustomerFormPage />} />
      <Route path="plots/customers/edit/:id" element={<PlotCustomerFormPage />} />
      <Route path="plots/booking" element={<PlotReports />} />
      <Route path="plots/addbooking" element={<PlotBooking />} />
      <Route path="plots/booking/new" element={<PlotBookingFormPage />} />
      <Route path="plots/booking/:id" element={<PlotBookingDetails />} />
      <Route path="plots/bookings/:id" element={<PlotBookingDetails />} />
      <Route path="plots/booking/edit/:id" element={<PlotBookingEditPage />} />
      <Route path="plots/installments" element={<InstallmentCollection />} />
      <Route path="plots/collections/downpayment" element={<InstallmentCollection type="DOWNPAYMENT" />} />
      <Route path="plots/collections/emi" element={<InstallmentCollection type="EMI" />} />
      <Route path="plots/series-master" element={<PlotSeriesMaster />} />
      <Route path="plots/reports" element={<PlotReports />} />
      <Route path="plots/payout-ledger" element={<PlotPayoutLedgerPage />} />
      <Route path="plots/agreements/:id" element={<PlotAgreementViewer />} />
      <Route path="plots/certificates/:id" element={<BookingCertificateViewer />} />
      <Route path="plots/receipts/:id" element={<ReceiptViewer />} />
      <Route path="plots/vouchers/:id" element={<PlotPayoutVoucherPrint />} />
      <Route path="plots/interest-calculator" element={<PlotInterestCalculator />} />
      <Route path="plots/incentives" element={<PlotIncentivesPage />} />
      <Route path="plots/incentives/new" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/incentives/edit/:id" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/closings" element={<PlotIncentivesPage />} />
      <Route path="plots/closings/new" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/closings/edit/:id" element={<PlotIncentiveProcessPage />} />
      {/* Investments (RD / FD) */}
      <Route path="investments/dashboard" element={<InvestmentDashboard />} />
      <Route path="investments/schemes" element={<InvestmentSchemeMaster />} />
      <Route path="investments/new" element={<InvestmentNewAccount />} />
      <Route path="investments/accounts" element={<InvestmentAccountsLedger />} />
      <Route path="investments/collections" element={<InvestmentCollections />} />
      <Route path="investments/dues" element={<InvestmentDuesReport />} />
      <Route path="investments/settlement" element={<InvestmentSettlementPage />} />
      <Route path="investments/certificates/:id" element={<InvestmentCertificateViewer />} />
      <Route path="investments/passbook/:id" element={<InvestmentPassbookViewer />} />
      <Route path="investments/receipts/:id" element={<InvestmentReceiptViewer />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),

  superadmin: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['superadmin']} />}>
      <Route index element={<AdminDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="organization" element={<OrganizationSettings />} />
      <Route path="organization/company" element={<CompanyInfoPage />} />
      <Route path="organization/branches" element={<BranchManagerPage />} />
      <Route path="organization/departments" element={<DepartmentPage />} />
      <Route path="organization/devices" element={<DeviceManagementPage />} />
      <Route path="organization/telegram" element={<TelegramIntegrationPage />} />
      <Route path="organization/admin" element={<AdminManagerPage />} />
      <Route path="organization/rules" element={<AttendanceRulesPage />} />
      <Route path="organization/payroll" element={<PayrollPoliciesPage />} />
      <Route path="organization/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence-import" element={<AttendanceExcelImport />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="holiday" element={<HolidayForm />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="setting" element={<Setting />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="vouchers" element={<VoucherList />} />
      <Route path="vouchers/:id" element={<VoucherDetails />} />
      <Route path="leave-policies" element={<LeavePolicyManager />} />
      <Route path="plots/dashboard" element={<PlotDashboard />} />
      <Route path="plots/purchase" element={<PlotPurchasePage />} />
      <Route path="plots/purchase/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/agreements" element={<PlotPurchasePage />} />
      <Route path="plots/kisan-land" element={<PlotPurchasePage />} />
      <Route path="plots/kisan-ledger/:id" element={<PlotKisanLedgerPage />} />
      <Route path="plots/agreements/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/kisan-land/:id/ledger" element={<PlotKisanLedgerPage />} />
      <Route path="plots/inventory" element={<PlotSeriesMaster />} />
      <Route path="plots/business-developer" element={<PlotBusinessDevelopers />} />
      <Route path="plots/business-developers" element={<PlotBusinessDevelopers />} />
      <Route path="plots/business-developer/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/business-developers/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/business-developer/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/business-developers/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/sponsors" element={<PlotBusinessDevelopers />} />
      <Route path="plots/sponsors/:id/ledger" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/sponsors/:id/business-report" element={<BusinessDeveloperReportPage />} />
      <Route path="plots/sponsor-ledger/:id" element={<BusinessDeveloperLedgerPage />} />
      <Route path="plots/customers" element={<PlotCustomers />} />
      <Route path="plots/customers/new" element={<PlotCustomerFormPage />} />
      <Route path="plots/customers/edit/:id" element={<PlotCustomerFormPage />} />
      <Route path="plots/booking" element={<PlotReports />} />
      <Route path="plots/addbooking" element={<PlotBooking />} />
      <Route path="plots/booking/new" element={<PlotBookingFormPage />} />
      <Route path="plots/booking/:id" element={<PlotBookingDetails />} />
      <Route path="plots/bookings/:id" element={<PlotBookingDetails />} />
      <Route path="plots/booking/edit/:id" element={<PlotBookingEditPage />} />
      <Route path="plots/installments" element={<InstallmentCollection />} />
      <Route path="plots/collections/downpayment" element={<InstallmentCollection type="DOWNPAYMENT" />} />
      <Route path="plots/collections/emi" element={<InstallmentCollection type="EMI" />} />
      <Route path="plots/series-master" element={<PlotSeriesMaster />} />
      <Route path="plots/reports" element={<PlotReports />} />
      <Route path="plots/payout-ledger" element={<PlotPayoutLedgerPage />} />
      <Route path="plots/agreements/:id" element={<PlotAgreementViewer />} />
      <Route path="plots/certificates/:id" element={<BookingCertificateViewer />} />
      <Route path="plots/receipts/:id" element={<ReceiptViewer />} />
      <Route path="plots/vouchers/:id" element={<PlotPayoutVoucherPrint />} />
      <Route path="plots/interest-calculator" element={<PlotInterestCalculator />} />
      <Route path="plots/incentives" element={<PlotIncentivesPage />} />
      <Route path="plots/incentives/new" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/incentives/edit/:id" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/closings" element={<PlotIncentivesPage />} />
      <Route path="plots/closings/new" element={<PlotIncentiveProcessPage />} />
      <Route path="plots/closings/edit/:id" element={<PlotIncentiveProcessPage />} />

      {/* Investments (RD / FD) */}
      <Route path="investments/dashboard" element={<InvestmentDashboard />} />
      <Route path="investments/schemes" element={<InvestmentSchemeMaster />} />
      <Route path="investments/new" element={<InvestmentNewAccount />} />
      <Route path="investments/accounts" element={<InvestmentAccountsLedger />} />
      <Route path="investments/collections" element={<InvestmentCollections />} />
      <Route path="investments/dues" element={<InvestmentDuesReport />} />
      <Route path="investments/settlement" element={<InvestmentSettlementPage />} />
      <Route path="investments/certificates/:id" element={<InvestmentCertificateViewer />} />
      <Route path="investments/passbook/:id" element={<InvestmentPassbookViewer />} />
      <Route path="investments/receipts/:id" element={<InvestmentReceiptViewer />} />

      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  manager: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['manager']} />}>
      <Route index element={<ManagerDashboard />} />
      <Route path="employe" element={<Employe />} />
      <Route path="attandence" element={<Attandence />} />
      <Route path="attandence_Report" element={<AttendanceReport />} />
      <Route path="leave-request" element={<Adminleave />} />
      <Route path="leave-ledger" element={<LeaveBalancePage />} />
      <Route path="advance" element={<EmployeeAdvancePage />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="setting" element={<Setting />} />
      <Route path="ledger" element={<LedgerListPage />} />
      <Route path="ledger/:id" element={<LedgerDetailPage />} />
      <Route path="performance/:userid" element={<AttenPerformance />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payroll/add" element={<PayrollCreatePage />} />
      <Route path="payroll/print/:id" element={<PayslipPrintPage />} />
      <Route path="payroll/edit/:id" element={<PayrollEdit />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  employee: (
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
  ),
  sponsor: (
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
      <Route path="my-bookings" element={<BusinessDeveloperBookingsPage />} />
      <Route path="plots/bookings" element={<BusinessDeveloperBookingsPage />} />
      <Route path="plots/booking/:id" element={<PlotBookingDetails />} />
      <Route path="plots/bookings/:id" element={<PlotBookingDetails />} />
      <Route path="profile" element={<AdminManagerProfile />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  ),
  developer: (
    <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={['developer']} />}>
      <Route index element={<DeveloperDashboard />} />
      <Route path="permission" element={<Permission />} />
      <Route path="api-monitor" element={<ApiMonitor />} />
      <Route path="error-logs" element={<ErrorLogs />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
    </Route>
  ),
};

function App() {
  const dispatch = useDispatch();
  const { islogin } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const primaryColor = useSelector((state) => state.user.primaryColor) || "#115e59";

  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem('emstoken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role || null;
    } catch {
      return null;
    }
  };

  const effectiveRole = user?.profile?.role || getRoleFromToken();

  useEffect(() => {
    const token = localStorage.getItem('emstoken');
    if (token && !islogin) {
      dispatch(setlogin(true));
    }
  }, [islogin, dispatch]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    const role = effectiveRole;

    if (['superadmin', 'admin', 'manager', 'demo'].includes(role)) {
      dispatch(FirstFetch());
    } else if (role === 'employee') {
      dispatch(empFirstFetch());
    }
  }, [islogin, effectiveRole, dispatch]);

  useEffect(() => {
    islogin && jwtcheck();
    console.log("islogin", islogin);
  }, [islogin]);

  const tokenErrors = {
    "jwt expired": ['Session Expired', 'Your session has expired. Please log in again.'],
    "Invalid Token": ['Invalid Token', 'You need to log in again.']
  }

  const jwtcheck = async () => {
    try {
      const token = localStorage.getItem('emstoken');
      if (!token) return;
      const responsee = await fetch(`${import.meta.env.VITE_API_ADDRESS}jwtcheck`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(responsee)
      const data = await responsee.json();
      console.log("jwt check", data);

      if (tokenErrors[data.message]) {
        const title = tokenErrors[data.message][0];
        const text = tokenErrors[data.message][1];
        swal({
          title, text, icon: 'warning',
          button: {
            text: 'OK',
          },
        }).then(() => {
          return navigate('/logout');
        });
      }
    } catch (error) {
      console.log("Token check:", error);
    }
  }

  const roleRoute = islogin && effectiveRole ? routesByRole[effectiveRole] || [] : [];

  useEffect(() => {
    if (islogin && user?.liveAttandence && ["superadmin", "admin", "manager", "demo"].includes(user?.profile?.role)) {
      const es = connectSSE((data) => {
        // console.log("sse se event ayaa")
        if (data.type === "attendance_update") {
          const emp = data.payload.data.employeeId;

          if (data.payload.action === "checkin") {
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
            dispatch(FirstFetch());
          }

          if (data.payload.action === "checkOut") {
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
            dispatch(FirstFetch());
          }
        }
      });

      return () => {
        closeSSE();
      };
    }
  }, [user?.liveAttandence]);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
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
        {islogin && !effectiveRole ? (
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
              element={islogin ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/"
              element={!islogin ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/logout" element={<Logout />} />

            {/* Role based routes */}
            {roleRoute}

            {/* Fallback */}
            <Route
              path="*"
              element={!islogin ? <Navigate to="/login" replace /> : <Errorpage />}
            />
          </Routes>
        )}
      </Suspense>
    </>
  );
}

export default App;
