const express = require('express');
const { createPatient,getPatientByPhoneNumber } =require('../controller/patientController.js');
const router = express.Router();

router.post('/patient-create',createPatient);
router.get('/:phone', getPatientByPhoneNumber);
/*router.get('/patients',getPatients);
router.put('/patients/update', updatePatient);*/

module.exports = router;
