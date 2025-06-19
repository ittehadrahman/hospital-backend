const express = require('express');
const router = express.Router();
const visitCtrl = require('../controllers/outdoorVisitController');

router.post('/', visitCtrl.createOutdoorVisit);          // POST /api/outdoor-visits
router.get('/:patientId', visitCtrl.getOutdoorVisitsByPatient); // GET /api/outdoor-visits/:patientId

module.exports = router;
