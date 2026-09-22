const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const authmiddlewre = require('../middleware/auth_middleware');
const authorizeRoles = require('../middleware/Role_middleware');
const checkPermission = require('../middleware/checkpermission');

router.use(authmiddlewre);
router.use(authorizeRoles('superadmin', 'admin', 'manager', 'demo', 'grant', 'sponsor'));

// Scheme Config & Rates
router.get('/config', checkPermission('investment', 1), investmentController.getSchemeConfig);
router.put('/config', checkPermission('investment', 3), investmentController.updateSchemeConfig);

// Stats & Dues Report
router.get('/dashboard-stats', checkPermission('investment', 1), investmentController.getDashboardStats);
router.get('/dues', checkPermission('investment', 1), investmentController.getDuesReport);

// Accounts CRUD
router.post('/accounts', checkPermission('investment', 2), investmentController.createAccount);
router.get('/accounts', checkPermission('investment', 1), investmentController.getAccounts);
router.get('/accounts/:id', checkPermission('investment', 1), investmentController.getAccountById);
router.delete('/accounts/:id', checkPermission('investment', 4), investmentController.deleteAccount);

// Collections & Payments
router.get('/receipts', checkPermission('investment', 1), investmentController.getReceipts);
router.get('/receipts/:id', checkPermission('investment', 1), investmentController.getReceiptById);
router.put('/receipts/:id', checkPermission('investment', 3), investmentController.updateReceipt);
router.delete('/receipts/:id', checkPermission('investment', 4), investmentController.deleteReceipt);
router.post('/accounts/:id/collect', checkPermission('investment', 2), investmentController.collectPayment);

// Receipts Approvals
router.put('/receipts/:id/approve', checkPermission('investment', 3), investmentController.approveReceipt);
router.put('/receipts/:id/reject', checkPermission('investment', 3), investmentController.rejectReceipt);

// Premature Settlement & Closure
router.get('/accounts/:id/settlement-preview', checkPermission('investment', 1), investmentController.calculatePrematureSettlement);
router.post('/accounts/:id/settle', checkPermission('investment', 3), investmentController.processSettlement);

module.exports = router;
