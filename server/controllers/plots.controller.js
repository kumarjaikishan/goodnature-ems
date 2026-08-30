const plotsService = require('../services/plots.service');
const ApiResponse = require('../utils/apiResponse');

const getRateConfig = async (req, res, next) => {
  try {
    const config = await plotsService.getRateConfig();
    ApiResponse.success(res, config);
  } catch (error) {
    next(error);
  }
};

const updateRateConfig = async (req, res, next) => {
  try {
    const config = await plotsService.updateRateConfig(req.body);
    ApiResponse.success(res, config, 'Rate configuration updated');
  } catch (error) {
    next(error);
  }
};

const createSeries = async (req, res, next) => {
  try {
    const series = await plotsService.createSeries(req.body, req.user?._id || req.user?.id || null);
    ApiResponse.created(res, series, 'Plot Series created and plots generated successfully');
  } catch (error) {
    next(error);
  }
};

const getSeriesList = async (req, res, next) => {
  try {
    const list = await plotsService.getSeriesList();
    ApiResponse.success(res, list);
  } catch (error) {
    next(error);
  }
};

const getSeriesById = async (req, res, next) => {
  try {
    const series = await plotsService.getSeriesById(req.params.id);
    ApiResponse.success(res, series);
  } catch (error) {
    next(error);
  }
};

const updateSeries = async (req, res, next) => {
  try {
    const series = await plotsService.updateSeries(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, series, 'Plot Series updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSeries = async (req, res, next) => {
  try {
    const result = await plotsService.deleteSeries(req.params.id, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, result, 'Plot Series deleted successfully');
  } catch (error) {
    next(error);
  }
};

const createPlot = async (req, res, next) => {
  try {
    const plot = await plotsService.createPlot(req.body, req.user?._id || req.user?.id || null);
    ApiResponse.created(res, plot, 'Plot created successfully');
  } catch (error) {
    next(error);
  }
};

const getPlots = async (req, res, next) => {
  try {
    const result = await plotsService.getPlots(req.query);
    ApiResponse.paginated(res, result.plots, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getPlotById = async (req, res, next) => {
  try {
    const plot = await plotsService.getPlotById(req.params.id);
    ApiResponse.success(res, plot);
  } catch (error) {
    next(error);
  }
};

const updatePlot = async (req, res, next) => {
  try {
    const plot = await plotsService.updatePlot(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, plot, 'Plot updated successfully');
  } catch (error) {
    next(error);
  }
};

const createBookingOrHold = async (req, res, next) => {
  try {
    const result = await plotsService.createBookingOrHold(req.body, req.user?._id || req.user?.id || null);
    ApiResponse.created(res, result, 'Booking / Hold created successfully');
  } catch (error) {
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await plotsService.getBookings(req.query);
    ApiResponse.paginated(res, result.bookings, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await plotsService.getBookingById(req.params.id);
    ApiResponse.success(res, booking);
  } catch (error) {
    next(error);
  }
};

const getInstallments = async (req, res, next) => {
  try {
    const installments = await plotsService.getInstallments(req.params.bookingId);
    ApiResponse.success(res, installments);
  } catch (error) {
    next(error);
  }
};

const getPayoutSchedules = async (req, res, next) => {
  try {
    const schedules = await plotsService.getPayoutSchedules(req.params.bookingId);
    ApiResponse.success(res, schedules);
  } catch (error) {
    next(error);
  }
};

const collectInstallment = async (req, res, next) => {
  try {
    const { installmentIds, amountPaid, lateFineRebate, paymentMode, transactionReference, remarks, createdAt } = req.body;
    const result = await plotsService.collectInstallment(
      req.params.bookingId,
      installmentIds,
      amountPaid,
      paymentMode,
      transactionReference,
      req.user?._id || req.user?.id || null,
      Number(lateFineRebate) || 0,
      remarks,
      createdAt
    );
    ApiResponse.success(res, result, 'Installment payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

const getReceipts = async (req, res, next) => {
  try {
    const result = await plotsService.getReceipts(req.query);
    ApiResponse.paginated(res, result.receipts, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getReceiptById = async (req, res, next) => {
  try {
    const receipt = await plotsService.getReceiptById(req.params.id);
    ApiResponse.success(res, receipt);
  } catch (error) {
    next(error);
  }
};

const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await plotsService.updateReceipt(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, receipt, 'Receipt updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteReceipt = async (req, res, next) => {
  try {
    await plotsService.deleteReceipt(req.params.id, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, null, 'Receipt reversed/deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await plotsService.getDashboardStats();
    ApiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
};

const getReportsData = async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await plotsService.getReportsData(type, req.query);
    ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const booking = await plotsService.updateBooking(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, booking, 'Booking updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    await plotsService.deleteBooking(req.params.id, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, null, 'Booking deleted successfully');
  } catch (error) {
    next(error);
  }
};

const initializePlotPayout = async (req, res, next) => {
  try {
    const { startDate, weeklyAmount } = req.body;
    const booking = await plotsService.initializePlotPayout(req.params.id, startDate, weeklyAmount, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, booking, 'Plot weekly payouts initialized successfully');
  } catch (error) {
    next(error);
  }
};

const collectPlotPayoutPayment = async (req, res, next) => {
  try {
    const { amountPaid, paymentMode, transactionReference, remarks } = req.body;
    const voucher = await plotsService.collectPlotPayoutPayment(req.params.id, amountPaid, paymentMode, transactionReference, remarks, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, voucher, 'Payout payment collected successfully');
  } catch (error) {
    next(error);
  }
};

const getPlotPayoutLedger = async (req, res, next) => {
  try {
    const ledger = await plotsService.getPlotPayoutLedger(req.params.id);
    ApiResponse.success(res, ledger);
  } catch (error) {
    next(error);
  }
};

const getPlotPayoutVoucher = async (req, res, next) => {
  try {
    const voucher = await plotsService.getPlotPayoutVoucherById(req.params.id);
    ApiResponse.success(res, voucher);
  } catch (error) {
    next(error);
  }
};

const deletePlotPayoutVoucher = async (req, res, next) => {
  try {
    await plotsService.deletePlotPayoutVoucher(req.params.id, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, null, 'Payout voucher reversed/deleted successfully');
  } catch (error) {
    next(error);
  }
};

const updatePlotPayoutVoucher = async (req, res, next) => {
  try {
    const voucher = await plotsService.updatePlotPayoutVoucher(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, voucher, 'Payout voucher updated successfully');
  } catch (error) {
    next(error);
  }
};

const getSponsorLedger = async (req, res, next) => {
  try {
    const result = await plotsService.getSponsorLedger(req.params.id);
    ApiResponse.success(res, result, 'Sponsor ledger fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getSponsors = async (req, res, next) => {
  try {
    const result = await plotsService.getSponsors(req.query);
    ApiResponse.paginated(res, result.sponsors, result.pagination);
  } catch (error) {
    next(error);
  }
};

const createSponsor = async (req, res, next) => {
  try {
    const sponsor = await plotsService.createSponsor(req.body);
    ApiResponse.created(res, sponsor, 'Sponsor created successfully');
  } catch (error) {
    next(error);
  }
};

const updateSponsor = async (req, res, next) => {
  try {
    const sponsor = await plotsService.updateSponsor(req.params.id, req.body);
    ApiResponse.success(res, sponsor, 'Sponsor updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSponsor = async (req, res, next) => {
  try {
    const result = await plotsService.deleteSponsor(req.params.id);
    ApiResponse.success(res, result, 'Sponsor deleted successfully');
  } catch (error) {
    next(error);
  }
};

const toggleSponsorBlock = async (req, res, next) => {
  try {
    const sponsor = await plotsService.toggleSponsorBlock(req.params.id);
    ApiResponse.success(res, sponsor, `Sponsor ${sponsor.isBlocked ? 'blocked' : 'unblocked'} successfully`);
  } catch (error) {
    next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const result = await plotsService.getCustomers(req.query);
    ApiResponse.paginated(res, result.customers, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await plotsService.getCustomerById(req.params.id);
    ApiResponse.success(res, customer);
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const customer = await plotsService.createCustomer(req.body);
    ApiResponse.created(res, customer, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await plotsService.updateCustomer(req.params.id, req.body);
    ApiResponse.success(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const result = await plotsService.deleteCustomer(req.params.id);
    ApiResponse.success(res, result, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRateConfig,
  updateRateConfig,
  createSeries,
  getSeriesList,
  getSeriesById,
  updateSeries,
  deleteSeries,
  createPlot,
  getPlots,
  getPlotById,
  updatePlot,
  createBookingOrHold,
  getBookings,
  getBookingById,
  getInstallments,
  getPayoutSchedules,
  collectInstallment,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  getDashboardStats,
  getReportsData,
  updateBooking,
  deleteBooking,
  initializePlotPayout,
  collectPlotPayoutPayment,
  getPlotPayoutLedger,
  getPlotPayoutVoucher,
  deletePlotPayoutVoucher,
  updatePlotPayoutVoucher,
  getSponsors,
  getSponsorLedger,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  toggleSponsorBlock,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
