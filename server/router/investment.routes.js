const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const authmiddlewre = require('../middleware/auth_middleware');
const authorizeRoles = require('../middleware/Role_middleware');

router.use(authmiddlewre);
router.use(authorizeRoles('superadmin', 'admin', 'manager', 'demo', 'grant', 'sponsor'));

// Scheme Config & Rates
router.get('/config', investmentController.getSchemeConfig);
router.put('/config', investmentController.updateSchemeConfig);

// Stats & Dues Report
router.get('/dashboard-stats', investmentController.getDashboardStats);
router.get('/dues', investmentController.getDuesReport);

// Accounts CRUD
router.post('/accounts', investmentController.createAccount);
router.get('/accounts', investmentController.getAccounts);
router.get('/accounts/:id', investmentController.getAccountById);

// Collections & Payments
router.get('/receipts', investmentController.getReceipts);
router.get('/receipts/:id', investmentController.getReceiptById);
router.put('/receipts/:id', investmentController.updateReceipt);
router.delete('/receipts/:id', investmentController.deleteReceipt);
router.post('/accounts/:id/collect', investmentController.collectPayment);

// Receipts Approvals
router.put('/receipts/:id/approve', investmentController.approveReceipt);
router.put('/receipts/:id/reject', investmentController.rejectReceipt);

// Premature Settlement & Closure
router.get('/accounts/:id/settlement-preview', investmentController.calculatePrematureSettlement);
router.post('/accounts/:id/settle', investmentController.processSettlement);

module.exports = router;
