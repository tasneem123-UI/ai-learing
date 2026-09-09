const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Document',
    },
    question: {
      type: String,
      required: [true, 'السؤال مطلوب'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'الإجابة مطلوبة'],
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    lastReviewed: {
      type: Date,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// إضافة فهرس عشان البحث أسرع
flashcardSchema.index({ user: 1, document: 1 });

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
module.exports = Flashcard;