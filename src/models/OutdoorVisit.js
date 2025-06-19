const mongoose = require('mongoose');

const outdoorVisitSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    visitDate: { type: Date, default: Date.now },
    doctor: { type: String, required: true, trim: true },
    symptoms: String,
    diagnosis: String,
    prescribedMedicines: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model('OutdoorVisit', outdoorVisitSchema);
