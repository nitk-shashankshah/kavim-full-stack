const router = require('express').Router();
const {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/',    getProducts);
router.get('/:id', getProductById);
router.post('/',   protect, adminOnly, validate(['sku', 'name', 'price']), createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
