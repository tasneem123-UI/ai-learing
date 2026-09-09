const validator = require('validator');

// ✅ التحقق من بيانات التسجيل
const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    // التحقق من الاسم
    if (!name || name.length < 3) {
        errors.push('الاسم يجب أن يكون 3 أحرف على الأقل');
    }

    // التحقق من الإيميل
    if (!email || !validator.isEmail(email)) {
        errors.push('البريد الإلكتروني غير صحيح');
    }

    // التحقق من كلمة المرور
    if (!password || password.length < 6) {
        errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    // لو في أخطاء
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    next();
};

// ✅ التحقق من بيانات تسجيل الدخول
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validator.isEmail(email)) {
        errors.push('البريد الإلكتروني غير صحيح');
    }

    if (!password || password.length < 6) {
        errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    next();
};

module.exports = { validateRegister, validateLogin };