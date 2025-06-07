const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  }
});

const prescriptionSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  patientAge: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems unrealistic']
  },
  patientGender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Patient gender is required']
  },
  patientPhone: {
    type: String,
    required: [true, 'Patient phone is required'],
    trim: true
  },
  patientAddress: {
    type: String,
    required: [true, 'Patient address is required'],
    trim: true
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true
  },
  medications: {
    type: [medicationSchema],
    validate: {
      validator: function(medications) {
        return medications && medications.length > 0;
      },
      message: 'At least one medication is required'
    }
  },
  prescriptionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
prescriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
prescriptionSchema.index({ patientName: 'text', diagnosis: 'text' });
prescriptionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);