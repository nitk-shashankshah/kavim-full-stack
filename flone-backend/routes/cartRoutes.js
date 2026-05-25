const router = require('express').Router();
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/',                         protect, getCart);
router.post('/items',                   protect, validate(['productId']), addItem);
router.put('/items/:cartItemId',        protect, updateItem);
router.delete('/items/:cartItemId',     protect, removeItem);
router.delete('/',                      protect, clearCart);

module.exports = router;
