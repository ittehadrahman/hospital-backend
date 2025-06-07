const express = require('express');
const medicineController = require('../controllers/medicineController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateMedicine } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/medicines
router.get('/', requirePermission('pharmacy', 'read'), medicineController.getAllMedicines);

// GET /api/medicines/stats
router.get('/stats', requirePermission('pharmacy', 'read'), medicineController.getMedicineStats);

// GET /api/medicines/:id
router.get('/:id', requirePermission('pharmacy', 'read'), medicineController.getMedicineById);

// POST /api/medicines
router.post('/', requirePermission('pharmacy', 'create'), validateMedicine, medicineController.createMedicine);

// PUT /api/medicines/:id
router.put('/:id', requirePermission('pharmacy', 'update'), medicineController.updateMedicine);

// DELETE /api/medicines/:id (soft delete)
router.delete('/:id', requirePermission('pharmacy', 'delete'), medicineController.deleteMedicine);

module.exports = router;
