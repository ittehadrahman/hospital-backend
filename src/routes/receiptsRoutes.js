const express = require('express');
const router = express.Router();
const receiptsController = require('../controllers/receiptController');

// POST: Create a new receipt
router.post('/new', receiptsController.createReceipt);

// POST: Update an existing receipt
router.post('/update', receiptsController.updateReceipt);

// POST: Delete a receipt
router.post('/delete', receiptsController.deleteReceipt);

// GET: Get all receipts
router.get('/all', receiptsController.getAllReceipts);

// GET: Sales report of all time
router.get('/report', receiptsController.getSalesReport);

// GET: Receipts within a date range
router.get('/date-range', receiptsController.getReceiptsByDateRange);

// GET : Sales report by date range
router.get('/report/date-range', receiptsController.getSalesReportByDateRange);

// GET: Receipts by patient ID
router.get('/patient/:patientId', receiptsController.getReceiptsByPatient);

// GET: Receipt by ID (must be last among GET routes with parameters)
router.get('/:id', receiptsController.getReceiptById);



module.exports = router;