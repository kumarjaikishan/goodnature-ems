const dashboardService = require('../services/dashboard.service');

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const overview = await dashboardService.getDashboardOverview(req.user, req.userid, req.query);
    return res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return next({ status: 500, message: error.message || 'Failed to fetch dashboard overview' });
  }
};

exports.getDashboardSectionDetails = async (req, res, next) => {
  try {
    const {
      section,
      filterType = 'day',
      date,
      financialYear,
      month,
      startDate,
      endDate,
      branchId,
      subFilter = 'all',
      search = '',
      page = 1,
      limit = 15
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));

    const dateRange = dashboardService.getDateRange(filterType, { date, financialYear, month, startDate, endDate });
    const scope = await dashboardService.getRoleScope(req.user, req.userid);

    let result = null;

    switch (section) {
      case 'income':
        result = await dashboardService.getTotalIncome(scope, dateRange, branchId, subFilter, pageNum, limitNum);
        break;

      case 'expense':
        result = await dashboardService.getTotalExpense(scope, dateRange, branchId, subFilter, pageNum, limitNum);
        break;

      case 'customers':
        result = await dashboardService.getAllCustomers(scope, dateRange, branchId, subFilter, search, pageNum, limitNum);
        break;

      case 'promoters':
        result = await dashboardService.getAllPromoters(scope, branchId, subFilter, search, pageNum, limitNum);
        break;

      case 'ledger':
        result = await dashboardService.getAccountLedgers(scope, dateRange, subFilter, search, pageNum, limitNum);
        break;

      case 'sellers':
        result = await dashboardService.getAllSellers(scope, subFilter !== 'all' ? subFilter : '', search, pageNum, limitNum);
        break;

      case 'employees':
        result = await dashboardService.getAllEmployees(scope, branchId, search, pageNum, limitNum);
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown dashboard section: ${section}` });
    }

    return res.status(200).json({
      success: true,
      section,
      dateRange,
      data: result
    });
  } catch (error) {
    console.error('Error fetching dashboard section details:', error);
    return next({ status: 500, message: error.message || 'Failed to fetch dashboard section details' });
  }
};
