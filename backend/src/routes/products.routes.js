const router = require('express').Router();
const { getAllProducts, getProductById, createProduct, updateProduct, getVendorsByProduct } = require('../controllers/products.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/',    getAllProducts);
router.get('/:id/vendors', getVendorsByProduct);
router.get('/:id',         getProductById);
router.post('/',              auth, requireRole('vendor'), createProduct);
router.put('/:id',            auth, requireRole('vendor'), updateProduct);

module.exports = router;
