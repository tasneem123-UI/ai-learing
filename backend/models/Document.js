const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'عنوان المستند مطلوب'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'اسم الملف مطلوب'],
    },
    fileUrl: {
      type: String,
      required: [true, 'رابط الملف مطلوب'],
    },
    fileType: {
      type: String,
      required: [true, 'نوع الملف مطلوب'],
      enum: ['pdf', 'docx', 'txt', 'other'],
      default: 'other',
    },
    content: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    pages: {
      type: Number,
      default: 0,
    },
    
summary: {
  type: String,
  default: '',
},
  },
  {
    timestamps: true,
  }
);

// ========== مهم جداً: التصدير بالشكل ده ==========
const Document = mongoose.model('Document', documentSchema);
module.exports = Document;