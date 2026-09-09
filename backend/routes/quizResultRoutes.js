const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  saveQuizResult,
  getQuizResults,
  getQuizResultByQuiz,
  getQuizResultsByDocument,
  deleteQuizResult,
  getQuizStats,
} = require('../controllers/quizResultController');

router.route('/')
  .post(protect, saveQuizResult)
  .get(protect, getQuizResults);

router.get('/stats', protect, getQuizStats);
router.get('/quiz/:quizId', protect, getQuizResultByQuiz);
router.get('/document/:documentId', protect, getQuizResultsByDocument);
router.delete('/:id', protect, deleteQuizResult);

module.exports = router;

// 1. أنت ترفع ملف (PDF)
//          ↓
// 2. الذكاء الاصطناعي يقرأ الملف
//          ↓
// 3. الذكاء الاصطناعي يولّد الاختبار (Quiz)
//    - الأسئلة ✅
//    - الخيارات ✅
//    - الإجابة الصحيحة ✅
//          ↓
// 4. الاختبار بيتخزن في قاعدة البيانات (models/Quiz.js)
//          ↓
// 5. المستخدم يفتح الاختبار ويحله
//          ↓
// 6. المستخدم يضغط "تقديم"
//          ↓
// 7. النظام (Backend) يحسب النتيجة:
//    - يقارن إجابات المستخدم مع الإجابات الصحيحة
//    - يحسب الدرجة والنسبة
//    - يحدد نجاح/رسوب
//          ↓
// 8. النظام يخزن النتيجة في (models/QuizResult.js)
//          ↓
// 9. المستخدم يشوف نتيجته