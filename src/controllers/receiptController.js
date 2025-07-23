const Receipt = require('../models/Receipts');
const Medicine = require('../models/Medicine'); // to validate medicine and update stock
const Patient = require('../models/Patient'); // to validate patient existence


// Create a new receipt
// POST /api/receipts/new
exports.createReceipt = async (req, res) => {
    try{
        const { patientId, medicines } = req.body;

        // Validate patient existence
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Validate request body
        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        // Validate each medicine and auto-calculate totals
        const processedMedicines = [];
        for (const item of medicines) {
            const { medicineId, quantity, batchNumber } = item;

            // Check if medicine exists
            const medicine = await Medicine.findById(medicineId);
            if (!medicine) {
                return res.status(404).json({ message: `Medicine not found: ${medicineId}` });
            }

            // Check if quantity is valid
            if (!quantity || quantity < 1) {
                return res.status(400).json({ message: `Invalid quantity for medicine: ${medicineId}` });
            }

            // Find the specific batch to get the price
            const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
            if (!batch) {
                return res.status(404).json({ message: `Batch not found: ${batchNumber}` });
            }

            // Check if sufficient quantity is available in the batch
            if (batch.quantity < quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for batch: ${batchNumber}. Available: ${batch.quantity}, Requested: ${quantity}` 
                });
            }

            // Auto-calculate total for this medicine item
            const total = batch.price * quantity;

            // Add processed medicine item with calculated total and medicine details
            processedMedicines.push({
                medicineId,
                medicineName: medicine.name,
                generic: medicine.generic,
                brand: medicine.brand,
                quantity,
                batchNumber,
                price: batch.price,
                total: total
            });
        }

        // Create the receipt with auto-calculated totals
        const receipt = new Receipt({
            patientId,
            medicines: processedMedicines,
            totalAmount: processedMedicines.reduce((sum, item) => sum + item.total, 0)
        });

        // Update medicine current stock and batches
        for (const item of processedMedicines) {
            const { medicineId, quantity, batchNumber } = item;

            // Find the medicine and update its stock
            const medicine = await Medicine.findById(medicineId);
            if (medicine) {
                // Update the specific batch
                const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
                if (batch) {
                    batch.quantity -= quantity;
                    
                    // Remove batch if quantity becomes 0
                    if (batch.quantity === 0) {
                        medicine.batches = medicine.batches.filter(b => b.batchNumber !== batchNumber);
                    }
                    
                    // Recalculate currentStock from all remaining batches
                    medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);
                    
                    // If no batches left, delete the medicine
                    if (medicine.batches.length === 0) {
                        await Medicine.findByIdAndDelete(medicine._id);
                    } else {
                        await medicine.save();
                    }
                }
            }
        }

        await receipt.save();
        res.status(201).json({ 
            message: 'Receipt created successfully', 
            receipt: {
                ...receipt.toObject(),
                patientName: patient.name,
                patientDetails: {
                    name: patient.name,
                    phone: patient.phone_number
                }
            }
        });
    } catch (error) {
        console.error('Error creating receipt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// Update a receipt
// POST /api/receipts/update
exports.updateReceipt = async (req, res) => {
    try {
        const { receiptId, medicines } = req.body;

        // Validate receipt exists
        const existingReceipt = await Receipt.findById(receiptId);
        if (!existingReceipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Validate request body
        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        // First, restore the stock from the existing receipt
        for (const oldItem of existingReceipt.medicines) {
            const { medicineId, quantity, batchNumber } = oldItem;

            // Find the medicine and restore its stock
            const medicine = await Medicine.findById(medicineId);
            if (medicine) {
                // Find the batch by batchNumber and restore quantity
                const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
                
                if (batch) {
                    // Restore quantity to the existing batch
                    batch.quantity += quantity;
                    
                    // Recalculate currentStock
                    medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);
                    await medicine.save();
                }
                // If batch doesn't exist, we can't restore it (it might have been a different batch that was completely sold)
                // This is acceptable since we're just trying to restore what we can
            }
        }

        // Now validate and process the new medicines
        const processedMedicines = [];
        for (const item of medicines) {
            const { medicineId, quantity, batchNumber } = item;

            // Check if medicine exists
            const medicine = await Medicine.findById(medicineId);
            if (!medicine) {
                return res.status(404).json({ message: `Medicine not found: ${medicineId}` });
            }

            // Check if quantity is valid
            if (!quantity || quantity < 1) {
                return res.status(400).json({ message: `Invalid quantity for medicine: ${medicineId}` });
            }

            // Find the specific batch to get the price
            const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
            if (!batch) {
                return res.status(404).json({ message: `Batch not found: ${batchNumber}` });
            }

            // Check if sufficient quantity is available in the batch
            if (batch.quantity < quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for batch: ${batchNumber}. Available: ${batch.quantity}, Requested: ${quantity}` 
                });
            }

            // Auto-calculate total for this medicine item
            const total = batch.price * quantity;

            // Add processed medicine item with calculated total and medicine details
            processedMedicines.push({
                medicineId,
                medicineName: medicine.name,
                generic: medicine.generic,
                brand: medicine.brand,
                quantity,
                batchNumber,
                price: batch.price,
                total: total
            });
        }

        // Update the receipt with new medicines and total
        existingReceipt.medicines = processedMedicines;
        existingReceipt.totalAmount = processedMedicines.reduce((sum, item) => sum + item.total, 0);

        // Update medicine stock with new quantities
        for (const item of processedMedicines) {
            const { medicineId, quantity, batchNumber } = item;

            // Find the medicine and update its stock
            const medicine = await Medicine.findById(medicineId);
            if (medicine) {
                // Update the specific batch
                const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
                if (batch) {
                    batch.quantity -= quantity;
                    
                    // Remove batch if quantity becomes 0
                    if (batch.quantity === 0) {
                        medicine.batches = medicine.batches.filter(b => b.batchNumber !== batchNumber);
                    }
                    
                    // Recalculate currentStock from all remaining batches
                    medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);
                    
                    // If no batches left, delete the medicine
                    if (medicine.batches.length === 0) {
                        await Medicine.findByIdAndDelete(medicine._id);
                    } else {
                        await medicine.save();
                    }
                }
            }
        }

        // Get patient details for response
        const patient = await Patient.findById(existingReceipt.patientId);

        await existingReceipt.save();
        res.status(200).json({ 
            message: 'Receipt updated successfully', 
            receipt: {
                ...existingReceipt.toObject(),
                patientName: patient?.name,
                patientDetails: {
                    name: patient?.name,
                    phone: patient?.phone_number
                }
            }
        });

    } catch (error) {
        console.error('Error updating receipt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a receipt
// POST /api/receipts/:id
exports.deleteReceipt = async (req, res) => {
    try {
        // Get receipt ID from request body
        const { id } = req.body;

        // Validate receipt exists
        const receipt = await Receipt.findById(id);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }
        // Restore stock for each medicine in the receipt
        for (const item of receipt.medicines) {
            const { medicineId, quantity, batchNumber } = item;

            // Find the medicine and restore its stock
            const medicine = await Medicine.findById(medicineId);
            if (medicine) {
                // Find the batch by batchNumber and restore quantity
                const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
                
                if (batch) {
                    // Restore quantity to the existing batch
                    batch.quantity += quantity;
                    
                    // Recalculate currentStock
                    medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);
                    await medicine.save();
                }
            }
        }
        // Delete the receipt
        await Receipt.findByIdAndDelete(id);

        res.status(200).json({ message: 'Receipt deleted successfully' });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all receipts
// GET /api/receipts/all
exports.getAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find().populate('patientId', 'name phone_number');
        res.status(200).json({ receipts });
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

