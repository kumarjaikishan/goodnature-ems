const router = require('express').Router();
const authmiddlewre = require('../middleware/auth_middleware');
const authorizeRoles = require('../middleware/Role_middleware');
const checkPermission = require('../middleware/checkpermission');
const upload = require('../middleware/multer_middleware');
const ctrl = require('../controllers/plots.controller');

router.use(authmiddlewre);
// Only staff roles and sponsors (for self-ledger) can touch the plots module
router.use(authorizeRoles('superadmin', 'admin', 'manager', 'demo', 'grant', 'sponsor'));

// ── Media Upload (Photos, Signatures, etc.) ──
router.post('/upload-media', upload.single('file'), ctrl.uploadMedia);

// ── Rate Config (part of inventory setup) ──
router.get('/rate-config', checkPermission('plot_inventory', 1), ctrl.getRateConfig);
router.put('/rate-config', checkPermission('plot_inventory', 3), ctrl.updateRateConfig);

// ── Commission Policy Config (Quarterly Target & Fixed Slabs) ──
router.get('/commission-policy', checkPermission('plot_inventory', 1), ctrl.getCommissionPolicy);
router.put('/commission-policy', checkPermission('plot_inventory', 3), ctrl.updateCommissionPolicy);

// ── Series Master (inventory setup) ──
router.post('/series', checkPermission('plot_inventory', 2), ctrl.createSeries);
router.get('/series', checkPermission('plot_inventory', 1), ctrl.getSeriesList);
router.get('/series/:id', checkPermission('plot_inventory', 1), ctrl.getSeriesById);
router.put('/series/:id', checkPermission('plot_inventory', 3), ctrl.updateSeries);
router.delete('/series/:id', checkPermission('plot_inventory', 4), ctrl.deleteSeries);

// ── Sponsors ──
router.get('/sponsors', checkPermission('plot_sponsor', 1), ctrl.getSponsors);
router.get('/sponsors/:id/dashboard', (req, res, next) => {
  // If the logged-in user is a sponsor requesting their own dashboard, bypass staff permission
  if (req.user?.role === 'sponsor' && (req.user.id === req.params.id || req.user._id === req.params.id)) {
    return next();
  }
  return checkPermission('plot_sponsor', 1)(req, res, next);
}, ctrl.getSponsorDashboardStats);
router.get('/sponsors/:id/ledger', (req, res, next) => {
  // If the logged-in user is a sponsor requesting their own ledger, bypass staff permission
  if (req.user?.role === 'sponsor' && (req.user.id === req.params.id || req.user._id === req.params.id)) {
    return next();
  }
  return checkPermission('plot_sponsor', 1)(req, res, next);
}, ctrl.getSponsorLedger);
router.get('/sponsors/:id/business-report', (req, res, next) => {
  // If the logged-in user is a sponsor requesting their own report, bypass staff permission
  if (req.user?.role === 'sponsor' && (req.user.id === req.params.id || req.user._id === req.params.id)) {
    return next();
  }
  return checkPermission('plot_sponsor', 1)(req, res, next);
}, ctrl.getSponsorBusinessReport);
router.post('/sponsors', checkPermission('plot_sponsor', 2), ctrl.createSponsor);
router.put('/sponsors/:id', checkPermission('plot_sponsor', 3), ctrl.updateSponsor);
router.delete('/sponsors/:id', checkPermission('plot_sponsor', 4), ctrl.deleteSponsor);
router.patch('/sponsors/:id/toggle-block', checkPermission('plot_sponsor', 3), ctrl.toggleSponsorBlock);
router.post('/sponsors/:id/reset-password', checkPermission('plot_sponsor', 3), ctrl.resetSponsorPassword);

// ── Customers ──
router.get('/customers', checkPermission('plot_customer', 1), ctrl.getCustomers);
router.get('/customers/:id', checkPermission('plot_customer', 1), ctrl.getCustomerById);
router.post('/customers', checkPermission('plot_customer', 2), ctrl.createCustomer);
router.put('/customers/:id', checkPermission('plot_customer', 3), ctrl.updateCustomer);
router.delete('/customers/:id', checkPermission('plot_customer', 4), ctrl.deleteCustomer);

// ── Bookings & Holds ──
router.post('/bookings', checkPermission('plot_booking', 2), ctrl.createBookingOrHold);
router.get('/bookings/list', (req, res, next) => {
  if (req.user?.role === 'sponsor') {
    req.query.sponsorId = req.user.id || req.user._id;
    return next();
  }
  return checkPermission('plot_booking', 1)(req, res, next);
}, ctrl.getBookings);
router.get('/bookings/:id', (req, res, next) => {
  if (req.user?.role === 'sponsor') {
    return next();
  }
  return checkPermission('plot_booking', 1)(req, res, next);
}, ctrl.getBookingById);
router.put('/bookings/:id', checkPermission('plot_booking', 3), ctrl.updateBooking);
router.put('/bookings/:id/approve', checkPermission('plot_booking', 3), ctrl.approveBooking);
router.put('/bookings/:id/reject', checkPermission('plot_booking', 3), ctrl.rejectBooking);
router.delete('/bookings/:id', checkPermission('plot_booking', 4), ctrl.deleteBooking);

// ── Installments & Collections ("take collection") ──
router.get('/bookings/:bookingId/installments', checkPermission('plot_collection', 1), ctrl.getInstallments);
router.get('/bookings/:bookingId/payouts', checkPermission('plot_payout', 1), ctrl.getPayoutSchedules);
router.post('/bookings/:bookingId/collect', checkPermission('plot_collection', 2), ctrl.collectInstallment);

// ── Receipts (part of collections) ──
router.get('/receipts/list', checkPermission('plot_collection', 1), ctrl.getReceipts);
router.get('/receipts/:id', checkPermission('plot_collection', 1), ctrl.getReceiptById);
router.put('/receipts/:id', checkPermission('plot_collection', 3), ctrl.updateReceipt);
router.delete('/receipts/:id', checkPermission('plot_collection', 4), ctrl.deleteReceipt);
router.put('/receipts/:id/approve', checkPermission('plot_collection', 3), ctrl.approveReceipt);
router.put('/receipts/:id/reject', checkPermission('plot_collection', 3), ctrl.rejectReceipt);

// ── Dashboard & Reports ──
router.get('/dashboard/stats', checkPermission('plot_reports', 1), ctrl.getDashboardStats);
router.get('/reports/:type', checkPermission('plot_reports', 1), ctrl.getReportsData);

// ── Commission Closings ──
router.get('/closings/preview', checkPermission('plot_sponsor', 1), ctrl.previewPlotClosing);
router.post('/closings', checkPermission('plot_sponsor', 2), ctrl.createPlotClosing);
router.get('/closings', checkPermission('plot_sponsor', 1), ctrl.getPlotClosings);
router.get('/closings/:id', checkPermission('plot_sponsor', 1), ctrl.getPlotClosingById);
router.put('/closings/:id', checkPermission('plot_sponsor', 3), ctrl.updatePlotClosing);
router.delete('/closings/:id', checkPermission('plot_sponsor', 4), ctrl.deletePlotClosing);

// ── Weekly Payouts (money going back OUT to the customer) ──
router.post('/bookings/:id/payout/initialize', checkPermission('plot_payout', 2), ctrl.initializePlotPayout);
router.post('/bookings/:id/payout/pay', checkPermission('plot_payout', 2), ctrl.collectPlotPayoutPayment);
router.get('/bookings/:id/payout/ledger', checkPermission('plot_payout', 1), ctrl.getPlotPayoutLedger);
router.get('/payout-vouchers/:id', checkPermission('plot_payout', 1), ctrl.getPlotPayoutVoucher);
router.delete('/payout-vouchers/:id', checkPermission('plot_payout', 4), ctrl.deletePlotPayoutVoucher);
router.put('/payout-vouchers/:id', checkPermission('plot_payout', 3), ctrl.updatePlotPayoutVoucher);

// ── Kisan Land Agreements & Land Stock Pooling ──
router.post('/kisan-agreements/upload-document', upload.single('file'), ctrl.uploadLandDocument);
router.post('/kisan-agreements', checkPermission('plot_inventory', 2), ctrl.createKisanAgreement);
router.get('/kisan-agreements', checkPermission('plot_inventory', 1), ctrl.getKisanAgreements);
router.get('/kisan-agreements/sources', checkPermission('plot_inventory', 1), ctrl.getAvailableLandStockSources);
router.get('/kisan-agreements/:id', checkPermission('plot_inventory', 1), ctrl.getKisanAgreementById);
router.put('/kisan-agreements/:id', checkPermission('plot_inventory', 3), ctrl.updateKisanAgreement);
router.delete('/kisan-agreements/:id', checkPermission('plot_inventory', 4), ctrl.deleteKisanAgreement);
router.post('/kisan-agreements/:id/deeds', checkPermission('plot_inventory', 2), ctrl.addRegistryDeed);
router.put('/kisan-agreements/:agreementId/deeds/:deedId', checkPermission('plot_inventory', 3), ctrl.updateRegistryDeed);
router.delete('/kisan-agreements/:agreementId/deeds/:deedId', checkPermission('plot_inventory', 4), ctrl.deleteRegistryDeed);
router.post('/kisan-agreements/:id/payments', checkPermission('plot_inventory', 2), ctrl.recordKisanPayment);

// ── Kisan / Seller Directory Master ──
router.get('/kisan-sellers', checkPermission('plot_inventory', 1), ctrl.getKisanSellers);
router.post('/kisan-sellers', checkPermission('plot_inventory', 2), ctrl.createKisanSeller);
router.put('/kisan-sellers/:id', checkPermission('plot_inventory', 3), ctrl.updateKisanSeller);
router.delete('/kisan-sellers/:id', checkPermission('plot_inventory', 4), ctrl.deleteKisanSeller);

// ── Purchaser / Buyer Directory Master ──
router.get('/purchasers', checkPermission('plot_inventory', 1), ctrl.getPurchasers);
router.post('/purchasers', checkPermission('plot_inventory', 2), ctrl.createPurchaser);
router.put('/purchasers/:id', checkPermission('plot_inventory', 3), ctrl.updatePurchaser);
router.put('/purchasers/:id/set-default', checkPermission('plot_inventory', 3), ctrl.setDefaultPurchaser);
router.delete('/purchasers/:id', checkPermission('plot_inventory', 4), ctrl.deletePurchaser);

// ── Booking Restructuring, Customer Refund & Revisions ──
router.post('/bookings/:id/restructure', checkPermission('plot_booking', 3), ctrl.restructureBooking);
router.post('/bookings/:id/refund', checkPermission('plot_booking', 3), ctrl.processCustomerRefund);
router.get('/bookings/:id/revisions', checkPermission('plot_booking', 1), ctrl.getBookingRevisions);
router.put('/bookings/revisions/:revisionId/narration', checkPermission('plot_booking', 3), ctrl.updateBookingRevisionNarration);

// ── Plot Products & Fractional Units (Master & Sales) ──
router.get('/products/tenures', checkPermission('plot_inventory', 1), ctrl.getAvailableProductTenures);
router.get('/products', checkPermission('plot_inventory', 1), ctrl.getPlotProducts);
router.post('/products', checkPermission('plot_inventory', 2), ctrl.createPlotProduct);
router.get('/products/:id', checkPermission('plot_inventory', 1), ctrl.getPlotProductById);
router.put('/products/:id', checkPermission('plot_inventory', 3), ctrl.updatePlotProduct);
router.delete('/products/:id', checkPermission('plot_inventory', 4), ctrl.deletePlotProduct);

// ── Product Sales / Bookings & Installment Collections ──
router.get('/product-bookings', checkPermission('plot_booking', 1), ctrl.getProductBookings);
router.post('/product-bookings', checkPermission('plot_booking', 2), ctrl.createProductBooking);
router.get('/product-bookings/:id', checkPermission('plot_booking', 1), ctrl.getProductBookingById);
router.put('/product-bookings/:id', checkPermission('plot_booking', 3), ctrl.updateProductBooking);
router.delete('/product-bookings/:id', checkPermission('plot_booking', 4), ctrl.deleteProductBooking);
router.post('/product-bookings/:id/collections', checkPermission('plot_booking', 2), ctrl.collectProductInstallment);
router.get('/product-collections', checkPermission('plot_collection', 1), ctrl.getProductCollections);

// ── Plots Inventory (Wildcard /:id placed AFTER specific routes) ──
router.get('/', checkPermission('plot_inventory', 1), ctrl.getPlots);
router.post('/', checkPermission('plot_inventory', 2), ctrl.createPlot);
router.get('/:id', checkPermission('plot_inventory', 1), ctrl.getPlotById);
router.put('/:id', checkPermission('plot_inventory', 3), ctrl.updatePlot);

module.exports = router;
