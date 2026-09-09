// middleware/errorMiddleware.js

// ✅ 1. معالجة خطأ 404 - Route Not Found
const notFound = (req, res, next) => {
    const error = new Error(`المسار غير موجود: ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

// ✅ 2. معالجة أخطاء MongoDB
const handleDuplicateKeyError = (err) => {
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return {
            status: 400,
            message: `${field} مستخدم بالفعل`,
            error: 'Duplicate Field'
        };
    }
    return null;
};

const handleValidationError = (err) => {
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return {
            status: 400,
            message: 'بيانات غير صحيحة',
            errors: errors
        };
    }
    return null;
};

const handleCastError = (err) => {
    if (err.name === 'CastError') {
        return {
            status: 400,
            message: `ID غير صحيح: ${err.value}`,
            error: 'Invalid ObjectId'
        };
    }
    return null;
};

// ✅ 3. معالجة أخطاء JWT
const handleJWTError = (err) => {
    if (err.name === 'JsonWebTokenError') {
        return {
            status: 401,
            message: 'التوكن غير صالح',
            error: 'Invalid Token'
        };
    }
    return null;
};

const handleJWTExpiredError = (err) => {
    if (err.name === 'TokenExpiredError') {
        return {
            status: 401,
            message: 'التوكن منتهي الصلاحية، يرجى تحديثه',
            error: 'Token Expired'
        };
    }
    return null;
};

// ✅ 4. Error Handler الرئيسي
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    let errorResponse = {
        success: false,
        message: err.message || 'حدث خطأ في السيرفر',
        status: err.status || 500
    };

    // معالجة أنواع مختلفة من الأخطاء
    const duplicateError = handleDuplicateKeyError(err);
    if (duplicateError) {
        errorResponse.message = duplicateError.message;
        errorResponse.status = duplicateError.status;
        errorResponse.error = duplicateError.error;
    }

    const validationError = handleValidationError(err);
    if (validationError) {
        errorResponse.message = validationError.message;
        errorResponse.status = validationError.status;
        errorResponse.errors = validationError.errors;
    }

    const castError = handleCastError(err);
    if (castError) {
        errorResponse.message = castError.message;
        errorResponse.status = castError.status;
        errorResponse.error = castError.error;
    }

    const jwtError = handleJWTError(err);
    if (jwtError) {
        errorResponse.message = jwtError.message;
        errorResponse.status = jwtError.status;
        errorResponse.error = jwtError.error;
    }

    const jwtExpiredError = handleJWTExpiredError(err);
    if (jwtExpiredError) {
        errorResponse.message = jwtExpiredError.message;
        errorResponse.status = jwtExpiredError.status;
        errorResponse.error = jwtExpiredError.error;
    }

    // ✅ إرسال الرد النهائي
    res.status(errorResponse.status).json({
        success: false,
        message: errorResponse.message,
        ...(errorResponse.errors && { errors: errorResponse.errors }),
        ...(errorResponse.error && { error: errorResponse.error }),
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
};

module.exports = {
    notFound,
    errorHandler,
    handleDuplicateKeyError,
    handleValidationError,
    handleCastError,
    handleJWTError,
    handleJWTExpiredError
};