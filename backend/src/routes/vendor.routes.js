const router = require('express').Router();
const { getDemand, getStats, bulkAcceptOrders } = require('../controllers/vendor.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/demand',       auth, requireRole('vendor'), getDemand);
router.get('/stats',        auth, requireRole('vendor'), getStats);
router.post('/bulk-accept', auth, requireRole('vendor'), bulkAcceptOrders);

module.exports = router;
