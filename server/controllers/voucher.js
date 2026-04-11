const Voucher = require('../models/voucher');

exports.getVouchers = async (req, res, next) => {
  try {
    const query = { companyId: req.user.companyId };
    if (req.user.role === 'manager') {
      query.branchId = { $in: req.user.branchIds };
    }
    const vouchers = await Voucher.find(query).sort({ date: -1 }).populate('employeeId');
    return res.status(200).json(vouchers);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

exports.getVoucherDetails = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id).populate('employeeId');
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    return res.status(200).json(voucher);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};
