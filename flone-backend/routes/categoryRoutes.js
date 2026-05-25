const router = require('express').Router();
const {
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/',    getCategories);
router.get('/:id', getCategoryById);
router.post('/',   protect, adminOnly, validate(['name', 'displayName']), createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
