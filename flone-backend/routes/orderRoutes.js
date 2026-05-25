const router = require('express').Router();
const { placeOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/',            protect, validate(['billing']), placeOrder);
router.get('/',             protect, getOrders);
router.get('/:id',          protect, getOrderById);
router.put('/:id/status',   protect, adminOnly, validate(['status']), updateOrderStatus);

module.exports = router;
