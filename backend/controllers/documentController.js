const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// ✅ نفس مسار multer.js
const uploadDir = path.join(os.tmpdir(), 'uploads');

// @desc    رفع مستند جديد
// @route   POST /api/documents
const uploadDocument = async (req, res) => {
  try {
    const { title, fileType, pages } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'من فضلك اختر ملف للرفع' });
    }

    console.log('📄 File:', req.file.originalname);
    console.log('📁 File path:', req.file.path);

    // استخراج النص من الملف
    let extractedContent = '';
    const filePath = req.file.path;  // ✅ استخدمي المسار اللي Multer حفظ فيه

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);

      const fileName = req.file.originalname.toLowerCase();

      // PDF
      if (fileName.endsWith('.pdf')) {
        try {
          const pdfData = await pdfParse(fileBuffer);
          extractedContent = pdfData.text || '';
          console.log('✅ PDF extracted:', extractedContent.length, 'characters');
        } catch (pdfError) {
          console.error('❌ PDF parse error:', pdfError.message);
        }
      }
      // DOCX
      else if (fileName.endsWith('.docx')) {
        try {
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedContent = result.value || '';
          console.log('✅ DOCX extracted:', extractedContent.length, 'characters');
        } catch (docxError) {
          console.error('❌ DOCX parse error:', docxError.message);
        }
      }
      // TXT
      else if (fileName.endsWith('.txt')) {
        extractedContent = fileBuffer.toString('utf-8');
        console.log('✅ TXT extracted:', extractedContent.length, 'characters');
      }
    } else {
      console.log('❌ File not found at:', filePath);
    }

    // إنشاء مستند جديد
    const document = await Document.create({
      user: req.user._id,
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: fileType || 'other',
      content: extractedContent || '',
      pages: pages || 0,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('❌ Error in uploadDocument:', error);
    res.status(500).json({
      message: 'خطأ في رفع الملف: ' + error.message,
    });
  }
};

// @desc    جلب كل المستندات
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب مستند معين
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف مستند
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }

    // حذف الملف من /tmp
    const fileName = document.fileUrl.replace('/uploads/', '');
    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.deleteOne();
    res.json({ message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
};