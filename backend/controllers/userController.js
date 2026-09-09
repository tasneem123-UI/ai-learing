const User = require('../models/User');
const mongoose = require('mongoose');

// ✅ 1. Get All Users - جلب كل المستخدمين
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب المستخدمين',
            error: error.message
        });
    }
};

// ✅ 2. Get User By ID - جلب مستخدم معين
const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // 🔹 التحقق من صحة الـ ObjectId (Invalid MongoDB ObjectId)
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: `ID غير صحيح: ${userId}`,
                error: 'Invalid ObjectId'
            });
        }

        const user = await User.findById(userId).select('-password');
        
        // 🔹 التحقق من وجود المستخدم (User Not Found)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `المستخدم غير موجود: ${userId}`,
                error: 'User Not Found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب المستخدم',
            error: error.message
        });
    }
};

// ✅ 3. Create User - إنشاء مستخدم (Admin Only)
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // 🔹 التحقق من الحقول المطلوبة (Missing Required Fields)
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة (الاسم، البريد الإلكتروني، كلمة المرور)',
                errors: ['name', 'email', 'password']
            });
        }

        // 🔹 التحقق من صحة الإيميل (Invalid Email)
        const validator = require('validator');
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني غير صحيح',
                error: 'Invalid Email'
            });
        }

        // 🔹 التحقق من قوة كلمة المرور (Weak Password)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
                error: 'Weak Password'
            });
        }

        // 🔹 التحقق من وجود المستخدم (Duplicate Email)
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل',
                error: 'Duplicate Email'
            });
        }

        // إنشاء المستخدم
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user'
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المستخدم بنجاح',
            data: user
        });
    } catch (error) {
        // 🔹 معالجة أي خطأ غير متوقع
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل',
                error: 'Duplicate Email'
            });
        }
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء المستخدم',
            error: error.message
        });
    }
};

// ✅ 4. Update User - تحديث مستخدم (Admin Only)
const updateUser = async (req, res, next) => {
    try {
        const { name, email, role } = req.body;
        const userId = req.params.id;

        // 🔹 التحقق من صحة الـ ObjectId (Invalid MongoDB ObjectId)
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: `ID غير صحيح: ${userId}`,
                error: 'Invalid ObjectId'
            });
        }

        // 🔹 البحث عن المستخدم
        const user = await User.findById(userId);
        
        // 🔹 التحقق من وجود المستخدم (User Not Found)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `المستخدم غير موجود: ${userId}`,
                error: 'User Not Found'
            });
        }

        // 🔹 التحقق من صحة الإيميل الجديد (Invalid Email)
        if (email) {
            const validator = require('validator');
            if (!validator.isEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'البريد الإلكتروني غير صحيح',
                    error: 'Invalid Email'
                });
            }
        }

        // تحديث الحقول
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            data: user
        });
    } catch (error) {
        // 🔹 معالجة خطأ الإيميل المكرر (Duplicate Email)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل',
                error: 'Duplicate Email'
            });
        }
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحديث المستخدم',
            error: error.message
        });
    }
};

// ✅ 5. Delete User - حذف مستخدم (Admin Only)
const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // 🔹 التحقق من صحة الـ ObjectId (Invalid MongoDB ObjectId)
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: `ID غير صحيح: ${userId}`,
                error: 'Invalid ObjectId'
            });
        }

        // 🔹 البحث عن المستخدم
        const user = await User.findById(userId);
        
        // 🔹 التحقق من وجود المستخدم (User Not Found)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `المستخدم غير موجود: ${userId}`,
                error: 'User Not Found'
            });
        }

        // 🔹 حذف المستخدم
        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'تم حذف المستخدم بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف المستخدم',
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};