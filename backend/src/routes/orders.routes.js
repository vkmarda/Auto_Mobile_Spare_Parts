const router = require('express').Router();
const { placeOrder, placePhotoOrder, getOrders, getOrderById, acceptOrder, rejectOrder, dispatchOrder, confirmOrder, cancelOrder, partialAcceptOrder, confirmPartialOrder } = require('../controllers/orders.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/',       auth, requireRole('retailer'), placeOrder);
router.post('/photo',  auth, requireRole('retailer'), placePhotoOrder);
router.get('/',     auth, requireRole('retailer', 'vendor', 'admin'), getOrders);
router.get('/:id',  auth, requireRole('retailer', 'vendor', 'admin'), getOrderById);
router.post('/:id/accept',   auth, requireRole('vendor'), acceptOrder);
router.post('/:id/reject',   auth, requireRole('vendor'), rejectOrder);
router.post('/:id/dispatch',   auth, requireRole('vendor'),   dispatchOrder);
router.post('/:id/confirm',    auth, requireRole('retailer'), confirmOrder);
router.post('/:id/cancel',         auth, requireRole('retailer'),           cancelOrder);
router.post('/:id/partial-accept', auth, requireRole('vendor'),            partialAcceptOrder);
router.post('/:id/confirm-partial',auth, requireRole('retailer'),           confirmPartialOrder);

module.exports = router;
