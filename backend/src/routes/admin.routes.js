const router = require('express').Router();
const { getPendingVendors, getAllVendors, approveVendor, getAllRetailers } = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(auth, requireRole('admin'));

router.get('/vendors/pending',    getPendingVendors);
router.get('/vendors',            getAllVendors);
router.post('/vendors/:id/approve', approveVendor);
router.get('/retailers',          getAllRetailers);

module.exports = router;
