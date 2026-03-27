const router = require('express').Router();
const { getDemand, getStats, bulkAcceptOrders, getSalesChart, getProductStats } = require('../controllers/vendor.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/demand',       auth, requireRole('vendor'), getDemand);
router.get('/stats',        auth, requireRole('vendor'), getStats);
router.post('/bulk-accept', auth, requireRole('vendor'), bulkAcceptOrders);
router.get('/chart',         auth, requireRole('vendor'), getSalesChart);
router.get('/product-stats', auth, requireRole('vendor'), getProductStats);

module.exports = router;
