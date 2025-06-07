// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'employee'], required: true },
  permissions: [{
    module: { type: String, required: true }, // 'prescriptions', 'pharmacy'
    actions: [{ type: String }] // ['create', 'read', 'update', 'delete']
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const prescriptionSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, enum: ['male', 'female', 'other'], required: true },
  patientPhone: { type: String, required: true },
  patientAddress: { type: String, required: true },
  doctorName: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String }
  }],
  prescriptionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'fulfilled', 'cancelled'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  manufacturer: { type: String, required: true },
  category: { type: String, required: true },
  strength: { type: String, required: true },
  form: { type: String, required: true }, // tablet, capsule, syrup, etc.
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  minStockLevel: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  batchNumber: { type: String, required: true },
  supplier: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const pharmacySaleSchema = new mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'insurance'], required: true },
  saleDate: { type: Date, default: Date.now },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);
const Medicine = mongoose.model('Medicine', medicineSchema);
const PharmacySale = mongoose.model('PharmacySale', pharmacySaleSchema);

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital_secret_key');
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware for role-based access
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware for permission-based access
const requirePermission = (module, action) => {
  return (req, res, next) => {
    // Superadmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has specific permission
    const permission = req.user.permissions.find(p => p.module === module);
    if (!permission || !permission.actions.includes(action)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'hospital_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    permissions: req.user.permissions
  });
});

// User Management Routes
app.get('/api/users', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/users', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body;

    // Only superadmin can create admin users
    if (role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can create admin users' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      permissions: permissions || []
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Username or email already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only superadmin can modify admin users or change roles
    if ((user.role === 'admin' || role === 'admin') && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can modify admin users' });
    }

    const updateData = { updatedAt: Date.now() };
    if (permissions !== undefined) updateData.permissions = permissions;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Prescription Routes
app.get('/api/prescriptions', authenticateToken, requirePermission('prescriptions', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientName } = req.query;
    const query = {};

    if (status) query.status = status;
    if (patientName) query.patientName = new RegExp(patientName, 'i');

    const prescriptions = await Prescription.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/prescriptions', authenticateToken, requirePermission('prescriptions', 'create'), async (req, res) => {
  try {
    const prescriptionData = {
      ...req.body,
      createdBy: req.user._id
    };

    const prescription = new Prescription(prescriptionData);
    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('createdBy', 'username');

    res.status(201).json(populatedPrescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/prescriptions/:id', authenticateToken, requirePermission('prescriptions', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: Date.now() };

    const prescription = await Prescription.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/prescriptions/:id', authenticateToken, requirePermission('prescriptions', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByIdAndDelete(id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Medicine/Pharmacy Routes
app.get('/api/medicines', authenticateToken, requirePermission('pharmacy', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, lowStock } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStockLevel'] };
    }

    const medicines = await Medicine.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Medicine.countDocuments(query);

    res.json({
      medicines,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/medicines', authenticateToken, requirePermission('pharmacy', 'create'), async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      createdBy: req.user._id
    };

    const medicine = new Medicine(medicineData);
    await medicine.save();

    const populatedMedicine = await Medicine.findById(medicine._id)
      .populate('createdBy', 'username');

    res.status(201).json(populatedMedicine);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/medicines/:id', authenticateToken, requirePermission('pharmacy', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: Date.now() };

    const medicine = await Medicine.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username');

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/medicines/:id', authenticateToken, requirePermission('pharmacy', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByIdAndUpdate(
      id, 
      { isActive: false, updatedAt: Date.now() }, 
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pharmacy Sales Routes
app.get('/api/pharmacy/sales', authenticateToken, requirePermission('pharmacy', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await PharmacySale.find(query)
      .populate('soldBy', 'username')
      .populate('items.medicineId', 'name genericName')
      .populate('prescriptionId', 'patientName')
      .sort({ saleDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PharmacySale.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/pharmacy/sales', authenticateToken, requirePermission('pharmacy', 'create'), async (req, res) => {
  try {
    const { items, ...saleData } = req.body;

    // Validate stock availability and update stock
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(400).json({ message: `Medicine with ID ${item.medicineId} not found` });
      }
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
      }
    }

    // Create sale record
    const sale = new PharmacySale({
      ...saleData,
      items,
      soldBy: req.user._id
    });

    await sale.save();

    // Update medicine stock
    for (const item of items) {
      await Medicine.findByIdAndUpdate(
        item.medicineId,
        { $inc: { stock: -item.quantity }, updatedAt: Date.now() }
      );
    }

    const populatedSale = await PharmacySale.findById(sale._id)
      .populate('soldBy', 'username')
      .populate('items.medicineId', 'name genericName')
      .populate('prescriptionId', 'patientName');

    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dashboard/Statistics Routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalPrescriptions,
      todayPrescriptions,
      totalMedicines,
      lowStockMedicines,
      todaySales,
      totalSalesAmount
    ] = await Promise.all([
      Prescription.countDocuments(),
      Prescription.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Medicine.countDocuments({ isActive: true }),
      Medicine.countDocuments({ 
        isActive: true,
        $expr: { $lte: ['$stock', '$minStockLevel'] }
      }),
      PharmacySale.countDocuments({ saleDate: { $gte: startOfDay, $lte: endOfDay } }),
      PharmacySale.aggregate([
        { $match: { saleDate: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      totalPrescriptions,
      todayPrescriptions,
      totalMedicines,
      lowStockMedicines,
      todaySales,
      todaySalesAmount: totalSalesAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create default superadmin user
async function createDefaultSuperAdmin() {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const superAdmin = new User({
        username: 'superadmin',
        email: 'superadmin@hospital.com',
        password: hashedPassword,
        role: 'superadmin',
        permissions: []
      });
      await superAdmin.save();
      console.log('Default superadmin created: username=superadmin, password=admin123');
    }
  } catch (error) {
    console.error('Error creating default superadmin:', error);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createDefaultSuperAdmin();
});

module.exports = app;