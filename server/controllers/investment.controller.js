const investmentService = require('../services/investment.service');

class InvestmentController {
  async getSchemeConfig(req, res) {
    try {
      const config = await investmentService.getSchemeConfig();
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateSchemeConfig(req, res) {
    try {
      const config = await investmentService.updateSchemeConfig(req.body, req.user?._id || req.user?.id);
      res.status(200).json({ success: true, message: 'Scheme matrix updated successfully', data: config });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async createAccount(req, res) {
    try {
      const account = await investmentService.createAccount(req.body, req.user?._id || req.user?.id);
      res.status(201).json({ success: true, message: `${account.accountType} account registered successfully`, data: account });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAccounts(req, res) {
    try {
      const result = await investmentService.getAccounts(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAccountById(req, res) {
    try {
      const result = await investmentService.getAccountById(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async collectPayment(req, res) {
    try {
      const receipt = await investmentService.collectPayment(req.params.id, req.body, req.user?._id || req.user?.id);
      res.status(200).json({ success: true, message: 'Payment collected successfully', data: receipt });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async approveReceipt(req, res) {
    try {
      const receipt = await investmentService.approveReceipt(req.params.id, req.user?._id || req.user?.id);
      res.status(200).json({ success: true, message: 'Receipt approved & ledger updated', data: receipt });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async rejectReceipt(req, res) {
    try {
      const receipt = await investmentService.rejectReceipt(req.params.id, req.body.reason, req.user?._id || req.user?.id);
      res.status(200).json({ success: true, message: 'Receipt marked as rejected', data: receipt });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async calculatePrematureSettlement(req, res) {
    try {
      const calc = await investmentService.calculatePrematureSettlement(req.params.id);
      res.status(200).json({ success: true, data: calc });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async processSettlement(req, res) {
    try {
      const account = await investmentService.processSettlement(req.params.id, req.body, req.user?._id || req.user?.id);
      res.status(200).json({ success: true, message: 'Account settlement processed successfully', data: account });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getDuesReport(req, res) {
    try {
      const report = await investmentService.getDuesReport();
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const stats = await investmentService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getReceipts(req, res) {
    try {
      const data = await investmentService.getReceipts(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getReceiptById(req, res) {
    try {
      const data = await investmentService.getReceiptById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async updateReceipt(req, res) {
    try {
      const data = await investmentService.updateReceipt(req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Receipt updated successfully' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteReceipt(req, res) {
    try {
      const data = await investmentService.deleteReceipt(req.params.id);
      res.status(200).json({ success: true, message: data.message });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new InvestmentController();
