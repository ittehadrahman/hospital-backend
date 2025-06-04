const express = require('express');
const { createPatient, getPatientByPhoneNumber, getPatients, updatePatient } =require('../controller/patientController.js');
const router = express.Router();

router.post('/patient-create',createPatient);
router.get('/patients',getPatients);
router.get('/patients/:phone', getPatientByPhoneNumber);
router.put('/patients/update', updatePatient);

module.exports = router;
