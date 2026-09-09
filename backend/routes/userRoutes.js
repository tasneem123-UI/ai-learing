const express = require('express');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Task 8 - Protected Routes

// GET /users - جلب كل المستخدمين (محمي)
router.get('/', protect, authorize('admin'),getUsers);

// POST /users - إنشاء مستخدم جديد (محمي + Admin فقط)
router.post('/', protect, authorize('admin'), createUser);

// GET /users/:id - جلب مستخدم معين (محمي)
router.get('/:id', protect, getUserById);

// PUT /users/:id - تحديث مستخدم (محمي + Admin فقط)
router.put('/:id', protect, authorize('admin'), updateUser);

// DELETE /users/:id - حذف مستخدم (محمي + Admin فقط)
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;