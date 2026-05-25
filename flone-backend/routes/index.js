const router = require('express').Router();

router.use('/users',      require('./userRoutes'));
router.use('/products',   require('./productRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/cart',       require('./cartRoutes'));
router.use('/orders',     require('./orderRoutes'));
router.use('/wishlist',   require('./wishlistRoutes'));

module.exports = router;
