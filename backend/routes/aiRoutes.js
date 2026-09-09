const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateFlashcards,
  generateQuiz,
  chatWithAI,
  generateSummary,
  explainConcept,
} = require('../controllers/aiController');

// Routes
router.post('/generate-flashcards', protect, generateFlashcards);
router.post('/generate-quiz', protect, generateQuiz);
router.post('/chat', protect, chatWithAI);
router.post('/summary', protect, generateSummary);
router.post('/explain', protect, explainConcept);

module.exports = router;