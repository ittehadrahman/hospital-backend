const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const PharmacySale = require('../models/PharmacySale');
const User = require('../models/User');

const dashboardController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [
        totalPrescriptions,
        todayPrescriptions,
        totalMedicines,
        lowStockMedicines,
        expiredMedicines,
        todaySales,
        totalSalesAmount,
        totalUsers,
        activeUsers
      ] = await Promise.all([
        Prescription.countDocuments(),
        Prescription.countDocuments({ 
          prescriptionDate: { $gte: startOfDay, $lte: endOfDay } 
        }),
        Medicine.countDocuments({ isActive: true }),
        Medicine.countDocuments({ 
          isActive: true,
          $expr: { $lte: ['$stock', '$minStockLevel'] }
        }),
        Medicine.countDocuments({ 
          isActive: true,
          expiryDate: { $lte: new Date() }
        }),
        PharmacySale.countDocuments({ 
          saleDate: { $gte: startOfDay, $lte: endOfDay } 
        }),
        PharmacySale.aggregate([
          { $match: { saleDate: { $gte: startOfDay, $lte: endOfDay } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        User.countDocuments(),
        User.countDocuments({ isActive: true })
      ]);

      res.json({
        prescriptions: {
          total: totalPrescriptions,
          today: todayPrescriptions
        },
        medicines: {
          total: totalMedicines,
          lowStock: lowStockMedicines,
          expired: expiredMedicines
        },
        sales: {
          todayCount: todaySales,
          todayAmount: totalSalesAmount[0]?.total || 0
        },
        users: {
          total: totalUsers,
          active: activeUsers
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get recent activity
  getRecentActivity: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const [
        recentPrescriptions,
        recentSales,
        recentUsers
      ] = await Promise.all([
        Prescription.find()
          .populate('createdBy', 'username')
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('patientName doctorName status createdAt'),
        PharmacySale.find()
          .populate('soldBy', 'username')
          .sort({ saleDate: -1 })
          .limit(limit)
          .select('saleNumber customerName totalAmount saleDate'),
        User.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('username role createdAt')
      ]);

      res.json({
        recentPrescriptions,
        recentSales,
        recentUsers
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = dashboardController;