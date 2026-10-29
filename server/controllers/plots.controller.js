const fs = require('fs');
const path = require('path');
const plotsService = require('../services/plots.service');
const kisanLandService = require('../services/kisanLand.service');
const plotProductService = require('../services/plots/plotProduct.service');
const PlotSponsorCommission = require('../models/PlotSponsorCommission');
const ApiResponse = require('../utils/apiResponse');
const cloudinary = require('../utils/cloudinary');

const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    const folder = req.body.folder || 'ems/plots';
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder,
      format: 'webp',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to remove temp file:', err.message);
    });

    return ApiResponse.success(res, { url: uploadResult.secure_url }, 'Image uploaded successfully');
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.avif'];
const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/x-pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/tiff',
  'image/avif',
];

const checkDocMagicBytes = (filePath) => {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    if (bytesRead < 4) return false;

    // PDF: %PDF-
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'pdf';
    }
    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image';
    }
    // PNG: 0x89 0x50 0x4E 0x47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image';
    }
    // GIF: GIF87a or GIF89a (0x47 0x49 0x46)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image';
    }
    // BMP: BM (0x42 0x4D)
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return 'image';
    }
    // TIFF: II*. (0x49 0x49 0x2A 0x00) or MM.* (0x4D 0x4D 0x00 0x2A)
    if (
      (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
    ) {
      return 'image';
    }
    // WEBP: RIFF....WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image';
    }

    return false;
  } catch (e) {
    return false;
  }
};

const uploadLandDocument = async (req, res, next) => {
  const filePath = req.file?.path;
  const cleanupFile = () => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
  };

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // 1. File size check (Max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (req.file.size > MAX_SIZE) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 20MB limit. Please upload a compressed document.',
      });
    }

    // 2. Extension & MIME validation
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const mime = (req.file.mimetype || '').toLowerCase();

    if (!ALLOWED_DOC_EXTENSIONS.includes(ext) || !ALLOWED_DOC_MIMES.includes(mime)) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only PDF documents and Images (JPG, PNG, WEBP, GIF, BMP, TIFF) are permitted.',
      });
    }

    // 3. Magic number inspection (deep file signature check)
    const detectedType = checkDocMagicBytes(filePath);
    if (!detectedType) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'File header signature verification failed. The file appears to be corrupted or disguised.',
      });
    }

    const isPdf = detectedType === 'pdf' || ext === '.pdf';
    const folder = 'ems/kisan_documents';

    // 4. Sanitize file name
    const rawBaseName = path.parse(req.file.originalname).name;
    const sanitizedBase = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'doc';
    const timestamp = Date.now();

    const uploadOptions = {
      folder,
      resource_type: isPdf ? 'raw' : 'image',
      public_id: `${sanitizedBase}_${timestamp}${isPdf ? '.pdf' : ''}`,
      use_filename: true,
      unique_filename: true,
    };

    if (!isPdf) {
      uploadOptions.quality = 'auto:good';
    }

    const uploadResult = await cloudinary.uploader.upload(filePath, uploadOptions);
    cleanupFile();

    return ApiResponse.success(
      res,
      {
        url: uploadResult.secure_url,
        fileName: `${sanitizedBase}${ext}`,
        fileSize: req.file.size,
        format: isPdf ? 'pdf' : (uploadResult.format || ext.replace('.', '')),
        resourceType: isPdf ? 'raw' : 'image',
      },
      'Document uploaded successfully'
    );
  } catch (error) {
    cleanupFile();
    next(error);
  }
};

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

const getCommissionPolicy = async (req, res, next) => {
  try {
    const businessType = req.query.type || req.params.type || 'PLOT_SALE';
    const policy = await plotsService.getCommissionPolicy(businessType);
    ApiResponse.success(res, policy);
  } catch (error) {
    next(error);
  }
};

const updateCommissionPolicy = async (req, res, next) => {
  try {
    const businessType = req.query.type || req.body.businessType || 'PLOT_SALE';
    const policy = await plotsService.updateCommissionPolicy(businessType, req.body);
    ApiResponse.success(res, policy, 'Commission policy and target slabs updated successfully');
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
    if (!booking) {
      return ApiResponse.notFound(res, 'Plot booking not found');
    }

    // If request comes from a Sponsor / Associate / Partner, ensure they own or downline-manage this booking
    if (req.user?.role === 'sponsor') {
      const requesterId = (req.user.id || req.user._id).toString();
      const directSponsorId = booking.sponsorId?._id?.toString() || booking.sponsorId?.toString();

      // Check direct ownership or downline ownership
      if (directSponsorId !== requesterId) {
        const User = require('../models/user');
        const downline = await User.find({ sponsorId: requesterId }).select('_id').lean();
        const downlineIds = downline.map((d) => d._id.toString());
        if (!downlineIds.includes(directSponsorId)) {
          return res.status(403).json({ message: 'Access denied: You are not authorized to view this booking.' });
        }
      }

      // Sanitize backend response for sponsor: Strip out internal land acquisition / seller sourcing info
      const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
      delete bookingObj.landSourcing;
      return ApiResponse.success(res, bookingObj);
    }

    ApiResponse.success(res, booking);
  } catch (error) {
    next(error);
  }
};

const getBookingLedger = async (req, res, next) => {
  try {
    const data = await plotsService.getBookingLedger(req.params.id);
    if (!data || !data.booking) {
      return ApiResponse.notFound(res, 'Plot booking not found');
    }

    // Role check for sponsor
    if (req.user?.role === 'sponsor') {
      const requesterId = (req.user.id || req.user._id).toString();
      const directSponsorId = data.booking.sponsorId?._id?.toString() || data.booking.sponsorId?.toString();
      if (directSponsorId !== requesterId) {
        const User = require('../models/user');
        const downline = await User.find({ sponsorId: requesterId }).select('_id').lean();
        const downlineIds = downline.map((d) => d._id.toString());
        if (!downlineIds.includes(directSponsorId)) {
          return res.status(403).json({ message: 'Access denied: You are not authorized to view this booking ledger.' });
        }
      }
      if (data.booking.toObject) {
        data.booking = data.booking.toObject();
      }
      delete data.booking.landSourcing;
    }

    ApiResponse.success(res, data, 'Booking ledger retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const approveBooking = async (req, res, next) => {
  try {
    const booking = await plotsService.approveBooking(req.params.id, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, booking, 'Plot booking approved & activated successfully');
  } catch (error) {
    next(error);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const booking = await plotsService.rejectBooking(req.params.id, reason, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, booking, 'Plot booking rejected and inventory restored');
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
    const { installmentIds, amountPaid, lateFineRebate, paymentMode, transactionReference, remarks, createdAt, bankDetails, ledgerId } = req.body;
    const result = await plotsService.collectInstallment(
      req.params.bookingId,
      installmentIds,
      amountPaid,
      paymentMode,
      transactionReference,
      req.user?._id || req.user?.id || null,
      Number(lateFineRebate) || 0,
      remarks,
      createdAt,
      bankDetails,
      ledgerId
    );
    ApiResponse.success(res, result, 'Installment payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

const getReceipts = async (req, res, next) => {
  try {
    const result = await plotsService.getReceipts(req.query, req.user);
    ApiResponse.paginated(res, result.receipts, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getReceiptById = async (req, res, next) => {
  try {
    const receipt = await plotsService.getReceiptById(req.params.id, req.user);
    ApiResponse.success(res, receipt);
  } catch (error) {
    next(error);
  }
};

const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await plotsService.updateReceipt(req.params.id, req.body, req.user);
    ApiResponse.success(res, receipt, 'Receipt updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteReceipt = async (req, res, next) => {
  try {
    await plotsService.deleteReceipt(req.params.id, req.user);
    ApiResponse.success(res, null, 'Receipt reversed/deleted successfully');
  } catch (error) {
    next(error);
  }
};

const approveReceipt = async (req, res, next) => {
  try {
    let receipt;
    try {
      receipt = await plotsService.approveReceipt(req.params.id, req.user);
    } catch (err) {
      if (err.statusCode === 404 || err.message?.toLowerCase().includes('not found')) {
        receipt = await plotProductService.approveProductCollection(null, req.params.id, req.user);
      } else {
        throw err;
      }
    }
    ApiResponse.success(res, receipt, 'Collection approved and realized into ledger successfully');
  } catch (error) {
    next(error);
  }
};

const rejectReceipt = async (req, res, next) => {
  try {
    const { reason } = req.body;
    let receipt;
    try {
      receipt = await plotsService.rejectReceipt(req.params.id, reason, req.user);
    } catch (err) {
      if (err.statusCode === 404 || err.message?.toLowerCase().includes('not found')) {
        receipt = await plotProductService.rejectProductCollection(null, req.params.id, reason, req.user);
      } else {
        throw err;
      }
    }
    ApiResponse.success(res, receipt, 'Collection rejected successfully');
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

const getSponsorDashboardStats = async (req, res, next) => {
  try {
    const result = await plotsService.getSponsorDashboardStats(req.params.id);
    ApiResponse.success(res, result, 'Sponsor dashboard stats fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getSponsorBusinessReport = async (req, res, next) => {
  try {
    const result = await plotsService.getSponsorBusinessReport(req.params.id, req.query);
    ApiResponse.success(res, result, 'Sponsor business report fetched successfully');
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

const resetSponsorPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const result = await plotsService.resetSponsorPassword(req.params.id, password);
    ApiResponse.success(res, result, result.message);
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

// ── Plot Commission Closing System ──
const previewPlotClosing = async (req, res, next) => {
  try {
    const preview = await plotsService.previewPlotClosing({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      closingType: req.query.closingType || 'TARGET_INCENTIVE',
      excludeClosingId: req.query.excludeClosingId || null,
    });
    ApiResponse.success(res, preview);
  } catch (error) {
    next(error);
  }
};

const createPlotClosing = async (req, res, next) => {
  try {
    const closing = await plotsService.createPlotClosing(
      req.body,
      req.user?._id || req.user?.id || null
    );
    ApiResponse.created(res, closing, `Plot Closing ${closing.closingNumber} created successfully`);
  } catch (error) {
    next(error);
  }
};

const getPlotClosings = async (req, res, next) => {
  try {
    const closings = await plotsService.getPlotClosings(req.query);
    ApiResponse.success(res, closings);
  } catch (error) {
    next(error);
  }
};

const getPlotClosingById = async (req, res, next) => {
  try {
    const closing = await plotsService.getPlotClosingById(req.params.id);
    ApiResponse.success(res, closing);
  } catch (error) {
    next(error);
  }
};

const updatePlotClosing = async (req, res, next) => {
  try {
    const closing = await plotsService.updatePlotClosing(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id || null
    );
    ApiResponse.success(res, closing, `Plot Closing ${closing.closingNumber} updated successfully`);
  } catch (error) {
    next(error);
  }
};

const deletePlotClosing = async (req, res, next) => {
  try {
    const result = await plotsService.deletePlotClosing(
      req.params.id,
      req.user?._id || req.user?.id || null
    );
    ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

// ── KISAN LAND AGREEMENT CONTROLLERS ──────────────────────────────
const createKisanAgreement = async (req, res, next) => {
  try {
    const agreement = await kisanLandService.createAgreement(req.body, req.user?._id || req.user?.id || null);
    ApiResponse.created(res, agreement, 'Kisan Land Agreement created successfully');
  } catch (error) {
    next(error);
  }
};

const getKisanAgreements = async (req, res, next) => {
  try {
    const result = await kisanLandService.getAgreements(req.query);
    ApiResponse.paginated(res, result.agreements, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getKisanAgreementById = async (req, res, next) => {
  try {
    const result = await kisanLandService.getAgreementById(req.params.id);
    ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const addRegistryDeed = async (req, res, next) => {
  try {
    const agreement = await kisanLandService.addRegistryDeed(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, agreement, 'Registry Deed added & converted successfully');
  } catch (error) {
    next(error);
  }
};

const recordKisanPayment = async (req, res, next) => {
  try {
    const payment = await kisanLandService.recordKisanPayment(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, payment, 'Payment to Kisan recorded successfully');
  } catch (error) {
    next(error);
  }
};

const updateKisanAgreement = async (req, res, next) => {
  try {
    const agreement = await kisanLandService.updateAgreement(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, agreement, 'Kisan Land Agreement updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteKisanAgreement = async (req, res, next) => {
  try {
    await kisanLandService.deleteAgreement(req.params.id, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, null, 'Kisan Land Agreement deleted successfully');
  } catch (error) {
    next(error);
  }
};

const updateRegistryDeed = async (req, res, next) => {
  try {
    const agreement = await kisanLandService.updateRegistryDeed(req.params.agreementId, req.params.deedId, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, agreement, 'Registry Deed updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRegistryDeed = async (req, res, next) => {
  try {
    const agreement = await kisanLandService.deleteRegistryDeed(req.params.agreementId, req.params.deedId, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, agreement, 'Registry Deed deleted & stock restored successfully');
  } catch (error) {
    next(error);
  }
};

const getAvailableLandStockSources = async (req, res, next) => {
  try {
    const sources = await kisanLandService.getAvailableLandStockSources();
    ApiResponse.success(res, sources);
  } catch (error) {
    next(error);
  }
};

// ── BOOKING RESTRUCTURING & CUSTOMER REFUND CONTROLLERS ─────────────
const restructureBooking = async (req, res, next) => {
  try {
    const result = await plotsService.restructureBooking(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, result, 'Plot Booking restructured & recalibrated successfully');
  } catch (error) {
    next(error);
  }
};

const processCustomerRefund = async (req, res, next) => {
  try {
    const result = await plotsService.processCustomerRefund(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, result, 'Customer cancellation & refund voucher processed successfully');
  } catch (error) {
    next(error);
  }
};

const addRefundPartPayment = async (req, res, next) => {
  try {
    const result = await plotsService.addRefundPartPayment(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, result, 'Part-payment refund recorded successfully');
  } catch (error) {
    next(error);
  }
};

const getBookingRevisions = async (req, res, next) => {
  try {
    const revisions = await plotsService.getBookingRevisions(req.params.id);
    ApiResponse.success(res, revisions);
  } catch (error) {
    next(error);
  }
};

const updateBookingRevisionNarration = async (req, res, next) => {
  try {
    const updated = await plotsService.updateBookingRevisionNarration(
      req.params.revisionId,
      req.body.adminNarration,
      req.user?._id || req.user?.id || null
    );
    ApiResponse.success(res, updated, 'Revision narration updated successfully');
  } catch (error) {
    next(error);
  }
};

const getBookingCommissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isProduct = req.query.isProduct === 'true';
    const filter = isProduct
      ? { productBookingId: id }
      : { $or: [{ bookingId: id }, { productBookingId: id }] };

    const commissions = await PlotSponsorCommission.find(filter)
      .populate('sponsorId', 'name sponsorCode role mobile')
      .populate('branchId', 'name branchCode')
      .populate('receiptId', 'receiptNumber amount date receiptType')
      .sort({ createdAt: 1 })
      .lean();

    const activeCommissions = commissions.filter((c) => c.status === 'active');
    const reversedCommissions = commissions.filter((c) => c.status === 'reversed');

    const totalActiveAmount = activeCommissions.reduce((sum, c) => sum + (Number(c.fixedAmount || c.amount) || 0), 0);
    const totalReversedAmount = reversedCommissions.reduce((sum, c) => sum + (Number(c.fixedAmount || c.amount) || 0), 0);
    const totalAmount = commissions.reduce((sum, c) => sum + (Number(c.fixedAmount || c.amount) || 0), 0);

    ApiResponse.success(res, {
      commissions,
      totalAmount,
      totalActiveAmount,
      totalReversedAmount,
      activeCount: activeCommissions.length,
      reversedCount: reversedCommissions.length,
    });
  } catch (error) {
    next(error);
  }
};

// ── KISAN / SELLER DIRECTORY CONTROLLERS ────────────────────────────
const getKisanSellers = async (req, res, next) => {
  try {
    const sellers = await kisanLandService.getKisanSellers(req.query);
    ApiResponse.success(res, sellers);
  } catch (error) {
    next(error);
  }
};

const createKisanSeller = async (req, res, next) => {
  try {
    const seller = await kisanLandService.createKisanSeller(req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, seller, 'Kisan / Seller added successfully');
  } catch (error) {
    next(error);
  }
};

const updateKisanSeller = async (req, res, next) => {
  try {
    const seller = await kisanLandService.updateKisanSeller(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, seller, 'Kisan / Seller updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteKisanSeller = async (req, res, next) => {
  try {
    const result = await kisanLandService.deleteKisanSeller(req.params.id);
    ApiResponse.success(res, result, 'Kisan / Seller deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ── PURCHASER / BUYER DIRECTORY CONTROLLERS ─────────────────────────
const getPurchasers = async (req, res, next) => {
  try {
    const purchasers = await kisanLandService.getPurchasers(req.query);
    ApiResponse.success(res, purchasers);
  } catch (error) {
    next(error);
  }
};

const createPurchaser = async (req, res, next) => {
  try {
    const purchaser = await kisanLandService.createPurchaser(req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, purchaser, 'Purchaser / Buyer added successfully');
  } catch (error) {
    next(error);
  }
};

const updatePurchaser = async (req, res, next) => {
  try {
    const purchaser = await kisanLandService.updatePurchaser(req.params.id, req.body, req.user?._id || req.user?.id || null);
    ApiResponse.success(res, purchaser, 'Purchaser / Buyer updated successfully');
  } catch (error) {
    next(error);
  }
};

const setDefaultPurchaser = async (req, res, next) => {
  try {
    const purchaser = await kisanLandService.setDefaultPurchaser(req.params.id);
    ApiResponse.success(res, purchaser, 'Default Purchaser updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePurchaser = async (req, res, next) => {
  try {
    const result = await kisanLandService.deletePurchaser(req.params.id);
    ApiResponse.success(res, result, 'Purchaser / Buyer deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ── Plot Products & Fractional Units Controller Actions ──
const getPlotProducts = async (req, res, next) => {
  try {
    const result = await plotProductService.getProducts(req.query);
    ApiResponse.success(res, result, 'Plot products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPlotProductById = async (req, res, next) => {
  try {
    const result = await plotProductService.getProductById(req.params.id);
    ApiResponse.success(res, result, 'Plot product details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createPlotProduct = async (req, res, next) => {
  try {
    const result = await plotProductService.createProduct(req.body, req.user?._id || req.user?.id);
    ApiResponse.created(res, result, 'Plot product created successfully');
  } catch (error) {
    next(error);
  }
};

const updatePlotProduct = async (req, res, next) => {
  try {
    const result = await plotProductService.updateProduct(req.params.id, req.body);
    ApiResponse.success(res, result, 'Plot product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePlotProduct = async (req, res, next) => {
  try {
    const result = await plotProductService.deleteProduct(req.params.id);
    ApiResponse.success(res, result, 'Plot product deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getAvailableProductTenures = async (req, res, next) => {
  try {
    const result = await plotProductService.getAvailableTenures();
    ApiResponse.success(res, result, 'Available product tenures retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProductBookings = async (req, res, next) => {
  try {
    const result = await plotProductService.getProductBookings(req.query);
    ApiResponse.success(res, result, 'Product bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProductBookingById = async (req, res, next) => {
  try {
    const result = await plotProductService.getProductBookingById(req.params.id);
    ApiResponse.success(res, result, 'Product booking details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createProductBooking = async (req, res, next) => {
  try {
    const result = await plotProductService.createProductBooking(req.body, req.user?._id || req.user?.id);
    ApiResponse.created(res, result, 'Product sale/booking created successfully');
  } catch (error) {
    next(error);
  }
};

const collectProductInstallment = async (req, res, next) => {
  try {
    const result = await plotProductService.collectProductInstallment(req.params.id, req.body, req.user?._id || req.user?.id);
    const isPending = (result?.status || '').toUpperCase() === 'PENDING';
    const message = isPending
      ? 'Product collection submitted with PENDING approval status. Awaiting manager/admin verification.'
      : 'Product installment payment collected successfully';
    ApiResponse.success(res, result, message);
  } catch (error) {
    next(error);
  }
};

const updateProductBooking = async (req, res, next) => {
  try {
    const result = await plotProductService.updateProductBooking(req.params.id, req.body, req.user?._id || req.user?.id);
    ApiResponse.success(res, result, 'Product booking updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProductBooking = async (req, res, next) => {
  try {
    const result = await plotProductService.deleteProductBooking(req.params.id);
    ApiResponse.success(res, result, 'Product booking deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getProductCollections = async (req, res, next) => {
  try {
    const result = await plotProductService.getProductCollections(req.query);
    ApiResponse.success(res, result, 'Product collections retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProductCollection = async (req, res, next) => {
  try {
    const { bookingId, receiptNumber } = req.params;
    const userId = req.user?._id || req.user?.id || null;
    const result = await plotProductService.deleteProductCollection(
      bookingId,
      decodeURIComponent(receiptNumber),
      userId
    );
    ApiResponse.success(res, result, 'Product collection receipt deleted successfully');
  } catch (error) {
    next(error);
  }
};

const approveProductCollection = async (req, res, next) => {
  try {
    const { bookingId, receiptNumber } = req.params;
    const result = await plotProductService.approveProductCollection(
      bookingId,
      decodeURIComponent(receiptNumber),
      req.user
    );
    ApiResponse.success(res, result, 'Product collection approved and realized into ledger successfully');
  } catch (error) {
    next(error);
  }
};

const rejectProductCollection = async (req, res, next) => {
  try {
    const { bookingId, receiptNumber } = req.params;
    const { reason } = req.body;
    const result = await plotProductService.rejectProductCollection(
      bookingId,
      decodeURIComponent(receiptNumber),
      reason,
      req.user
    );
    ApiResponse.success(res, result, 'Product collection rejected successfully');
  } catch (error) {
    next(error);
  }
};

const cancelProductBookingAndRefund = async (req, res, next) => {
  try {
    const result = await plotProductService.cancelProductBookingAndRefund(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    ApiResponse.success(res, result, 'Product booking cancelled and refund processed successfully');
  } catch (error) {
    next(error);
  }
};

const addProductRefundPartPayment = async (req, res, next) => {
  try {
    const result = await plotProductService.addProductRefundPartPayment(
      req.params.id,
      req.body,
      req.user?._id || req.user?.id
    );
    ApiResponse.success(res, result, 'Product refund part-payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

const getProductCustomerLedger = async (req, res, next) => {
  try {
    const result = await plotProductService.getProductCustomerLedger(req.params.id);
    ApiResponse.success(res, result, 'Product customer ledger retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ── Project Master Directory ──
const getProjects = async (req, res, next) => {
  try {
    const projects = await kisanLandService.getProjects(req.query);
    ApiResponse.success(res, projects);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await kisanLandService.getProjectById(req.params.id);
    ApiResponse.success(res, project);
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await kisanLandService.createProject(req.body, req.user?._id || req.user?.id);
    ApiResponse.created(res, project, 'Project created successfully');
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await kisanLandService.updateProject(req.params.id, req.body, req.user?._id || req.user?.id);
    ApiResponse.success(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await kisanLandService.deleteProject(req.params.id);
    ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRateConfig,
  updateRateConfig,
  getCommissionPolicy,
  updateCommissionPolicy,
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
  getBookingLedger,
  approveBooking,
  rejectBooking,
  getInstallments,
  getPayoutSchedules,
  collectInstallment,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  approveReceipt,
  rejectReceipt,
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
  getSponsorDashboardStats,
  getSponsorLedger,
  getSponsorBusinessReport,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  toggleSponsorBlock,
  resetSponsorPassword,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  previewPlotClosing,
  createPlotClosing,
  getPlotClosings,
  getPlotClosingById,
  updatePlotClosing,
  deletePlotClosing,
  uploadMedia,
  uploadLandDocument,
  // Kisan Land Exports
  createKisanAgreement,
  getKisanAgreements,
  getKisanAgreementById,
  updateKisanAgreement,
  deleteKisanAgreement,
  addRegistryDeed,
  updateRegistryDeed,
  deleteRegistryDeed,
  recordKisanPayment,
  getAvailableLandStockSources,
  // Kisan & Purchaser Directory Exports
  getKisanSellers,
  createKisanSeller,
  updateKisanSeller,
  deleteKisanSeller,
  getPurchasers,
  createPurchaser,
  updatePurchaser,
  setDefaultPurchaser,
  deletePurchaser,
  // Restructuring & Refund Exports
  restructureBooking,
  processCustomerRefund,
  addRefundPartPayment,
  getBookingRevisions,
  updateBookingRevisionNarration,
  getBookingCommissions,
  // Plot Products & Fractional Units Exports
  getPlotProducts,
  getPlotProductById,
  createPlotProduct,
  updatePlotProduct,
  deletePlotProduct,
  getAvailableProductTenures,
  getProductBookings,
  getProductBookingById,
  createProductBooking,
  updateProductBooking,
  deleteProductBooking,
  collectProductInstallment,
  getProductCollections,
  deleteProductCollection,
  approveProductCollection,
  rejectProductCollection,
  cancelProductBookingAndRefund,
  addProductRefundPartPayment,
  getProductCustomerLedger,
  // Project Master Exports
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
