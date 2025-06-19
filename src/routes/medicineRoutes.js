const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// POST: Create or update a medicine
// If the medicine already exists, it updates the stock
// If it doesn't exist, it creates a new medicine entry
router.post('/create', medicineController.createMedicine);

// DELETE: Delete a medicine by name and batchNumber
router.delete('/remove', medicineController.deleteMedicine);

// PUT for updating by name & batchNumber
router.put('/update', medicineController.updateMedicine);


// GET: Get all medicines
router.get('/all', medicineController.getAllMedicines);

// Get medicines by name
router.post('/name', medicineController.getMedicineByName);

// Get medicines by generic name
router.post('/generic', medicineController.getMedicineByGeneric);

// Get medicines by brand name
router.post('/brand', medicineController.getMedicineByBrand);

module.exports = router;
