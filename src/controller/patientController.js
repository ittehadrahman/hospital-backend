const Patient = require('../models/Patient.js');
const createPatient = async (req, res) => {
    const { name, phone_number } = req.body;
    try {
        const newPatient = new Patient({
            name,
            date_of_birth,
            phone_number,
            prescriptions: [],
        });
        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (error) {
        res.status(500).json({ message: 'Error creating patient', error });
    }
}
const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find().populate('prescriptions');
        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patients', error });
    }
}

const getPatientByPhoneNumber = async (req, res) => {
    const { phone } = req.params;
    try {
        const patient = await Patient.findOne({ phone_number: phone }).populate('prescriptions');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient by phone number', error });
    }
};

const updatePatient = async (req, res) => {

}

module.exports = {
    createPatient,
    getPatients,
    getPatientByPhoneNumber,
    updatePatient
};