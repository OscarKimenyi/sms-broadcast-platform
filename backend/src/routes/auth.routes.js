const router = require('express').Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { body } = require('express-validator');

router.post('/register', authLimiter, [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
], register);

router.post('/login', authLimiter, [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], login);

router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);

module.exports = router;