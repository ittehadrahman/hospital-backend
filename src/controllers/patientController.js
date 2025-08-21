const Patient = require('../models/Patient'); // Adjust path as needed

// Patient Controller
const patientController = {

  // Create a new patient
  createPatient: async (req, res) => {
    try {
      const patientData = req.body;
      
      // Check if phone number already exists
      const existingPatient = await Patient.findOne({ phoneNumber: patientData.phoneNumber });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Patient with this phone number already exists'
        });
      }

      const newPatient = new Patient(patientData);
      const savedPatient = await newPatient.save();

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: savedPatient
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating patient',
        error: error.message
      });
    }
  },

  // Get all patients
  getAllPatients: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const patients = await Patient.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Sort by newest first

      const total = await Patient.countDocuments();

      res.status(200).json({
        success: true,
        message: 'Patients retrieved successfully',
        data: patients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPatients: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving patients',
        error: error.message
      });
    }
  },

  // Get patient by phone number
  getPatientByPhone: async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      
      const patient = await Patient.findOne({ phoneNumber });
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found with this phone number'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Patient found successfully',
        data: patient
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving patient',
        error: error.message
      });
    }
  },

  // Get patient by name (supports partial matching)
  getPatientByName: async (req, res) => {
    try {
      const { name } = req.params;
      
      // Use regex for case-insensitive partial matching
      const patients = await Patient.find({
        name: { $regex: name, $options: 'i' }
      });

      if (patients.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No patients found with this name'
        });
      }

      res.status(200).json({
        success: true,
        message: `Found ${patients.length} patient(s)`,
        data: patients
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching for patient',
        error: error.message
      });
    }
  },

  // Update patient by ID
  updatePatient: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating phone number, check for duplicates
      if (updateData.phoneNumber) {
        const existingPatient = await Patient.findOne({ 
          phoneNumber: updateData.phoneNumber,
          _id: { $ne: id } // Exclude current patient
        });
        
        if (existingPatient) {
          return res.status(400).json({
            success: false,
            message: 'Another patient with this phone number already exists'
          });
        }
      }

      const updatedPatient = await Patient.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validators
        }
      );

      if (!updatedPatient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: updatedPatient
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating patient',
        error: error.message
      });
    }
  },

  // Delete patient by ID
  deletePatient: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedPatient = await Patient.findByIdAndDelete(id);

      if (!deletedPatient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Patient deleted successfully',
        data: deletedPatient
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting patient',
        error: error.message
      });
    }
  },

  // Additional utility methods

  // Get patient by ID
  getPatientById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const patient = await Patient.findById(id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Patient found successfully',
        data: patient
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving patient',
        error: error.message
      });
    }
  },

  // Get patients by blood group
  getPatientsByBloodGroup: async (req, res) => {
    try {
      const { bloodGroup } = req.params;
      
      const patients = await Patient.find({ 
        bloodGroup: bloodGroup.toUpperCase() 
      });

      res.status(200).json({
        success: true,
        message: `Found ${patients.length} patient(s) with blood group ${bloodGroup.toUpperCase()}`,
        data: patients
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving patients',
        error: error.message
      });
    }
  },

  // Get patients by age range
  getPatientsByAgeRange: async (req, res) => {
    try {
      const { minAge, maxAge } = req.query;
      
      if (!minAge || !maxAge) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both minAge and maxAge in query parameters'
        });
      }

      const patients = await Patient.findByAgeRange(parseInt(minAge), parseInt(maxAge));

      res.status(200).json({
        success: true,
        message: `Found ${patients.length} patient(s) between ages ${minAge}-${maxAge}`,
        data: patients
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving patients',
        error: error.message
      });
    }
  }

};

module.exports = patientController;