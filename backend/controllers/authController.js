const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// ✅ توليد Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
};

// ✅ توليد Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

// ✅ 1. Register - تسجيل مستخدم جديد
const register = async (req, res, next) => {
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

        // 🔹 التحقق من عدم وجود الإيميل (Duplicate Email)
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
            message: 'تم التسجيل بنجاح',
            data: user
        });
    } catch (error) {
        // 🔹 معالجة أي خطأ غير متوقع
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر',
            error: error.message
        });
    }
};

// ✅ 2. Login - تسجيل الدخول
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 🔹 التحقق من الحقول المطلوبة (Missing Required Fields)
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني وكلمة المرور مطلوبان',
                errors: ['email', 'password']
            });
        }

        // 🔹 البحث عن المستخدم مع كلمة المرور
        const user = await User.findOne({ email }).select('+password');
        
        // 🔹 التحقق من وجود المستخدم (Invalid Login Credentials)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
                error: 'Invalid Credentials'
            });
        }

        // 🔹 التحقق من كلمة المرور (Invalid Login Credentials)
        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
                error: 'Invalid Credentials'
            });
        }

        // إنشاء التوكنات
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // ✅ حفظ التوكنات في Cookies (HTTP-Only)
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 دقيقة
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
        });

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: user,
          
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر',
            error: error.message
        });
    }
};

// ✅ 3. Refresh Token - تجديد التوكن
const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        // 🔹 التحقق من وجود Refresh Token (Unauthorized)
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'لا يوجد Refresh Token',
                error: 'No Refresh Token'
            });
        }

        // 🔹 التحقق من صحة Refresh Token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            // 🔹 Invalid Refresh Token
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh Token غير صالح',
                    error: 'Invalid Refresh Token'
                });
            }
            // 🔹 Expired Refresh Token
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh Token منتهي الصلاحية',
                    error: 'Expired Refresh Token'
                });
            }
            throw error;
        }
        
        // 🔹 التحقق من وجود المستخدم (User Not Found)
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
                error: 'User Not Found'
            });
        }

        // إنشاء Access Token جديد
        const newAccessToken = generateAccessToken(user);

        // تحديث Cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'تم تجديد التوكن بنجاح',
            accessToken: newAccessToken
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر',
            error: error.message
        });
    }
};

// ✅ 4. Logout - تسجيل الخروج
const logout = async (req, res) => {
    // مسح الكوكيز
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
    });
};

// ✅ 5. Get Current User - جلب بيانات المستخدم الحالي
const getCurrentUser = async (req, res, next) => {
    try {
        // 🔹 التحقق من وجود المستخدم (من الـ Middleware)
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح',
                error: 'Unauthorized'
            });
        }

        const user = await User.findById(req.userId);
        
        // 🔹 التحقق من وجود المستخدم (User Not Found)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
                error: 'User Not Found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser
};