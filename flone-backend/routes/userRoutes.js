const router = require('express').Router();
const { register, login, getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', validate(['username', 'email', 'password']), register);
router.post('/login',    validate(['username', 'password']), login);
router.get('/profile',   protect, getProfile);
router.put('/profile',   protect, updateProfile);

module.exports = router;
