const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createQuiz,
  getQuizzes,
  getQuizzesByDocument,
  getQuizById,
  updateQuiz,
  incrementAttempts,
  deleteQuiz,
  deleteQuizzesByDocument,
} = require('../controllers/quizController');

// كل Routes محتاجة توكن
router.route('/')
  .post(protect, createQuiz)
  .get(protect, getQuizzes);

router.get('/document/:documentId', protect, getQuizzesByDocument);
router.get('/:id', protect, getQuizById);
router.put('/:id', protect, updateQuiz);
router.put('/:id/attempt', protect, incrementAttempts);
router.delete('/:id', protect, deleteQuiz);
router.delete('/document/:documentId', protect, deleteQuizzesByDocument);

module.exports = router;