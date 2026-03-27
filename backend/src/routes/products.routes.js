const router = require('express').Router();
const { getAllProducts, createProduct, updateProduct } = require('../controllers/products.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/',     getAllProducts);
router.post('/',    auth, requireRole('vendor'), createProduct);
router.put('/:id',  auth, requireRole('vendor'), updateProduct);

module.exports = router;
