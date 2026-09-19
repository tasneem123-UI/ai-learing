const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');

// ✅ استيراد Error Handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

// ========== Middleware ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://ai-learing.pxxlspace.cv',
  // ضيفي أي دومين هتستخدميه
];

app.use(cors({
  origin: function (origin, callback) {
    // ✅ اسمح للطلبات من غير Origin (زي Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ✅ مهم جداً للـ Cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
const os = require('os');
app.use('/uploads', express.static(path.join(os.tmpdir(), 'uploads')));

// ========== Routes ==========

// ✅ 1. Routes Authentication (Task 5)
app.use('/api/auth', require('./routes/authRoutes'));

// ✅ 2. Routes Users (Task 8 - Protected Routes)
app.use('/api/users', require('./routes/userRoutes'));

// ✅ 3. باقي Routes
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/quiz-results', require('./routes/quizResultRoutes'));
app.use('/api/chat-history', require('./routes/chatHistoryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// ========== Home Route ==========
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 API is running',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                refresh: 'POST /api/auth/refresh-token',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me'
            },
            users: {
                getAll: 'GET /api/users (Protected)',
                getById: 'GET /api/users/:id (Protected)',
                create: 'POST /api/users (Admin Only)',
                update: 'PUT /api/users/:id (Admin Only)',
                delete: 'DELETE /api/users/:id (Admin Only)'
            }
        }
    });
});

// ========== Error Handling (Task 9) ==========

// ✅ 404 Not Found - للمسارات غير الموجودة
app.use(notFound);

// ✅ Error Handler - لمعالجة جميع الأخطاء
app.use(errorHandler);

// ========== تشغيل السيرفر ==========
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});