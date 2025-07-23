const Medicine = require("../models/Medicine");

// Create or update stock if identical medicine exists
exports.createMedicine = async (req, res) => {
    try {
        let { name, generic, brand, batchNumber, expiryDate, price, quantity } = req.body;

        // Make sure price and quantity are numbers
        price = Number(price);
        quantity = Number(quantity);
        if (isNaN(price) || isNaN(quantity)) {
            return res.status(400).json({ message: "Price and quantity must be valid numbers." });
        }

        // Scenario 1: Check for exact match (name, generic, brand, batchNumber, expiryDate, price)
        const exactMatch = await Medicine.findOne({
            name,
            generic,
            brand,
            "batches.batchNumber": batchNumber,
            "batches.expiryDate": expiryDate,
            "batches.price": price,
        });

        if (exactMatch) {
            // Find the specific batch and update its quantity
            const batchIndex = exactMatch.batches.findIndex(batch => 
                batch.batchNumber === batchNumber && 
                batch.expiryDate.getTime() === new Date(expiryDate).getTime() && 
                batch.price === price
            );
            
            exactMatch.batches[batchIndex].quantity += quantity;
            // Auto-calculate currentStock from all batches
            exactMatch.currentStock = exactMatch.batches.reduce((total, batch) => total + batch.quantity, 0);
            const updatedMedicine = await exactMatch.save();

            return res.status(200).json({
                message: "Exact medicine batch found. Quantity and stock updated successfully.",
                medicine: updatedMedicine,
            });
        }

        // Scenario 2: Check for partial match (name, generic, brand only)
        const partialMatch = await Medicine.findOne({
            name,
            generic,
            brand,
        });

        if (partialMatch) {
            // Add new batch to existing medicine
            partialMatch.batches.push({
                batchNumber,
                expiryDate,
                price,
                quantity
            });
            // Auto-calculate currentStock from all batches
            partialMatch.currentStock = partialMatch.batches.reduce((total, batch) => total + batch.quantity, 0);
            const updatedMedicine = await partialMatch.save();

            return res.status(200).json({
                message: "Medicine found. New batch added and stock updated successfully.",
                medicine: updatedMedicine,
            });
        }

        // Scenario 3: No match - create new medicine
        const newMedicine = new Medicine({
            name,
            generic,
            brand,
            currentStock: quantity, // Initial stock equals the first batch quantity
            batches: [{
                batchNumber,
                expiryDate,
                price,
                quantity
            }]
        });

        const savedMedicine = await newMedicine.save();

        return res.status(201).json({
            message: "New medicine created successfully.",
            medicine: savedMedicine,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error creating or updating medicine",
            error: error.message,
        });
    }
};

// Delete a medicine by name and batchNumber
exports.deleteMedicine = async (req, res) => {
    try {
        const { name, batchNumber } = req.body;

        if (!name || !batchNumber) {
            return res.status(400).json({
                message: 'Name and batchNumber are required to delete a medicine'
            });
        }

        // Find the medicine that contains the batch
        const medicine = await Medicine.findOne({
            name,
            "batches.batchNumber": batchNumber
        });

        if (!medicine) {
            return res.status(404).json({
                message: 'Medicine not found with the provided name and batchNumber'
            });
        }

        // Find the batch to be deleted
        const batchToDelete = medicine.batches.find(batch => batch.batchNumber === batchNumber);
        
        if (!batchToDelete) {
            return res.status(404).json({
                message: 'Batch not found in the medicine'
            });
        }

        // If this is the only batch, delete the entire medicine
        if (medicine.batches.length === 1) {
            const deletedMedicine = await Medicine.findByIdAndDelete(medicine._id);
            return res.status(200).json({
                message: 'Medicine deleted successfully (last batch removed)',
                medicine: deletedMedicine
            });
        }

        // Remove the specific batch from the batches array
        medicine.batches = medicine.batches.filter(batch => batch.batchNumber !== batchNumber);
        
        // Recalculate currentStock after removing the batch
        medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);
        
        const updatedMedicine = await medicine.save();

        res.status(200).json({
            message: 'Batch deleted successfully',
            medicine: updatedMedicine,
            deletedBatch: batchToDelete
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error deleting medicine batch',
            error: error.message
        });
    }
};



// Update a medicine by name and batchNumber
exports.updateMedicine = async (req, res) => {
    try {
        const { name, batchNumber, generic, brand, price, quantity, expiryDate } = req.body;

        if (!name || !batchNumber) {
            return res.status(400).json({
                message: 'Name and batchNumber are required to update a medicine'
            });
        }

        // Find the medicine that contains the batch
        const medicine = await Medicine.findOne({
            name,
            "batches.batchNumber": batchNumber
        });

        if (!medicine) {
            return res.status(404).json({
                message: 'Medicine not found with the provided name and batchNumber'
            });
        }

        // Update medicine-level fields if provided
        if (generic !== undefined) medicine.generic = generic;
        if (brand !== undefined) medicine.brand = brand;

        // Find and update the specific batch
        const batchIndex = medicine.batches.findIndex(batch => batch.batchNumber === batchNumber);
        
        if (batchIndex === -1) {
            return res.status(404).json({
                message: 'Batch not found in the medicine'
            });
        }

        // Update batch-specific fields if provided
        if (price !== undefined) medicine.batches[batchIndex].price = Number(price);
        if (quantity !== undefined) medicine.batches[batchIndex].quantity = Number(quantity);
        if (expiryDate !== undefined) medicine.batches[batchIndex].expiryDate = expiryDate;

        // Recalculate currentStock after updating batch quantity
        medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);

        const updatedMedicine = await medicine.save();

        res.status(200).json({
            message: 'Medicine updated successfully',
            medicine: updatedMedicine
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error updating medicine',
            error: error.message
        });
    }
};



// Get all medicines
exports.getAllMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.status(200).json({
        message: "Medicines fetched successfully",
        medicines: medicines,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
        message: "Error fetching medicines",
        error: error.message,
        });
    }
};

// Get medicines by name via POST body with exact match and variants
exports.getMedicineByName = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
        return res.status(400).json({ message: 'Name is required in request body' });
        }

        const medicines = await Medicine.find({
        $or: [
            { name: { $regex: `^${name}$`, $options: 'i' } },    // exact match
            { name: { $regex: `^${name} `, $options: 'i' } }     // starts with name + space (variants)
        ]
        });

        if (medicines.length === 0) {
        return res.status(404).json({ message: 'No medicines found matching the provided name' });
        }

        // Simple alphabetical sort by name
        medicines.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({
        message: 'Medicines fetched successfully by name',
        medicines
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
        message: 'Error fetching medicines by name',
        error: error.message
        });
    }
};


// Get medicines by generic name via POST body
exports.getMedicineByGeneric = async (req, res) => {
    try {
        const { generic } = req.body;

        if (!generic) {
        return res.status(400).json({
            message: 'Generic name is required in request body'
        });
        }

        const medicines = await Medicine.find({ generic });

        if (medicines.length === 0) {
        return res.status(404).json({
            message: 'No medicines found for the provided generic name'
        });
        }

        res.status(200).json({
        message: 'Medicines fetched successfully by generic',
        medicines
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
        message: 'Error fetching medicines by generic',
        error: error.message
        });
    }
};

// Get medicines by brand name via POST body with partial matching
exports.getMedicineByBrand = async (req, res) => {
    try {
        const { brand } = req.body;

        if (!brand) {
            return res.status(400).json({
                message: 'Brand name is required in request body'
            });
        }

        // Use regex for case-insensitive partial match anywhere in the brand string
        const medicines = await Medicine.find({
            brand: { $regex: brand, $options: 'i' }
        });

        if (medicines.length === 0) {
            return res.status(404).json({
                message: 'No medicines found for the provided brand name'
            });
        }

        // Sort alphabetically by brand (optional)
        medicines.sort((a, b) => a.brand.localeCompare(b.brand));

        res.status(200).json({
            message: 'Medicines fetched successfully by brand',
            medicines
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error fetching medicines by brand',
            error: error.message
        });
    }
}
