const AuditLog = require('../models/AuditLog');

class AuditLogController {
  /**
   * Get paginated audit logs with flexible filtering
   * GET /api/audit-logs
   */
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        module: logModule,
        action,
        userId,
        search,
        startDate,
        endDate,
        status,
      } = req.query;

      const query = {};

      if (logModule && logModule !== 'ALL') {
        query.module = logModule;
      }

      if (action) {
        query.action = { $regex: action, $options: 'i' };
      }

      if (userId) {
        query.userId = userId;
      }

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          // Set to end of day if only date is passed
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [
          { userName: searchRegex },
          { userEmail: searchRegex },
          { action: searchRegex },
          { description: searchRegex },
          { modelName: searchRegex },
        ];
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate('userId', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('getAuditLogs Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error: error.message,
      });
    }
  }

  /**
   * Get audit statistics (counts by module, today's actions, top active users)
   * GET /api/audit-logs/stats
   */
  async getAuditStats(req, res) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [totalCount, todayCount, moduleStats, topUsers] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: todayStart } }),
        AuditLog.aggregate([
          { $group: { _id: '$module', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        AuditLog.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: '$userName', count: { $sum: 1 }, role: { $first: '$userRole' } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalCount,
          todayCount,
          moduleStats,
          topUsers,
        },
      });
    } catch (error) {
      console.error('getAuditStats Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit statistics',
        error: error.message,
      });
    }
  }
}

module.exports = new AuditLogController();
