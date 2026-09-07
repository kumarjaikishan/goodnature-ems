const Voucher = require('../models/voucher');

const getFinancialYearString = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const month = date.getMonth(); // 0-11
  const fullYear = date.getFullYear();
  let startYear, endYear;
  if (month >= 3) { // April onwards
    startYear = fullYear;
    endYear = fullYear + 1;
  } else { // Jan, Feb, Mar
    startYear = fullYear - 1;
    endYear = fullYear;
  }
  const yy1 = (startYear % 100).toString().padStart(2, '0');
  const yy2 = (endYear % 100).toString().padStart(2, '0');
  return `${yy1}${yy2}`;
};

const generateVoucherNo = async (date, session = null) => {
  if (date && typeof date === 'object' && date.constructor?.name === 'ClientSession') {
    session = date;
    date = new Date();
  }
  const finYear = getFinancialYearString(date);
  const prefix = `INV-${finYear}`;
  
  // Search for both new INV-{finYear} and legacy GN-INV-{finYear} to ensure continuous sequential numbering
  let query = {
    voucherNo: { $regex: `^(GN-)?INV-${finYear}` }
  };
  let latestVoucherQuery = Voucher.findOne(query).sort({ voucherNo: -1, createdAt: -1 });
  if (session) {
    latestVoucherQuery = latestVoucherQuery.session(session);
  }
  const latestVoucher = await latestVoucherQuery;

  let nextNum = 1;
  if (latestVoucher && latestVoucher.voucherNo) {
    const parts = latestVoucher.voucherNo.split('-');
    const lastPart = parts[parts.length - 1]; 
    if (lastPart && lastPart.length > 4) {
      const numStr = lastPart.substring(4); 
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }
  
  return `INV-${finYear}${nextNum.toString().padStart(4, '0')}`;
};

module.exports = {
  generateVoucherNo,
  getFinancialYearString
};
