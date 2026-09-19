const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ==========================================
// ✅ استخدام /tmp بدل uploads
// /tmp متاح في كل بيئات النشر (Render, Railway, Heroku)
// ==========================================
const uploadDir = path.join(os.tmpdir(), 'uploads');

// ✅ نتأكد إن المجلد موجود
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Created uploads directory:', uploadDir);
  } catch (error) {
    console.error('❌ Error creating uploads directory:', error.message);
  }
}

console.log('📁 Upload directory:', uploadDir);

// ==========================================
// إعداد التخزين
// ==========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// فلتر الملفات
const fileFilter = (req, file, cb) => {
  console.log('📄 File type received:', file.mimetype);
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;