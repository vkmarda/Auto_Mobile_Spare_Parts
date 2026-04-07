const router = require('express').Router();
const {getOrderDetail,getReturnDetail} = require('../controllers/detail.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');


router.get('/orders/:id/detail', auth, requireRole('vendor', ), getOrderDetail);
router.get('/returns/:id/detail', auth, requireRole('vendor', ), getReturnDetail);

module.exports = router;