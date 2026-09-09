const QuizResult = require('../models/QuizResult');
const Quiz = require('../models/Quiz');

// @desc    حفظ نتيجة اختبار
// @route   POST /api/quiz-results
const saveQuizResult = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    // حساب النتيجة
    let correctCount = 0;
    const correctAnswers = [];

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
        correctAnswers.push(question.correctAnswer);
      } else {
        correctAnswers.push(null);
      }
    });

    const totalQuestions = quiz.questions.length;
    const score = correctCount;
    const percentage = (correctCount / totalQuestions) * 100;
    const passed = percentage >= 50;

    const quizResult = await QuizResult.create({
      user: req.user._id,
      quiz: quizId,
      document: quiz.document,
      score,
      totalQuestions,
      percentage,
      answers,
      correctAnswers,
      timeTaken: timeTaken || 0,
      passed,
    });

    res.status(201).json({
      success: true,
      data: {
        result: quizResult,
        stats: {
          score,
          totalQuestions,
          percentage,
          passed,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب كل نتائج المستخدم
// @route   GET /api/quiz-results
const getQuizResults = async (req, res) => {
  try {
    const results = await QuizResult.find({ user: req.user._id })
      .populate('quiz', 'title')
      .populate('document', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب نتيجة اختبار معين
// @route   GET /api/quiz-results/quiz/:quizId
const getQuizResultByQuiz = async (req, res) => {
  try {
    const result = await QuizResult.findOne({
      user: req.user._id,
      quiz: req.params.quizId,
    })
      .populate('quiz', 'title')
      .populate('document', 'title');

    if (!result) {
      return res.status(404).json({ message: 'لم تجب على هذا الاختبار بعد' });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب كل نتائج مستند معين
// @route   GET /api/quiz-results/document/:documentId
const getQuizResultsByDocument = async (req, res) => {
  try {
    const results = await QuizResult.find({
      user: req.user._id,
      document: req.params.documentId,
    })
      .populate('quiz', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف نتيجة
// @route   DELETE /api/quiz-results/:id
const deleteQuizResult = async (req, res) => {
  try {
    const result = await QuizResult.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: 'النتيجة غير موجودة' });
    }

    await result.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف النتيجة بنجاح',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب إحصائيات المستخدم
// @route   GET /api/quiz-results/stats
const getQuizStats = async (req, res) => {
  try {
    const results = await QuizResult.find({ user: req.user._id });

    const totalQuizzes = results.length;
    const totalCorrect = results.reduce((acc, r) => acc + r.score, 0);
    const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
    const averagePercentage = totalQuestions > 0 
      ? (totalCorrect / totalQuestions) * 100 
      : 0;
    const passedCount = results.filter(r => r.passed).length;

    res.json({
      success: true,
      data: {
        totalQuizzes,
        totalCorrect,
        totalQuestions,
        averagePercentage: Math.round(averagePercentage),
        passedCount,
        failedCount: totalQuizzes - passedCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  saveQuizResult,
  getQuizResults,
  getQuizResultByQuiz,
  getQuizResultsByDocument,
  deleteQuizResult,
  getQuizStats,
};

// 📝 Quiz (موديل الاختبار)
//     │
//     ├── question: "ما هو React؟"
//     ├── options: ["مكتبة", "إطار", "لغة"]
//     └── correctAnswer: "مكتبة"   ← الإجابة الصحيحة مخزنة هنا
//          │
//          │ (المستخدم بيحل)
//          ▼
// 📊 QuizResult (موديل النتيجة)
//     │
//     ├── user: "أحمد"
//     ├── quiz: "quiz_123"
//     ├── answers: ["مكتبة", "بيانات متغيرة"]  ← إجابات المستخدم هنا
//     └── score: 2