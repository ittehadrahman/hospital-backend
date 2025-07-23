const Receipt = require('../models/Receipts');
const Medicine = require('../models/Medicine'); // to validate medicine and update stock
const Patient = require('../models/Patient'); // to validate patient existence


// Create a new receipt
// POST /api/receipts/new
exports.createReceipt = async (req, res) => {
    try {
        const { patientId, medicines } = req.body;

        if (!patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({
            message: 'patientId and medicines array are required',
        });
        }

        let totalAmount = 0;

        // Validate medicines and calculate totalAmount
        for (const item of medicines) {
        if (!item.medicineId || !item.quantity || item.quantity <= 0) {
            return res.status(400).json({
            message: 'Each medicine must have a valid medicineId and positive quantity',
            });
        }

        // Find medicine to get price and check stock
        const med = await Medicine.findById(item.medicineId);
        if (!med) {
            return res.status(404).json({
            message: `Medicine not found with id ${item.medicineId}`,
            });
        }

        if (med.stock < item.quantity) {
            return res.status(400).json({
            message: `Insufficient stock for medicine ${med.name}. Available: ${med.stock}`,
            });
        }

        // Calculate total for this item
        item.total = med.price * item.quantity;

        totalAmount += item.total;
        }

        // Reduce stock for each medicine
        for (const item of medicines) {
        await Medicine.findByIdAndUpdate(item.medicineId, {
            $inc: { stock: -item.quantity }
        });
        }

        // Create receipt document
        const receipt = new Receipt({
        patientId,
        medicines,
        totalAmount,
        receiptDate: new Date()
        });

        const savedReceipt = await receipt.save();

        // Populate patient info and medicine details
        const populatedReceipt = await Receipt.findById(savedReceipt._id)
        .populate({
            path: 'patientId',
            select: 'name phone_number'  // Adjust fields if your patient schema uses different field names
        })
        .populate({
            path: 'medicines.medicineId',
            select: 'name brand'
        });

        res.status(201).json({
        message: 'Receipt created successfully',
        receipt: populatedReceipt,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
        message: 'Error creating receipt',
        error: error.message,
        });
    }
};

