const router = require('express').Router();
const authmiddlewre = require('../middleware/auth_middleware');
const authorizeRoles = require('../middleware/Role_middleware');
const checkPermission = require('../middleware/checkpermission');
const ctrl = require('../controllers/plots.controller');

router.use(authmiddlewre);
// Only staff roles and sponsors (for self-ledger) can touch the plots module
router.use(authorizeRoles('superadmin', 'admin', 'manager', 'demo', 'grant', 'sponsor'));

// ── Rate Config (part of inventory setup) ──
router.get('/rate-config', checkPermission('plot_inventory', 1), ctrl.getRateConfig);
router.put('/rate-config', checkPermission('plot_inventory', 3), ctrl.updateRateConfig);

// ── Series Master (inventory setup) ──
router.post('/series', checkPermission('plot_inventory', 2), ctrl.createSeries);
router.get('/series', checkPermission('plot_inventory', 1), ctrl.getSeriesList);
router.get('/series/:id', checkPermission('plot_inventory', 1), ctrl.getSeriesById);
router.put('/series/:id', checkPermission('plot_inventory', 3), ctrl.updateSeries);
router.delete('/series/:id', checkPermission('plot_inventory', 4), ctrl.deleteSeries);

// ── Sponsors ──
router.get('/sponsors', checkPermission('plot_sponsor', 1), ctrl.getSponsors);
router.get('/sponsors/:id/ledger', (req, res, next) => {
  // If the logged-in user is a sponsor requesting their own ledger, bypass staff permission
  if (req.user?.role === 'sponsor' && (req.user.id === req.params.id || req.user._id === req.params.id)) {
    return next();
  }
  return checkPermission('plot_sponsor', 1)(req, res, next);
}, ctrl.getSponsorLedger);
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

// ── Plots Inventory (Wildcard /:id placed AFTER specific routes) ──
router.get('/', checkPermission('plot_inventory', 1), ctrl.getPlots);
router.post('/', checkPermission('plot_inventory', 2), ctrl.createPlot);
router.get('/:id', checkPermission('plot_inventory', 1), ctrl.getPlotById);
router.put('/:id', checkPermission('plot_inventory', 3), ctrl.updatePlot);

module.exports = router;
