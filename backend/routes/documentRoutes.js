const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} = require('../controllers/documentController');

// مهم: upload.single('file') قبل الـ Controller
router.route('/')
  .post(protect, upload.single('file'), uploadDocument)
  .get(protect, getDocuments);

router.route('/:id')
  .get(protect, getDocumentById)
  .delete(protect, deleteDocument);

module.exports = router;