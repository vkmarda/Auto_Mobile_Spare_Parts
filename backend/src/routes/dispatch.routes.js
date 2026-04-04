const router = require('express').Router();
const { createDispatch, getDispatches, markDispatchDelivered, getDispatchSheet } = require('../controllers/dispatch.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/',               auth, requireRole('vendor'), createDispatch);
router.get('/',                auth, requireRole('vendor'), getDispatches);
router.get('/:id/sheet',       auth, requireRole('vendor'), getDispatchSheet);
router.post('/:id/delivered',  auth, requireRole('vendor'), markDispatchDelivered);

module.exports = router;
