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



module.exports = router;