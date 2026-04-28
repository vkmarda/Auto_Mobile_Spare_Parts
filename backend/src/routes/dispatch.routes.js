const router = require('express').Router();
const { createDispatch, getDispatches, getDispatchSheet } = require('../controllers/dispatch.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/',               auth, requireRole('vendor'), createDispatch);
router.get('/',                auth, requireRole('vendor'), getDispatches);
router.get('/:id/sheet',       auth, requireRole('vendor'), getDispatchSheet);

module.exports = router;
