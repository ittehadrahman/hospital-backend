const OutdoorVisit = require('../models/OutdoorVisit');
const Patient = require('../models/Patient');

// POST /api/outdoor-visits
exports.createOutdoorVisit = async (req, res) => {
  try {
    const { patientId, doctor, symptoms, diagnosis, prescribedMedicines } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const visit = await OutdoorVisit.create({
      patient: patientId,
      doctor,
      symptoms,
      diagnosis,
      prescribedMedicines
    });

    res.status(201).json({ success: true, data: visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// GET /api/outdoor-visits/:patientId
exports.getOutdoorVisitsByPatient = async (req, res) => {
  try {
    const visits = await OutdoorVisit.find({ patient: req.params.patientId }).sort({ visitDate: -1 });
    res.status(200).json({ success: true, count: visits.length, data: visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
