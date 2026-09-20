const plotConfigService = require('./plotConfig.service');
const plotInventoryService = require('./plotInventory.service');
const plotDeveloperService = require('./plotDeveloper.service');
const plotBookingService = require('./plotBooking.service');
const plotCollectionService = require('./plotCollection.service');
const plotPayoutService = require('./plotPayout.service');
const plotClosingService = require('./plotClosing.service');
const plotReportService = require('./plotReport.service');

class PlotsService {
  constructor() {
    // Expose sub-services directly
    this.config = plotConfigService;
    this.inventory = plotInventoryService;
    this.developer = plotDeveloperService;
    this.booking = plotBookingService;
    this.collection = plotCollectionService;
    this.payout = plotPayoutService;
    this.closing = plotClosingService;
    this.report = plotReportService;
  }

  // ── RATE CONFIGURATION & MULTIPLIERS ─────────────────────────
  calculatePlotTotalPremiumPercent(plotDoc, rateConfig) {
    return plotConfigService.calculatePlotTotalPremiumPercent(plotDoc, rateConfig);
  }

  calculateSqFtRate(basePlotRate, plotDoc, rateConfig) {
    return plotConfigService.calculateSqFtRate(basePlotRate, plotDoc, rateConfig);
  }

  calculateContractTerms(plotDoc, tenureMonths, rateConfig, options = {}) {
    return plotConfigService.calculateContractTerms(plotDoc, tenureMonths, rateConfig, options);
  }

  getRateConfiguration() {
    return plotConfigService.getRateConfig();
  }

  getRateConfig() {
    return plotConfigService.getRateConfig();
  }

  updateRateConfiguration(data, userId) {
    return plotConfigService.updateRateConfig(data, userId);
  }

  updateRateConfig(data, userId) {
    return plotConfigService.updateRateConfig(data, userId);
  }

  getCommissionPolicy(businessType) {
    return plotConfigService.getCommissionPolicy(businessType);
  }

  updateCommissionPolicy(businessType, data) {
    return plotConfigService.updateCommissionPolicy(businessType, data);
  }

  // ── SERIES MASTER ───────────────────────────────────────────
  getSeriesMasters() {
    return plotInventoryService.getSeriesList();
  }

  getSeriesList() {
    return plotInventoryService.getSeriesList();
  }

  getSeriesMasterById(id) {
    return plotInventoryService.getSeriesById(id);
  }

  getSeriesById(id) {
    return plotInventoryService.getSeriesById(id);
  }

  createSeriesMaster(data, userId) {
    return plotInventoryService.createSeries(data, userId);
  }

  createSeries(data, userId) {
    return plotInventoryService.createSeries(data, userId);
  }

  updateSeriesMaster(id, data, userId) {
    return plotInventoryService.updateSeries(id, data, userId);
  }

  updateSeries(id, data, userId) {
    return plotInventoryService.updateSeries(id, data, userId);
  }

  deleteSeriesMaster(id, userId) {
    return plotInventoryService.deleteSeries(id, userId);
  }

  deleteSeries(id, userId) {
    return plotInventoryService.deleteSeries(id, userId);
  }

  // ── INVENTORY CRUD & BULK GENERATION ─────────────────────────
  createPlotsBulk(seriesId, plotDataArray) {
    return plotInventoryService.createPlotsBulk(seriesId, plotDataArray);
  }

  generatePlotsForSeries(seriesId, count, startingNumber, overrides = {}) {
    return plotInventoryService.generatePlotsForSeries(seriesId, count, startingNumber, overrides);
  }

  getPlots(filters = {}) {
    return plotInventoryService.getPlots(filters);
  }

  getPlotById(id) {
    return plotInventoryService.getPlotById(id);
  }

  createPlot(data) {
    return plotInventoryService.createPlot(data);
  }

  updatePlot(id, data) {
    return plotInventoryService.updatePlot(id, data);
  }

  deletePlot(id) {
    return plotInventoryService.deletePlot(id);
  }

  // ── SPONSOR / DEVELOPER COMMISSIONS & NETWORK ────────────────
  getCommissionPeriodBounds(targetDate = new Date()) {
    return plotDeveloperService.getCommissionPeriodBounds(targetDate);
  }

  getSponsorPeriodVolume(sponsorId, targetDate = new Date(), includeSubordinates = false, session = null) {
    return plotDeveloperService.getSponsorPeriodVolume(sponsorId, targetDate, includeSubordinates, session);
  }

  syncBookingSponsorCommissions(bookingId, session = null) {
    return plotDeveloperService.syncBookingSponsorCommissions(bookingId, session);
  }

  getSponsorDashboardStats(sponsorId) {
    return plotDeveloperService.getSponsorDashboardStats(sponsorId);
  }

  getSponsorBusinessReport(sponsorId, filters = {}) {
    return plotDeveloperService.getSponsorBusinessReport(sponsorId, filters);
  }

  getSponsorLedger(sponsorId) {
    return plotDeveloperService.getSponsorLedger(sponsorId);
  }

  getSponsors(query = {}) {
    return plotDeveloperService.getSponsors(query);
  }

  createSponsor(data) {
    return plotDeveloperService.createSponsor(data);
  }

  updateSponsor(id, data) {
    return plotDeveloperService.updateSponsor(id, data);
  }

  resetSponsorPassword(id, newPassword) {
    return plotDeveloperService.resetSponsorPassword(id, newPassword);
  }

  deleteSponsor(id) {
    return plotDeveloperService.deleteSponsor(id);
  }

  toggleSponsorBlock(id) {
    return plotDeveloperService.toggleSponsorBlock(id);
  }

  syncLegacyUserCustomers() {
    return plotDeveloperService.syncLegacyUserCustomers();
  }

  getCustomers(query = {}) {
    return plotDeveloperService.getCustomers(query);
  }

  createCustomer(data) {
    return plotDeveloperService.createCustomer(data);
  }

  getCustomerById(id) {
    return plotDeveloperService.getCustomerById(id);
  }

  updateCustomer(id, data) {
    return plotDeveloperService.updateCustomer(id, data);
  }

  deleteCustomer(id) {
    return plotDeveloperService.deleteCustomer(id);
  }

  // ── BOOKINGS & CONTRACTS ────────────────────────────────────
  createBookingOrHold(bookingData, userId) {
    return plotBookingService.createBookingOrHold(bookingData, userId);
  }

  restructureBooking(bookingId, updateData, userId) {
    return plotBookingService.restructureBooking(bookingId, updateData, userId);
  }

  processCustomerRefund(bookingId, refundData, userId) {
    return plotBookingService.processCustomerRefund(bookingId, refundData, userId);
  }

  getBookingRevisions(bookingId) {
    return plotBookingService.getBookingRevisions(bookingId);
  }

  updateBookingRevisionNarration(revisionId, adminNarration, userId) {
    return plotBookingService.updateBookingRevisionNarration(revisionId, adminNarration, userId);
  }

  expireHoldBookings() {
    return plotBookingService.expireHoldBookings();
  }

  getBookings(filters = {}) {
    return plotBookingService.getBookings(filters);
  }

  getBookingById(id) {
    return plotBookingService.getBookingById(id);
  }

  updateBooking(id, data, userId) {
    return plotBookingService.updateBooking(id, data, userId);
  }

  approveBooking(bookingId, userId) {
    return plotBookingService.approveBooking(bookingId, userId);
  }

  rejectBooking(bookingId, reason, userId) {
    return plotBookingService.rejectBooking(bookingId, reason, userId);
  }

  deleteBooking(id, userId) {
    return plotBookingService.deleteBooking(id, userId);
  }

  // ── INSTALLMENTS & COLLECTIONS ──────────────────────────────
  rebuildBookingInstallmentsState(bookingId, session = null) {
    return plotCollectionService.rebuildBookingInstallmentsState(bookingId, session);
  }

  recalculateBookingBalance(bookingId, session = null) {
    return plotCollectionService.recalculateBookingBalance(bookingId, session);
  }

  collectInstallment(bookingId, installmentIds, amountPaid, paymentMode, transactionReference, processedBy, lateFineRebate = 0, remarks = '', customDate = null) {
    return plotCollectionService.collectInstallment(bookingId, installmentIds, amountPaid, paymentMode, transactionReference, processedBy, lateFineRebate, remarks, customDate);
  }

  updateReceipt(receiptId, updateData, processedBy) {
    return plotCollectionService.updateReceipt(receiptId, updateData, processedBy);
  }

  deleteReceipt(receiptId, processedBy) {
    return plotCollectionService.deleteReceipt(receiptId, processedBy);
  }

  approveReceipt(receiptId, adminUserId) {
    return plotCollectionService.approveReceipt(receiptId, adminUserId);
  }

  rejectReceipt(receiptId, rejectionReason, adminUserId) {
    return plotCollectionService.rejectReceipt(receiptId, rejectionReason, adminUserId);
  }

  getInstallments(bookingId) {
    return plotCollectionService.getInstallments(bookingId);
  }

  getPayoutSchedules(bookingId) {
    return plotCollectionService.getPayoutSchedules(bookingId);
  }

  getReceipts(filters = {}) {
    return plotCollectionService.getReceipts(filters);
  }

  getReceiptById(id) {
    return plotCollectionService.getReceiptById(id);
  }

  // ── RETURN SCHEME PAYOUTS ───────────────────────────────────
  initializePlotPayout(bookingId, startDate, weeklyAmount, userId) {
    return plotPayoutService.initializePlotPayout(bookingId, startDate, weeklyAmount, userId);
  }

  payoutCronJobLogic() {
    return plotPayoutService.payoutCronJobLogic();
  }

  collectPlotPayoutPayment(bookingId, amountPaid, paymentMode, transactionReference, remarks, userId) {
    return plotPayoutService.collectPlotPayoutPayment(bookingId, amountPaid, paymentMode, transactionReference, remarks, userId);
  }

  getPlotPayoutLedger(bookingId) {
    return plotPayoutService.getPlotPayoutLedger(bookingId);
  }

  getPlotPayoutVoucherById(id) {
    return plotPayoutService.getPlotPayoutVoucherById(id);
  }

  deletePlotPayoutVoucher(voucherId, userId) {
    return plotPayoutService.deletePlotPayoutVoucher(voucherId, userId);
  }

  updatePlotPayoutVoucher(voucherId, updateData, userId) {
    return plotPayoutService.updatePlotPayoutVoucher(voucherId, updateData, userId);
  }

  // ── PLOT COMMISSION CLOSING SYSTEM ──────────────────────────
  _normalizeClosingDateRange(startDate, endDate) {
    return plotClosingService._normalizeClosingDateRange(startDate, endDate);
  }

  previewPlotClosing(params) {
    return plotClosingService.previewPlotClosing(params);
  }

  createPlotClosing(data, userId) {
    return plotClosingService.createPlotClosing(data, userId);
  }

  getPlotClosings(query = {}) {
    return plotClosingService.getPlotClosings(query);
  }

  getPlotClosingById(id) {
    return plotClosingService.getPlotClosingById(id);
  }

  updatePlotClosing(id, data, userId) {
    return plotClosingService.updatePlotClosing(id, data, userId);
  }

  deletePlotClosing(id, userId) {
    return plotClosingService.deletePlotClosing(id, userId);
  }

  // ── REPORTS & AUDIT LOGS ────────────────────────────────────
  getDashboardStats() {
    return plotReportService.getDashboardStats();
  }

  getReportsData(type, filters = {}) {
    return plotReportService.getReportsData(type, filters);
  }

  getAuditLogs(filters = {}) {
    return plotReportService.getAuditLogs(filters);
  }
}

module.exports = new PlotsService();
