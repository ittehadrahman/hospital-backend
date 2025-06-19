const Medicine = require("../models/Medicine");

// Create or update stock if identical medicine exists
exports.createMedicine = async (req, res) => {
    try {
        let { name, generic, brand, price, stock, batchNumber, expiryDate } =
        req.body;

        // Make sure stock & price are numbers
        stock = Number(stock);
        price = Number(price);

        if (isNaN(stock) || isNaN(price)) {
        return res
            .status(400)
            .json({ message: "Stock and price must be valid numbers." });
        }

        const existingMedicine = await Medicine.findOne({
            name,
            generic,
            brand,
            price,
            batchNumber,
            expiryDate,
        });

        if (existingMedicine) {
        existingMedicine.stock += stock; // now both are numbers
        const updatedMedicine = await existingMedicine.save();

        return res.status(200).json({
            message: "Medicine already exists. Stock updated successfully.",
            medicine: updatedMedicine,
        });
        } else {
        const newMedicine = new Medicine({
            name,
            generic,
            brand,
            price,
            stock,
            batchNumber,
            expiryDate,
        });

        const savedMedicine = await newMedicine.save();

        return res.status(201).json({
            message: "New medicine created successfully.",
            medicine: savedMedicine,
        });
        }
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

        // Find and delete the medicine
        const deletedMedicine = await Medicine.findOneAndDelete({ name, batchNumber });

        if (!deletedMedicine) {
        return res.status(404).json({
            message: 'Medicine not found with the provided name and batchNumber'
        });
        }

        res.status(200).json({
        message: 'Medicine deleted successfully',
        medicine: deletedMedicine
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
        message: 'Error deleting medicine',
        error: error.message
        });
    }
};



// Update a medicine by name and batchNumber
exports.updateMedicine = async (req, res) => {
    try {
        const { name, batchNumber, generic, brand, price, stock, expiryDate } = req.body;

        if (!name || !batchNumber) {
        return res.status(400).json({
            message: 'Name and batchNumber are required to update a medicine'
        });
        }

        // Build update object dynamically
        const updateFields = {};

        if (generic !== undefined) updateFields.generic = generic;
        if (brand !== undefined) updateFields.brand = brand;
        if (price !== undefined) updateFields.price = Number(price);
        if (stock !== undefined) updateFields.stock = Number(stock);
        if (expiryDate !== undefined) updateFields.expiryDate = expiryDate;

        const updatedMedicine = await Medicine.findOneAndUpdate(
        { name, batchNumber },
        { $set: updateFields },
        { new: true, runValidators: true }
        );

        if (!updatedMedicine) {
        return res.status(404).json({
            message: 'Medicine not found with the provided name and batchNumber'
        });
        }

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