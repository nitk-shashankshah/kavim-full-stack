const router = require('express').Router();
const { getWishlist, addItem, removeItem, clearWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/',                       protect, getWishlist);
router.post('/items',                 protect, validate(['productId']), addItem);
router.delete('/items/:productId',    protect, removeItem);
router.delete('/',                    protect, clearWishlist);

module.exports = router;
