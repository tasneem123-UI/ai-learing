const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createChat,
  addMessage,
  getChats,
  getChatById,
  getChatsByDocument,
  updateChatTitle,
  deleteChat,
  deleteChatsByDocument,
  deleteAllChats,
} = require('../controllers/chatHistoryController');

// كل Routes محتاجة توكن
router.route('/')
  .post(protect, createChat)
  .get(protect, getChats)
  .delete(protect, deleteAllChats);

router.get('/document/:documentId', protect, getChatsByDocument);
router.get('/:id', protect, getChatById);
router.post('/:id/messages', protect, addMessage);
router.put('/:id/title', protect, updateChatTitle);
router.delete('/:id', protect, deleteChat);
router.delete('/document/:documentId', protect, deleteChatsByDocument);

module.exports = router;