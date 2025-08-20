const express = require('express');
const servicesController = require('../controllers/serviceController.js');

const router = express.Router();

router.post('/create', servicesController.createService);
router.get('/', servicesController.getAllServices);
router.put('/:id', servicesController.updateService);
router.delete('/:id', servicesController.deleteService);
router.get('/name/:name', servicesController.getServiceByName);

module.exports = router;

