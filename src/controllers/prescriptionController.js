const Prescription = require('../models/Prescription');

const prescriptionController = {
  // Get all prescriptions
  getAllPrescriptions: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        patientName, 
        doctorName,
        startDate,
        endDate
      } = req.query;

      const query = {};

      if (status) query.status = status;
      if (patientName) query.patientName = new RegExp(patientName, 'i');
      if (doctorName) query.doctorName = new RegExp(doctorName, 'i');
      
      if (startDate || endDate) {
        query.prescriptionDate = {};
        if (startDate) query.prescriptionDate.$gte = new Date(startDate);
        if (endDate) query.prescriptionDate.$lte = new Date(endDate);
      }

      const prescriptions = await Prescription.find(query)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Prescription.countDocuments(query);

      res.json({
        prescriptions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get all prescriptions error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get prescription by ID
  getPrescriptionById: async (req, res) => {
    try {
      const prescription = await Prescription.findById(req.params.id)
        .populate('createdBy', 'username email');
      
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      res.json(prescription);
    } catch (error) {
      console.error('Get prescription by ID error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create new prescription
  createPrescription: async (req, res) => {
    try {
      const prescriptionData = {
        ...req.body,
        createdBy: req.user._id
      };

      const prescription = new Prescription(prescriptionData);
      await prescription.save();

      const populatedPrescription = await Prescription.findById(prescription._id)
        .populate('createdBy', 'username email');

      res.status(201).json({
        message: 'Prescription created successfully',
        prescription: populatedPrescription
      });
    } catch (error) {
      console.error('Create prescription error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update prescription
  updatePrescription: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body, updatedAt: Date.now() };

      const prescription = await Prescription.findByIdAndUpdate(
        id, 
        updateData, 
        { 
          new: true,
          runValidators: true 
        }
      ).populate('createdBy', 'username email');

      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      res.json({
        message: 'Prescription updated successfully',
        prescription
      });
    } catch (error) {
      console.error('Update prescription error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete prescription
  deletePrescription: async (req, res) => {
    try {
      const { id } = req.params;

      const prescription = await Prescription.findByIdAndDelete(id);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
      console.error('Delete prescription error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get prescription statistics
  getPrescriptionStats: async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [
        totalPrescriptions,
        todayPrescriptions,
        activePrescriptions,
        fulfilledPrescriptions,
        cancelledPrescriptions
      ] = await Promise.all([
        Prescription.countDocuments(),
        Prescription.countDocuments({ 
          prescriptionDate: { $gte: startOfDay, $lte: endOfDay } 
        }),
        Prescription.countDocuments({ status: 'active' }),
        Prescription.countDocuments({ status: 'fulfilled' }),
        Prescription.countDocuments({ status: 'cancelled' })
      ]);

      res.json({
        totalPrescriptions,
        todayPrescriptions,
        activePrescriptions,
        fulfilledPrescriptions,
        cancelledPrescriptions
      });
    } catch (error) {
      console.error('Get prescription stats error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = prescriptionController;
