const Medicine = require('../models/Medicine');

const medicineController = {
  // Get all medicines
  getAllMedicines: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        lowStock,
        search,
        expired
      } = req.query;

      const query = { isActive: true };

      if (category) query.category = category;
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { genericName: new RegExp(search, 'i') },
          { manufacturer: new RegExp(search, 'i') }
        ];
      }

      if (lowStock === 'true') {
        query.$expr = { $lte: ['$stock', '$minStockLevel'] };
      }

      if (expired === 'true') {
        query.expiryDate = { $lte: new Date() };
      }

      const medicines = await Medicine.find(query)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Medicine.countDocuments(query);

      res.json({
        medicines,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get all medicines error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get medicine by ID
  getMedicineById: async (req, res) => {
    try {
      const medicine = await Medicine.findById(req.params.id)
        .populate('createdBy', 'username email');
      
      if (!medicine || !medicine.isActive) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      res.json(medicine);
    } catch (error) {
      console.error('Get medicine by ID error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create new medicine
  createMedicine: async (req, res) => {
    try {
      const medicineData = {
        ...req.body,
        createdBy: req.user._id
      };

      const medicine = new Medicine(medicineData);
      await medicine.save();

      const populatedMedicine = await Medicine.findById(medicine._id)
        .populate('createdBy', 'username email');

      res.status(201).json({
        message: 'Medicine created successfully',
        medicine: populatedMedicine
      });
    } catch (error) {
      console.error('Create medicine error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update medicine
  updateMedicine: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body, updatedAt: Date.now() };

      const medicine = await Medicine.findByIdAndUpdate(
        id, 
        updateData, 
        { 
          new: true,
          runValidators: true 
        }
      ).populate('createdBy', 'username email');

      if (!medicine || !medicine.isActive) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      res.json({
        message: 'Medicine updated successfully',
        medicine
      });
    } catch (error) {
      console.error('Update medicine error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete medicine (soft delete)
  deleteMedicine: async (req, res) => {
    try {
      const { id } = req.params;

      const medicine = await Medicine.findByIdAndUpdate(
        id, 
        { isActive: false, updatedAt: Date.now() }, 
        { new: true }
      );

      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      res.json({ message: 'Medicine deactivated successfully' });
    } catch (error) {
      console.error('Delete medicine error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get medicine statistics
  getMedicineStats: async (req, res) => {
    try {
      const [
        totalMedicines,
        lowStockMedicines,
        expiredMedicines,
        totalValue
      ] = await Promise.all([
        Medicine.countDocuments({ isActive: true }),
        Medicine.countDocuments({ 
          isActive: true,
          $expr: { $lte: ['$stock', '$minStockLevel'] }
        }),
        Medicine.countDocuments({ 
          isActive: true,
          expiryDate: { $lte: new Date() }
        }),
        Medicine.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$price'] } } } }
        ])
      ]);

      res.json({
        totalMedicines,
        lowStockMedicines,
        expiredMedicines,
        totalValue: totalValue[0]?.total || 0
      });
    } catch (error) {
      console.error('Get medicine stats error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = medicineController;
