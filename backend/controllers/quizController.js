const Quiz = require('../models/Quiz');
const Document = require('../models/Document');

// @desc    إنشاء اختبار جديد
// @route   POST /api/quizzes
const createQuiz = async (req, res) => {
  try {
    const { documentId, title, description, questions, difficulty, timeLimit } = req.body;

    // التأكد من وجود المستند
    const document = await Document.findOne({
      _id: documentId,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }

    // التأكد من وجود أسئلة
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'يجب إضافة سؤال واحد على الأقل' });
    }

    const quiz = await Quiz.create({
      user: req.user._id,
      document: documentId,
      title: title || `اختبار: ${document.title}`,
      description: description || '',
      questions,
      difficulty: difficulty || 'medium',
      timeLimit: timeLimit || 0,
    });

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب كل الاختبارات بتاعة المستخدم
// @route   GET /api/quizzes
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id })
      .populate('document', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب اختبارات مستند معين
// @route   GET /api/quizzes/document/:documentId
const getQuizzesByDocument = async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      user: req.user._id,
      document: req.params.documentId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب اختبار معين
// @route   GET /api/quizzes/:id
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('document', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    تحديث اختبار
// @route   PUT /api/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const { title, description, questions, difficulty, timeLimit, isActive } = req.body;

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    // تحديث الحقول المرسلة
    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (difficulty) quiz.difficulty = difficulty;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (isActive !== undefined) quiz.isActive = isActive;

    await quiz.save();

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    زيادة عدد المحاولات
// @route   PUT /api/quizzes/:id/attempt
const incrementAttempts = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    quiz.attempts += 1;
    await quiz.save();

    res.json({
      success: true,
      data: { attempts: quiz.attempts },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف اختبار
// @route   DELETE /api/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    await quiz.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف الاختبار بنجاح',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف كل اختبارات مستند
// @route   DELETE /api/quizzes/document/:documentId
const deleteQuizzesByDocument = async (req, res) => {
  try {
    const result = await Quiz.deleteMany({
      user: req.user._id,
      document: req.params.documentId,
    });

    res.json({
      success: true,
      message: `تم حذف ${result.deletedCount} اختبار`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizzesByDocument,
  getQuizById,
  updateQuiz,
  incrementAttempts,
  deleteQuiz,
  deleteQuizzesByDocument,
};