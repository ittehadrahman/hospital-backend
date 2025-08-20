const express = require('express');
const { 
  createPatient,
  getPatientByPhone,
  getAllPatients,
  updatePatient,
  deletePatient,
  getPatientByName
} = require('../controllers/patientController.js');

const router = express.Router();

// Create patient
router.post('/create', createPatient);

// Get patient by phone number
router.get('/phone/:phoneNumber', getPatientByPhone);

// Get all patients
router.get('/', getAllPatients);

// Get patient by name
router.get('/name/:name', getPatientByName);

// Update patient by ID
router.put('/:id', updatePatient);

// Delete patient by ID
router.delete('/:id', deletePatient);

module.exports = router;  