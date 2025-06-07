const express = require('express');
const pharmacyController = require('../controllers/pharmacyController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/pharmacy/sales
router.get('/sales', requirePermission('pharmacy', 'read'), pharmacyController.getAllSales);

// GET /api/pharmacy/sales/stats
router.get('/sales/stats', requirePermission('pharmacy', 'read'), pharmacyController.getSalesStats);

// GET /api/pharmacy/sales/:id
router.get('/sales/:id', requirePermission('pharmacy', 'read'), pharmacyController.getSaleById);

// POST /api/pharmacy/sales
router.post('/sales', requirePermission('pharmacy', 'create'), pharmacyController.createSale);

module.exports = router;
