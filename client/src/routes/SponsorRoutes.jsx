import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoutes from '../utils/protectedRoute';

// 🔹 Lazy imports scoped exclusively to Business Associates & Partners
const BusinessDeveloperDashboard = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperDashboard'));
const BusinessDeveloperLedgerPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperLedgerPage'));
const LedgerDetailPage = lazy(() => import('../pages/admin/ledger/ledgerdetailpage'));
const BusinessDeveloperReportPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperReportPage'));
const BusinessDeveloperNetworkPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperNetworkPage'));
const CustomerPlansPage = lazy(() => import('../pages/plots/businessDevelopers/CustomerPlansPage'));
const CommissionStructurePage = lazy(() => import('../pages/plots/businessDevelopers/CommissionStructurePage'));
const PlotPriceCalculatorPage = lazy(() => import('../pages/plots/businessDevelopers/PlotPriceCalculatorPage'));
const PlotAvailabilityPage = lazy(() => import('../pages/plots/availability/PlotAvailabilityPage'));
const BusinessDeveloperBookingsPage = lazy(() => import('../pages/plots/businessDevelopers/BusinessDeveloperBookingsPage'));
const PlotBookingDetails = lazy(() => import('../pages/plots/booking/PlotBookingDetails'));
const PlotBookingLedgerPage = lazy(() => import('../pages/plots/booking/PlotBookingLedgerPage'));
const BookingCertificateViewer = lazy(() => import('../pages/plots/printViewers/BookingCertificateViewer'));
const ProductAgreementViewer = lazy(() => import('../pages/plots/printViewers/ProductAgreementViewer'));
const ReceiptViewer = lazy(() => import('../pages/plots/printViewers/ReceiptViewer'));
const AdminManagerProfile = lazy(() => import('../pages/profile/adminManagerProfile'));
const Errorpage = lazy(() => import('../pages/error/Errorpage'));

const SponsorRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoutes allowedRoles={['sponsor']} />}>
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
      <Route path="my-plans" element={<CustomerPlansPage />} />
      <Route path="plans" element={<CustomerPlansPage />} />
      <Route path="plots/plans" element={<CustomerPlansPage />} />
      <Route path="my-commission-rates" element={<CommissionStructurePage />} />
      <Route path="commission-structure" element={<CommissionStructurePage />} />
      <Route path="price-calculator" element={<PlotPriceCalculatorPage />} />
      <Route path="plot-availability" element={<PlotAvailabilityPage />} />
      <Route path="plots/commission-structure" element={<CommissionStructurePage />} />
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
  </Routes>
);

export default SponsorRoutes;
