// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ 1. Protect Middleware - Cookies فقط
const protect = async (req, res, next) => {
    try {
        let token = null;

        // ✅ 1.1 جلب التوكن من Cookies فقط (تم إلغاء الـ Header)
        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        // ✅ 1.2 التحقق من وجود التوكن (Unauthorized)
        if (!token) {
            const error = new Error('غير مصرح، لا يوجد توكن');
            error.status = 401;
            throw error;
        }

        // ✅ 1.3 التحقق من صحة التوكن (Invalid / Expired)
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                const error = new Error('التوكن منتهي الصلاحية');
                error.status = 401;
                error.name = 'TokenExpiredError';
                throw error;
            }
            const error = new Error('التوكن غير صالح');
            error.status = 401;
            error.name = 'JsonWebTokenError';
            throw error;
        }

        // ✅ 1.4 البحث عن المستخدم
        const user = await User.findById(decoded.userId || decoded.id);
        
        if (!user) {
            const error = new Error('المستخدم غير موجود');
            error.status = 404;
            throw error;
        }

        // ✅ إضافة المستخدم للـ req
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        next();

    } catch (error) {
        next(error);
    }
};

// ✅ 2. Authorize Middleware مع Error Handling
const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            // ✅ 2.1 التحقق من وجود المستخدم
            if (!req.user) {
                const error = new Error('غير مصرح');
                error.status = 401;
                throw error;
            }

            // ✅ 2.2 التحقق من الصلاحية (Forbidden)
            if (!roles.includes(req.user.role)) {
                const error = new Error(
                    `غير مسموح، صلاحيات غير كافية. الصلاحيات المطلوبة: ${roles.join(', ')}`
                );
                error.status = 403;
                throw error;
            }

            next();

        } catch (error) {
            next(error);
        }
    };
};

module.exports = { protect, authorize };