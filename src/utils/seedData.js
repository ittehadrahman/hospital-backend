const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createDefaultSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        username: 'superadmin',
        email: 'superadmin@hospital.com',
        password: 'admin123', // Will be hashed by the pre-save middleware
        role: 'superadmin',
        permissions: []
      });
      
      await superAdmin.save();
      console.log('✅ Default superadmin created successfully');
      console.log('Username: superadmin');
      console.log('Password: admin123');
      console.log('Email: superadmin@hospital.com');
    } else {
      console.log('✅ Superadmin already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default superadmin:', error);
  }
};

module.exports = {
  createDefaultSuperAdmin
};