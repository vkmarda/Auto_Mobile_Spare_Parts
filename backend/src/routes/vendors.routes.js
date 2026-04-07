const router = require('express').Router();
const { getVendors } = require('../controllers/vendors.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', auth, requireRole('retailer'), getVendors);

module.exports = router;
