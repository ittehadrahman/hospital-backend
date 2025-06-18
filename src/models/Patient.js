const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    date_of_birth: {
        type: Date,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
    },
    /*prescriptions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    }],*/
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;