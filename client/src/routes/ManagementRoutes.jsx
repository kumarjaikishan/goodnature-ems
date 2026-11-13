import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoutes from '../utils/protectedRoute';
import RoutePermissionGuard from '../utils/RoutePermissionGuard';

// 🔹 Lazy imports scoped exclusively to Operational / Management roles
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const Employe = lazy(() => import('../pages/admin/employee/Employe'));
const OrganizationSettings = lazy(() => import('../pages/admin/organization/organization'));
const CompanyInfoPage = lazy(() => import('../pages/admin/organization/pages/CompanyInfoPage'));
const BranchManagerPage = lazy(() => import('../pages/admin/organization/pages/BranchManagerPage'));
const DepartmentPage = lazy(() => import('../pages/admin/organization/pages/DepartmentPage'));
const DeviceManagementPage = lazy(() => import('../pages/admin/organization/pages/DeviceManagementPage'));
const TelegramIntegrationPage = lazy(() => import('../pages/admin/organization/pages/TelegramIntegrationPage'));
const AdminManagerPage = lazy(() => import('../pages/admin/organization/pages/AdminManagerPage'));
const AdminUserFormPage = lazy(() => import('../pages/admin/organization/pages/AdminUserFormPage'));
const AttendanceRulesPage = lazy(() => import('../pages/admin/organization/pages/AttendanceRulesPage'));
const PayrollPoliciesPage = lazy(() => import('../pages/admin/organization/pages/PayrollPoliciesPage'));
const LeavePoliciesPage = lazy(() => import('../pages/admin/organization/pages/LeavePoliciesPage'));
const Attandence = lazy(() => import('../pages/admin/attandence/Attandence'));
const AttenPerformance = lazy(() => import('../pages/admin/attandence/AttenPerformance'));
const Adminleave = lazy(() => import('../pages/admin/leave/Adminleave'));
const HolidayForm = lazy(() => import('../pages/holidays/Holiday'));
const Setting = lazy(() => import('../pages/settingPage'));
const AttendanceReport = lazy(() => import('../pages/report/attandenceReport'));
const PayrollPage = lazy(() => import('../pages/common/payroll/payroll'));
const PayrollCreatePage = lazy(() => import('../pages/common/payroll/payrollCreating'));
const PayrollEdit = lazy(() => import('../pages/common/payroll/payrollEdit'));
const PayslipPrintPage = lazy(() => import('../pages/common/payroll/payrollprint'));
const EmployeeAdvancePage = lazy(() => import('../pages/advance/advance'));
const EmployeeLedgerPage = lazy(() => import('../pages/admin/ledger/EmployeeLedgerPage'));
const SellerLedgerPage = lazy(() => import('../pages/admin/ledger/SellerLedgerPage'));
const BusinessAssociateLedgerPage = lazy(() => import('../pages/admin/ledger/BusinessAssociateLedgerPage'));
const BusinessPartnerLedgerPage = lazy(() => import('../pages/admin/ledger/BusinessPartnerLedgerPage'));
const BranchPartnerLedgerPage = lazy(() => import('../pages/admin/ledger/BranchPartnerLedgerPage'));
const BankLedgersPage = lazy(() => import('../pages/admin/ledger/BankLedgersPage'));
const CashLedgersPage = lazy(() => import('../pages/admin/ledger/CashLedgersPage'));
const FundTransfersPage = lazy(() => import('../pages/admin/ledger/FundTransfersPage'));
const LedgerDetailPage = lazy(() => import('../pages/admin/ledger/ledgerdetailpage'));
const VoucherList = lazy(() => import('../pages/vouchers/VoucherList'));
const VoucherDetails = lazy(() => import('../pages/vouchers/VoucherDetails'));
const AttendanceExcelImport = lazy(() => import('../pages/admin/attandence/AttendanceExcelImport'));
const ActivityLogs = lazy(() => import('../pages/admin/activityLogs/ActivityLogs'));
const AdminManagerProfile = lazy(() => import('../pages/profile/adminManagerProfile'));
const LeaveBalancePage = lazy(() => import('../pages/leaveledger/leaveledger'));

// Plot Management
const PlotBusinessDevelopers = lazy(() => import('../pages/plots/businessDevelopers/PlotBusinessDevelopers'));
const PlotCustomers = lazy(() => import('../pages/plots/customers/PlotCustomers'));
const PlotCustomerFormPage = lazy(() => import('../pages/plots/customers/PlotCustomerFormPage'));
const PlotBooking = lazy(() => import('../pages/plots/booking/PlotBooking'));
const PlotBookingDetails = lazy(() => import('../pages/plots/booking/PlotBookingDetails'));
const InstallmentCollection = lazy(() => import('../pages/plots/installments/InstallmentCollection'));
const ProductCollectionsPage = lazy(() => import('../pages/plots/products/ProductCollectionsPage'));
const PlotSeriesMaster = lazy(() => import('../pages/plots/seriesMaster/PlotSeriesMaster'));
const PlotProductsPage = lazy(() => import('../pages/plots/products/PlotProductsPage'));
const ProductSalesPage = lazy(() => import('../pages/plots/products/ProductSalesPage'));
const ProductBookingPage = lazy(() => import('../pages/plots/products/ProductBookingPage'));
const PlotReports = lazy(() => import('../pages/plots/reports/PlotReports'));
const PlotAgreementViewer = lazy(() => import('../pages/plots/printViewers/PlotAgreementViewer'));
const ProductAgreementViewer = lazy(() => import('../pages/plots/printViewers/ProductAgreementViewer'));
const BookingCertificateViewer = lazy(() => import('../pages/plots/printViewers/BookingCertificateViewer'));
const ReceiptViewer = lazy(() => import('../pages/plots/printViewers/ReceiptViewer'));
const PlotInterestCalculator = lazy(() => import('../pages/plots/calculator/PlotInterestCalculator'));
const BusinessDeveloperLedgerPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperLedgerPage'));
const BusinessDeveloperReportPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperReportPage'));
const BusinessDeveloperNetworkPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperNetworkPage'));
const CommissionStructurePage = lazy(() => import('../pages/plots/businessDevelopers/CommissionStructurePage'));
const CustomerPlansPage = lazy(() => import('../pages/plots/businessDevelopers/CustomerPlansPage'));
const PlotPriceCalculatorPage = lazy(() => import('../pages/plots/businessDevelopers/PlotPriceCalculatorPage'));
const PlotIncentivesPage = lazy(() => import('../pages/plots/incentives/PlotIncentivesPage'));
const PlotIncentiveProcessPage = lazy(() => import('../pages/plots/incentives/PlotIncentiveProcessPage'));
const PlotPurchasePage = lazy(() => import('../pages/plots/purchase/PlotPurchasePage'));
const PurchasersMasterPage = lazy(() => import('../pages/plots/purchase/PurchasersMasterPage'));
const PlotKisanLedgerPage = lazy(() => import('../pages/plots/purchase/PlotKisanLedgerPage'));
const PlotBookingEditPage = lazy(() => import('../pages/plots/booking/PlotBookingEditPage'));
const PlotBookingLedgerPage = lazy(() => import('../pages/plots/booking/PlotBookingLedgerPage'));
const Errorpage = lazy(() => import('../pages/error/Errorpage'));

export const MANAGEMENT_ROLES = [
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

const ManagementRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoutes allowedRoles={MANAGEMENT_ROLES} />}>
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
      <Route path="ledger/business-associates" element={<RoutePermissionGuard resource="associate_ledger" action={1}><BusinessAssociateLedgerPage /></RoutePermissionGuard>} />
      <Route path="ledger/business-partners" element={<RoutePermissionGuard resource="partner_ledger" action={1}><BusinessPartnerLedgerPage /></RoutePermissionGuard>} />
      <Route path="ledger/branch-partners" element={<RoutePermissionGuard resource="branch_ledger" action={1}><BranchPartnerLedgerPage /></RoutePermissionGuard>} />
      <Route path="ledger/banks" element={<RoutePermissionGuard resource="bank_ledger" action={1}><BankLedgersPage /></RoutePermissionGuard>} />
      <Route path="ledger/cash-accounts" element={<RoutePermissionGuard resource="cash_ledger" action={1}><CashLedgersPage /></RoutePermissionGuard>} />
      <Route path="ledger/transfers" element={<RoutePermissionGuard resource="fund_transfer" action={1}><FundTransfersPage /></RoutePermissionGuard>} />
      <Route path="ledger/:id" element={<RoutePermissionGuard resource={["ledger", "cash_ledger", "bank_ledger", "employee_ledger", "kisan_ledger", "associate_ledger", "partner_ledger", "branch_ledger"]} action={1}><LedgerDetailPage /></RoutePermissionGuard>} />
      <Route path="performance" element={<RoutePermissionGuard resource="attandence" action={1}><AttenPerformance /></RoutePermissionGuard>} />
      <Route path="performance/:userid" element={<RoutePermissionGuard resource="attandence" action={1}><AttenPerformance /></RoutePermissionGuard>} />
      <Route path="payroll" element={<RoutePermissionGuard resource="salary" action={1}><PayrollPage /></RoutePermissionGuard>} />
      <Route path="payroll/add" element={<RoutePermissionGuard resource="salary" action={2}><PayrollCreatePage /></RoutePermissionGuard>} />
      <Route path="payroll/print/:id" element={<RoutePermissionGuard resource="salary" action={1}><PayslipPrintPage /></RoutePermissionGuard>} />
      <Route path="payroll/edit/:id" element={<RoutePermissionGuard resource="salary" action={3}><PayrollEdit /></RoutePermissionGuard>} />
      <Route path="vouchers" element={<RoutePermissionGuard resource="voucher" action={1}><VoucherList /></RoutePermissionGuard>} />
      <Route path="vouchers/:id" element={<RoutePermissionGuard resource="voucher" action={1}><VoucherDetails /></RoutePermissionGuard>} />

      <Route path="plots/purchase" element={<RoutePermissionGuard resource={["plot_purchase", "plot_inventory"]} action={1}><PlotPurchasePage /></RoutePermissionGuard>} />
      <Route path="plots/purchasers" element={<RoutePermissionGuard resource={["purchasers_master", "plot_purchase", "plot_inventory"]} action={1}><PurchasersMasterPage /></RoutePermissionGuard>} />
      <Route path="plots/purchase/:id/ledger" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/agreements" element={<RoutePermissionGuard resource={["plot_purchase", "plot_inventory"]} action={1}><PlotPurchasePage /></RoutePermissionGuard>} />
      <Route path="plots/kisan-land" element={<RoutePermissionGuard resource={["plot_purchase", "plot_inventory"]} action={1}><PlotPurchasePage /></RoutePermissionGuard>} />
      <Route path="plots/kisan-ledger/:id" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/agreements/:id/ledger" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/kisan-land/:id/ledger" element={<RoutePermissionGuard resource="kisan_ledger" action={1}><PlotKisanLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/inventory" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotSeriesMaster /></RoutePermissionGuard>} />
      <Route path="plots/business-developer" element={<RoutePermissionGuard resource={["associate", "partner", "plot_sponsor"]} action={1}><PlotBusinessDevelopers /></RoutePermissionGuard>} />
      <Route path="plots/business-developers" element={<RoutePermissionGuard resource={["associate", "partner", "plot_sponsor"]} action={1}><PlotBusinessDevelopers /></RoutePermissionGuard>} />
      <Route path="plots/business-developer/:id/ledger" element={<RoutePermissionGuard resource={["associate_ledger", "partner_ledger", "branch_ledger", "ledger"]} action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/business-developers/:id/ledger" element={<RoutePermissionGuard resource={["associate_ledger", "partner_ledger", "branch_ledger", "ledger"]} action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/business-developer/:id/business-report" element={<RoutePermissionGuard resource="plot_reports" action={1}><BusinessDeveloperReportPage /></RoutePermissionGuard>} />
      <Route path="plots/business-developers/:id/business-report" element={<RoutePermissionGuard resource="plot_reports" action={1}><BusinessDeveloperReportPage /></RoutePermissionGuard>} />
      <Route path="plots/business-developer/:id/network" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><BusinessDeveloperNetworkPage /></RoutePermissionGuard>} />
      <Route path="plots/business-developers/:id/network" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><BusinessDeveloperNetworkPage /></RoutePermissionGuard>} />
      <Route path="plots/sponsors" element={<RoutePermissionGuard resource="plot_sponsor" action={1}><PlotBusinessDevelopers /></RoutePermissionGuard>} />
      <Route path="plots/sponsors/:id/ledger" element={<RoutePermissionGuard resource={["associate_ledger", "partner_ledger", "branch_ledger", "ledger"]} action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/sponsors/:id/business-report" element={<RoutePermissionGuard resource="plot_reports" action={1}><BusinessDeveloperReportPage /></RoutePermissionGuard>} />
      <Route path="plots/sponsor-ledger/:id" element={<RoutePermissionGuard resource={["associate_ledger", "partner_ledger", "branch_ledger", "ledger"]} action={1}><BusinessDeveloperLedgerPage /></RoutePermissionGuard>} />
      <Route path="plots/customers" element={<RoutePermissionGuard resource="plot_customer" action={1}><PlotCustomers /></RoutePermissionGuard>} />
      <Route path="plots/customers/new" element={<RoutePermissionGuard resource="plot_customer" action={2}><PlotCustomerFormPage /></RoutePermissionGuard>} />
      <Route path="plots/customers/edit/:id" element={<RoutePermissionGuard resource="plot_customer" action={3}><PlotCustomerFormPage /></RoutePermissionGuard>} />
      <Route path="plots/booking" element={<RoutePermissionGuard resource="plot_booking" action={1}><PlotReports /></RoutePermissionGuard>} />
      <Route path="plots/booking/new" element={<RoutePermissionGuard resource="plot_booking" action={2}><PlotBooking /></RoutePermissionGuard>} />
      <Route path="plots/addbooking" element={<Navigate to="/dashboard/plots/booking/new" replace />} />
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
      <Route path="plots/investment-booking" element={<RoutePermissionGuard resource="investment_booking" action={1}><ProductSalesPage /></RoutePermissionGuard>} />
      <Route path="plots/investment-booking/new" element={<RoutePermissionGuard resource="investment_booking" action={2}><ProductBookingPage /></RoutePermissionGuard>} />
      <Route path="plots/investment-booking/edit/:id" element={<RoutePermissionGuard resource="investment_booking" action={3}><ProductBookingPage /></RoutePermissionGuard>} />
      <Route path="plots/product-sales" element={<Navigate to="/dashboard/plots/investment-booking" replace />} />
      <Route path="plots/products/book" element={<Navigate to="/dashboard/plots/investment-booking/new" replace />} />
      <Route path="plots/products/edit/:id" element={<RoutePermissionGuard resource="investment_booking" action={3}><ProductBookingPage /></RoutePermissionGuard>} />
      <Route path="plots/reports" element={<RoutePermissionGuard resource="plot_reports" action={1}><PlotReports /></RoutePermissionGuard>} />
      <Route path="plots/agreements/:id" element={<RoutePermissionGuard resource={["plot_booking", "plot_purchase", "plot_inventory"]} action={1}><PlotAgreementViewer /></RoutePermissionGuard>} />
      <Route path="plots/product-agreements/:id" element={<RoutePermissionGuard resource={["investment_booking", "plot_booking", "plot_inventory"]} action={1}><ProductAgreementViewer /></RoutePermissionGuard>} />
      <Route path="plots/certificates/:id" element={<RoutePermissionGuard resource="plot_booking" action={1}><BookingCertificateViewer /></RoutePermissionGuard>} />
      <Route path="plots/product-certificates/:id" element={<RoutePermissionGuard resource="investment_booking" action={1}><BookingCertificateViewer /></RoutePermissionGuard>} />
      <Route path="plots/receipts/:id" element={<RoutePermissionGuard resource="plot_collection" action={1}><ReceiptViewer /></RoutePermissionGuard>} />
      <Route path="plots/interest-calculator" element={<RoutePermissionGuard resource="plot_inventory" action={1}><PlotInterestCalculator /></RoutePermissionGuard>} />
      <Route path="price-calculator" element={<PlotPriceCalculatorPage />} />
      <Route path="plots/price-calculator" element={<PlotPriceCalculatorPage />} />
      <Route path="my-plans" element={<CustomerPlansPage />} />
      <Route path="plans" element={<CustomerPlansPage />} />
      <Route path="plots/plans" element={<CustomerPlansPage />} />
      <Route path="my-commission-rates" element={<CommissionStructurePage />} />
      <Route path="commission-structure" element={<CommissionStructurePage />} />
      <Route path="plots/commission-structure" element={<CommissionStructurePage />} />
      <Route path="plots/incentives" element={<RoutePermissionGuard resource="plot_incentive" action={1}><PlotIncentivesPage /></RoutePermissionGuard>} />
      <Route path="plots/incentives/new" element={<RoutePermissionGuard resource="plot_incentive" action={2}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />
      <Route path="plots/incentives/edit/:id" element={<RoutePermissionGuard resource="plot_incentive" action={3}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />
      <Route path="plots/closings" element={<RoutePermissionGuard resource="plot_incentive" action={1}><PlotIncentivesPage /></RoutePermissionGuard>} />
      <Route path="plots/closings/new" element={<RoutePermissionGuard resource="plot_incentive" action={2}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />
      <Route path="plots/closings/edit/:id" element={<RoutePermissionGuard resource="plot_incentive" action={3}><PlotIncentiveProcessPage /></RoutePermissionGuard>} />

      <Route path="*" element={<Errorpage />} />
    </Route>
  </Routes>
);

export default ManagementRoutes;
