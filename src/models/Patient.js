const mongoose = require('mongoose');

// Patient Schema
const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(v) {
        // Basic phone validation (adjust regex based on your region)
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  
  sex: {
    type: String,
    required: [true, 'Sex is required'],
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: 'Sex must be Male, Female, or Other'
    }
  },
  
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      message: 'Please select a valid blood group'
    }
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(v) {
        return v <= new Date(); // DOB cannot be in the future
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Virtual field for age calculation
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtual fields are included in JSON output
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

// Pre-save middleware for data formatting
patientSchema.pre('save', function(next) {
  // Capitalize first letter of name
  if (this.name) {
    this.name = this.name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Uppercase blood group
  if (this.bloodGroup) {
    this.bloodGroup = this.bloodGroup.toUpperCase();
  }
  
  next();
});

// Static method to find patients by age range
patientSchema.statics.findByAgeRange = function(minAge, maxAge) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
  
  return this.find({
    dateOfBirth: {
      $gte: minDate,
      $lte: maxDate
    }
  });
};

// Create and export the model
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;

