const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validatePrescription } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/prescriptions
router.get('/', requirePermission('prescriptions', 'read'), prescriptionController.getAllPrescriptions);

// GET /api/prescriptions/stats
router.get('/stats', requirePermission('prescriptions', 'read'), prescriptionController.getPrescriptionStats);

// GET /api/prescriptions/:id
router.get('/:id', requirePermission('prescriptions', 'read'), prescriptionController.getPrescriptionById);

// POST /api/prescriptions
router.post('/', requirePermission('prescriptions', 'create'), validatePrescription, prescriptionController.createPrescription);

// PUT /api/prescriptions/:id
router.put('/:id', requirePermission('prescriptions', 'update'), prescriptionController.updatePrescription);

// DELETE /api/prescriptions/:id
router.delete('/:id', requirePermission('prescriptions', 'delete'), prescriptionController.deletePrescription);

module.exports = router;