const express = require('express');
const {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// ✅ Routes المطلوبة في Task 5
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// ✅ إضافي: جلب المستخدم الحالي
router.get('/me', protect, getCurrentUser);

module.exports = router;