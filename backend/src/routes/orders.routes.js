const router = require('express').Router();
const { placeOrder, getOrders, getOrderById, acceptOrder, rejectOrder, dispatchOrder, deliverOrder } = require('../controllers/orders.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/',    auth, requireRole('retailer'),                    placeOrder);
router.get('/',     auth, requireRole('retailer', 'vendor', 'admin'), getOrders);
router.get('/:id',  auth, requireRole('retailer', 'vendor', 'admin'), getOrderById);
router.post('/:id/accept',   auth, requireRole('vendor'), acceptOrder);
router.post('/:id/reject',   auth, requireRole('vendor'), rejectOrder);
router.post('/:id/dispatch', auth, requireRole('vendor'), dispatchOrder);
router.post('/:id/deliver',  auth, requireRole('vendor'), deliverOrder);

module.exports = router;
