const router = require('express').Router();
const authmiddlewre = require('../middleware/auth_middleware');
const ctrl = require('../controllers/plots.controller');

router.use(authmiddlewre);

// ── Rate Config ──
router.get('/rate-config', ctrl.getRateConfig);
router.put('/rate-config', ctrl.updateRateConfig);

// ── Series Master ──
router.post('/series', ctrl.createSeries);
router.get('/series', ctrl.getSeriesList);
router.get('/series/:id', ctrl.getSeriesById);
router.put('/series/:id', ctrl.updateSeries);
router.delete('/series/:id', ctrl.deleteSeries);

// ── Sponsors ──
router.get('/sponsors', ctrl.getSponsors);
router.post('/sponsors', ctrl.createSponsor);
router.put('/sponsors/:id', ctrl.updateSponsor);
router.delete('/sponsors/:id', ctrl.deleteSponsor);
router.patch('/sponsors/:id/toggle-block', ctrl.toggleSponsorBlock);

// ── Customers ──
router.get('/customers', ctrl.getCustomers);
router.post('/customers', ctrl.createCustomer);
router.put('/customers/:id', ctrl.updateCustomer);
router.delete('/customers/:id', ctrl.deleteCustomer);

// ── Bookings & Holds ──
router.post('/bookings', ctrl.createBookingOrHold);
router.get('/bookings/list', ctrl.getBookings);
router.get('/bookings/:id', ctrl.getBookingById);
router.put('/bookings/:id', ctrl.updateBooking);
router.delete('/bookings/:id', ctrl.deleteBooking);

// ── Installments & Collections ──
router.get('/bookings/:bookingId/installments', ctrl.getInstallments);
router.get('/bookings/:bookingId/payouts', ctrl.getPayoutSchedules);
router.post('/bookings/:bookingId/collect', ctrl.collectInstallment);

// ── Receipts ──
router.get('/receipts/list', ctrl.getReceipts);
router.get('/receipts/:id', ctrl.getReceiptById);
router.put('/receipts/:id', ctrl.updateReceipt);
router.delete('/receipts/:id', ctrl.deleteReceipt);

// ── Dashboard & Reports ──
router.get('/dashboard/stats', ctrl.getDashboardStats);
router.get('/reports/:type', ctrl.getReportsData);

// ── Weekly Payouts ──
router.post('/bookings/:id/payout/initialize', ctrl.initializePlotPayout);
router.post('/bookings/:id/payout/pay', ctrl.collectPlotPayoutPayment);
router.get('/bookings/:id/payout/ledger', ctrl.getPlotPayoutLedger);
router.get('/payout-vouchers/:id', ctrl.getPlotPayoutVoucher);
router.delete('/payout-vouchers/:id', ctrl.deletePlotPayoutVoucher);
router.put('/payout-vouchers/:id', ctrl.updatePlotPayoutVoucher);

// ── Plots Inventory (Wildcard /:id placed AFTER specific routes) ──
router.get('/', ctrl.getPlots);
router.get('/:id', ctrl.getPlotById);
router.put('/:id', ctrl.updatePlot);

module.exports = router;
