const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse'); // ← كده بس، من غير تعقيدات

// @desc    رفع مستند جديد
// @route   POST /api/documents
const uploadDocument = async (req, res) => {
  try {
    const { title, fileType, pages } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'من فضلك اختر ملف للرفع' });
    }

    console.log('📄 File:', req.file.originalname);

    // استخراج النص من الملف
    let extractedContent = '';
    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      
      if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfData = await pdfParse(fileBuffer);
          extractedContent = pdfData.text;
          console.log('✅ PDF extracted:', extractedContent.length, 'characters');
        } catch (pdfError) {
          console.error('❌ PDF parse error:', pdfError.message);
          extractedContent = '';
        }
      } else if (req.file.originalname.toLowerCase().endsWith('.txt')) {
        extractedContent = fileBuffer.toString('utf-8');
        console.log('✅ TXT extracted:', extractedContent.length, 'characters');
      }
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
      message: 'خطأ في رفع الملف: ' + error.message 
    });
  }
};


// باقي الدوال (getDocuments, getDocumentById, deleteDocument) ...

// @desc    جلب كل المستندات بتاعة المستخدم
// @route   GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب مستند معين
// @route   GET /api/documents/:id
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
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }

    // حذف الملف من السيرفر
    if (document.fileUrl) {
      const filePath = path.join(__dirname, '..', document.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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