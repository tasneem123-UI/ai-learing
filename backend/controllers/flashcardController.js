const Flashcard = require('../models/Flashcard');

// @desc    إنشاء بطاقة جديدة
// @route   POST /api/flashcards
const createFlashcard = async (req, res) => {
  try {
    const { documentId, question, answer } = req.body;

    // التأكد من وجود السؤال والإجابة
    if (!question || !answer) {
      return res.status(400).json({ message: 'السؤال والإجابة مطلوبين' });
    }

    const flashcard = await Flashcard.create({
      user: req.user._id,
      document: documentId,
      question,
      answer,
    });

    res.status(201).json({
      success: true,
      data: flashcard,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب كل البطاقات بتاعة المستخدم
// @route   GET /api/flashcards
const getFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ user: req.user._id })
      .populate('document', 'title') // يجيب عنوان المستند
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: flashcards.length,
      data: flashcards,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب بطاقات مستند معين
// @route   GET /api/flashcards/document/:documentId
const getFlashcardsByDocument = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({
      user: req.user._id,
      document: req.params.documentId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: flashcards.length,
      data: flashcards,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    تحديث بطاقة (مفضلة أو مراجعة)
// @route   PUT /api/flashcards/:id
const updateFlashcard = async (req, res) => {
  try {
    const { isFavorite, lastReviewed, difficulty } = req.body;

    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'البطاقة غير موجودة' });
    }

    // تحديث الحقول المرسلة
    if (isFavorite !== undefined) flashcard.isFavorite = isFavorite;
    if (lastReviewed) flashcard.lastReviewed = lastReviewed;
    if (difficulty) flashcard.difficulty = difficulty;

    await flashcard.save();

    res.json({
      success: true,
      data: flashcard,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف بطاقة
// @route   DELETE /api/flashcards/:id
const deleteFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'البطاقة غير موجودة' });
    }

    await flashcard.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف البطاقة بنجاح',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف كل بطاقات مستند
// @route   DELETE /api/flashcards/document/:documentId
const deleteFlashcardsByDocument = async (req, res) => {
  try {
    const result = await Flashcard.deleteMany({
      user: req.user._id,
      document: req.params.documentId,
    });

    res.json({
      success: true,
      message: `تم حذف ${result.deletedCount} بطاقة`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFlashcard,
  getFlashcards,
  getFlashcardsByDocument,
  updateFlashcard,
  deleteFlashcard,
  deleteFlashcardsByDocument,
};
// 1. أنت ترفع ملف "مقدمة في الذكاء الاصطناعي.pdf"
//                     ↓
// 2. الذكاء الاصطناعي يقرأ الملف
//                     ↓
// 3. يطلعلك 10 بطاقات عن الذكاء الاصطناعي
//                     ↓
// 4. كل بطاقة ليها document = "مقدمة في الذكاء الاصطناعي.pdf"
//                     ↓
// 5. لما تفتح المستند ده، تشوف بطاقاته بس
//                     ↓
// 6. لما تفتح مستند تاني، تشوف بطاقاته المختلفة