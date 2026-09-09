const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createFlashcard,
  getFlashcards,
  getFlashcardsByDocument,
  updateFlashcard,
  deleteFlashcard,
  deleteFlashcardsByDocument,
} = require('../controllers/flashcardController');

// كل Routes محتاجة توكن
router.route('/')
  .post(protect, createFlashcard)
  .get(protect, getFlashcards);

router.route('/document/:documentId')
  .get(protect, getFlashcardsByDocument)
  .delete(protect, deleteFlashcardsByDocument);

router.route('/:id')
  .put(protect, updateFlashcard)
  .delete(protect, deleteFlashcard);

module.exports = router;