const router = require('express').Router();
const { getDemand, getStats, bulkAcceptOrders, getSalesChart, getProductStats, getLastDispatchesByCity } = require('../controllers/vendor.controller');
const { getRetailers, getRetailerById } = require('../controllers/vendor.retailers.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/demand',        auth, requireRole('vendor'), getDemand);
router.get('/stats',         auth, requireRole('vendor'), getStats);
router.post('/bulk-accept',  auth, requireRole('vendor'), bulkAcceptOrders);
router.get('/chart',         auth, requireRole('vendor'), getSalesChart);
router.get('/product-stats', auth, requireRole('vendor'), getProductStats);
router.get('/last-dispatches', auth, requireRole('vendor'), getLastDispatchesByCity);
router.get('/retailers',     auth, requireRole('vendor'), getRetailers);
router.get('/retailers/:id', auth, requireRole('vendor'), getRetailerById);

module.exports = router;
