const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'عنوان الاختبار مطلوب'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function(v) {
              return v.length >= 2;
            },
            message: 'يجب أن يكون هناك خياران على الأقل',
          },
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        explanation: {
          type: String,
          default: '',
        },
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    timeLimit: {
      type: Number,
      default: 0, // 0 = غير محدود
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// إضافة فهرس عشان البحث أسرع
quizSchema.index({ user: 1, document: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;