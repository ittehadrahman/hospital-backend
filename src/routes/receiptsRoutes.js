const express = require('express');
const router = express.Router();
const receiptsController = require('../controllers/receiptController');

// POST: Create a new receipt
router.post('/new', receiptsController.createReceipt);

module.exports = router;