// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الاسم مطلوب'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'كلمة المرور مطلوبة'],
      minlength: [6, 'كلمة المرور 6 أحرف على الأقل'],
    },
    role: {  // ✅ إضافة الـ role
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    profilePicture: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ✅ تشفير كلمة المرور
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

// [المستخدم]
//    ↓
// 1. يسجل الدخول (Login)
//    ↓
// [السيرفر]
//    ↓
// 2. يصدر Access Token + Refresh Token
//    ↓
// [المستخدم]
//    ↓
// 3. يطلب حاجة (GET /api/users)
//    ↓
// [السيرفر]
//    ↓
// 4. يتحقق من Access Token → ✅ صحيح
//    ↓
// 5. يرد بالبيانات
//    ↓
// [بعد 15 دقيقة]
//    ↓
// [المستخدم]
//    ↓
// 6. يطلب حاجة تاني (GET /api/users)
//    ↓
// [السيرفر]
//    ↓
// 7. يتحقق من Access Token → ❌ منتهي
//    ↓
// 8. يرد بـ 401 Unauthorized
//    ↓
// [المستخدم (الـ Frontend)]
//    ↓
// 9. يطلب Refresh Token (POST /api/auth/refresh-token) ⬅️ الـ Frontend بيطلب
//    ↓
// [السيرفر] ⬅️ السيرفر هو اللي بيعالج الطلب
//    ↓
// 10. يتحقق من Refresh Token → ✅ صحيح
//    ↓
// 11. يصدر Access Token جديد ⬅️ السيرفر هو اللي بيصدر
//    ↓
// 12. يرد بالنجاح + Access Token الجديد
//    ↓
// [المستخدم (الـ Frontend)]
//    ↓
// 13. يعيد الطلب الأصلي بالـ Access Token الجديد
//    ↓
// [السيرفر]
//    ↓
// 14. يتحقق من Access Token الجديد → ✅ صحيح
//    ↓
// 15. يرد بالبيانات