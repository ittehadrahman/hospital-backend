const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['superadmin', 'admin', 'employee'])
    .withMessage('Invalid role specified'),
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Prescription validation rules
const validatePrescription = [
  body('patientName')
    .trim()
    .notEmpty()
    .withMessage('Patient name is required'),
  body('patientAge')
    .isInt({ min: 0, max: 150 })
    .withMessage('Patient age must be between 0 and 150'),
  body('patientGender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender specified'),
  body('patientPhone')
    .trim()
    .notEmpty()
    .withMessage('Patient phone is required'),
  body('doctorName')
    .trim()
    .notEmpty()
    .withMessage('Doctor name is required'),
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis is required'),
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  handleValidationErrors
];

// Medicine validation rules
const validateMedicine = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required'),
  body('genericName')
    .trim()
    .notEmpty()
    .withMessage('Generic name is required'),
  body('manufacturer')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('minStockLevel')
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('expiryDate')
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateLogin,
  validatePrescription,
  validateMedicine,
  handleValidationErrors
};