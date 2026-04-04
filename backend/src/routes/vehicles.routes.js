const router = require('express').Router();
const { getVehicleTypes, getBrands, getModels, getCategories } = require('../controllers/vehicles.controller');

router.get('/vehicle-types', getVehicleTypes);
router.get('/brands',        getBrands);
router.get('/models',        getModels);  // GET /models?vehicle_brand=Honda
router.get('/categories',    getCategories);

module.exports = router;
