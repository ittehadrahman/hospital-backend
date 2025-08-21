const Services = require('../models/Services'); // Adjust path as needed

// Services Controller
const servicesController = {

  // Create a new service
  createService: async (req, res) => {
    try {
      const serviceData = req.body;
      
      // Check if service name already exists
      const existingService = await Services.findOne({ 
        serviceName: { $regex: `^${serviceData.serviceName}$`, $options: 'i' }
      });
      
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this name already exists'
        });
      }

      const newService = new Services(serviceData);
      const savedService = await newService.save();

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: savedService
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating service',
        error: error.message
      });
    }
  },

  // Get all services
  getAllServices: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Sort option: name, price, newest, oldest
      const sortBy = req.query.sortBy || 'serviceName';
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      
      let sortOptions = {};
      
      if (sortBy === 'name') {
        sortOptions = { serviceName: sortOrder };
      } else if (sortBy === 'price') {
        sortOptions = { price: sortOrder };
      } else if (sortBy === 'newest') {
        sortOptions = { createdAt: -1 };
      } else if (sortBy === 'oldest') {
        sortOptions = { createdAt: 1 };
      } else {
        sortOptions = { serviceName: 1 }; // Default sort by name
      }

      const services = await Services.find()
        .skip(skip)
        .limit(limit)
        .sort(sortOptions);

      const total = await Services.countDocuments();

      res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: services,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalServices: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving services',
        error: error.message
      });
    }
  },

  // Get service by name (supports partial matching)
  getServiceByName: async (req, res) => {
    try {
      const { name } = req.params;
      
      // Use regex for case-insensitive partial matching
      const services = await Services.find({
        serviceName: { $regex: name, $options: 'i' }
      });

      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No services found with this name'
        });
      }

      res.status(200).json({
        success: true,
        message: `Found ${services.length} service(s)`,
        data: services
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching for service',
        error: error.message
      });
    }
  },

  // Update service by ID
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating service name, check for duplicates
      if (updateData.serviceName) {
        const existingService = await Services.findOne({ 
          serviceName: { $regex: `^${updateData.serviceName}$`, $options: 'i' },
          _id: { $ne: id } // Exclude current service
        });
        
        if (existingService) {
          return res.status(400).json({
            success: false,
            message: 'Another service with this name already exists'
          });
        }
      }

      const updatedService = await Services.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validators
        }
      );

      if (!updatedService) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: updatedService
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating service',
        error: error.message
      });
    }
  },

  // Delete service by ID
  deleteService: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedService = await Services.findByIdAndDelete(id);

      if (!deletedService) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
        data: deletedService
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting service',
        error: error.message
      });
    }
  },

};

module.exports = servicesController;

