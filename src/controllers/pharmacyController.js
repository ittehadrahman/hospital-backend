const PharmacySale = require('../models/PharmacySale');
const Medicine = require('../models/Medicine');
const mongoose = require('mongoose');

const pharmacyController = {
  // Get all sales
  getAllSales: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        startDate, 
        endDate,
        customerName,
        paymentMethod
      } = req.query;

      const query = {};

      if (startDate || endDate) {
        query.saleDate = {};
        if (startDate) query.saleDate.$gte = new Date(startDate);
        if (endDate) query.saleDate.$lte = new Date(endDate);
      }

      if (customerName) query.customerName = new RegExp(customerName, 'i');
      if (paymentMethod) query.paymentMethod = paymentMethod;

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
      console.error('Get all sales error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get sale by ID
  getSaleById: async (req, res) => {
    try {
      const sale = await PharmacySale.findById(req.params.id)
        .populate('soldBy', 'username email')
        .populate('items.medicineId', 'name genericName')
        .populate('prescriptionId', 'patientName');
      
      if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
      }

      res.json(sale);
    } catch (error) {
      console.error('Get sale by ID error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create new sale
  createSale: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { items, ...saleData } = req.body;

      // Validate stock availability
      for (const item of items) {
        const medicine = await Medicine.findById(item.medicineId).session(session);
        if (!medicine || !medicine.isActive) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `Medicine with ID ${item.medicineId} not found` 
          });
        }
        if (medicine.stock < item.quantity) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Required: ${item.quantity}` 
          });
        }
      }

      // Calculate totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const medicine = await Medicine.findById(item.medicineId).session(session);
        const itemTotal = item.quantity * medicine.price;
        subtotal += itemTotal;

        processedItems.push({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: medicine.price,
          totalPrice: itemTotal,
          discount: item.discount || 0
        });
      }

      const tax = saleData.tax || 0;
      const discount = saleData.discount || 0;
      const totalAmount = subtotal + tax - discount;

      // Create sale record
      const sale = new PharmacySale({
        ...saleData,
        items: processedItems,
        subtotal,
        tax,
        discount,
        totalAmount,
        soldBy: req.user._id
      });

      await sale.save({ session });

      // Update medicine stock
      for (const item of items) {
        await Medicine.findByIdAndUpdate(
          item.medicineId,
          { 
            $inc: { stock: -item.quantity },
            updatedAt: Date.now()
          },
          { session }
        );
      }

      await session.commitTransaction();

      const populatedSale = await PharmacySale.findById(sale._id)
        .populate('soldBy', 'username')
        .populate('items.medicineId', 'name genericName')
        .populate('prescriptionId', 'patientName');

      res.status(201).json({
        message: 'Sale created successfully',
        sale: populatedSale
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Create sale error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },

  // Get sales statistics
  getSalesStats: async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [
        totalSales,
        todaySales,
        todayRevenue,
        totalRevenue
      ] = await Promise.all([
        PharmacySale.countDocuments(),
        PharmacySale.countDocuments({ 
          saleDate: { $gte: startOfDay, $lte: endOfDay } 
        }),
        PharmacySale.aggregate([
          { $match: { saleDate: { $gte: startOfDay, $lte: endOfDay } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        PharmacySale.aggregate([
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ]);

      res.json({
        totalSales,
        todaySales,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalRevenue: totalRevenue[0]?.total || 0
      });
    } catch (error) {
      console.error('Get sales stats error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = pharmacyController;