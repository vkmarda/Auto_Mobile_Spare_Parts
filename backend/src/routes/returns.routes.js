const router = require('express').Router();
const { createReturn, getReturns, acceptReturn, receiveReturn, settleReturn, cancelReturn } = require('../controllers/returns.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/',            auth, requireRole('retailer'),           createReturn);
router.get('/',             auth, requireRole('vendor', 'retailer'), getReturns);
router.post('/:id/accept',  auth, requireRole('vendor'),             acceptReturn);
router.post('/:id/receive', auth, requireRole('vendor'),             receiveReturn);
router.post('/:id/settle',  auth, requireRole('vendor'),             settleReturn);
router.post('/cancel/:order_id', auth, requireRole('retailer'),      cancelReturn);

module.exports = router;
