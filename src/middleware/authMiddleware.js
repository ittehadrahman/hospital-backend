/**
 * Validate user input for create/update operations
 */
const validateUserInput = (req, res, next) => {
  const { name, email, phoneNumber, password } = req.body;
  
  // For user creation, require all fields
  if (req.method === 'POST') {
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide name, email, phone number and password' 
      });
    }
  }
  
  // Email validation (if provided)
  if (email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide a valid email' 
      });
    }
  }
  
  // Phone validation (if provided)
  if (phoneNumber) {
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid phone number'
      });
    }
  }
  
  // Password validation (if provided)
  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    });
  }
  
  next();
};

/**
 * Validate password update request
 */
const validatePasswordUpdate = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both current password and new password'
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters'
    });
  }
  
  next();
};

module.exports = { 
  validateUserInput,
  validatePasswordUpdate
};