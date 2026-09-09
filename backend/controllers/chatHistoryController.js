const ChatHistory = require('../models/ChatHistory');

// @desc    إنشاء محادثة جديدة
// @route   POST /api/chat-history
const createChat = async (req, res) => {
  try {
    const { documentId, title } = req.body;

    const chat = await ChatHistory.create({
      user: req.user._id,
      document: documentId || null,
      title: title || 'محادثة جديدة',
      messages: [],
    });

    res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    إضافة رسالة للمحادثة
// @route   POST /api/chat-history/:id/messages
const addMessage = async (req, res) => {
  try {
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ message: 'الدور والمحتوى مطلوبين' });
    }

    const chat = await ChatHistory.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'المحادثة غير موجودة' });
    }

    chat.messages.push({ role, content });
    chat.isActive = true;

    // لو أول رسالة، نغير العنوان
    if (chat.messages.length === 1 && role === 'user') {
      chat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    await chat.save();

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب كل محادثات المستخدم
// @route   GET /api/chat-history
const getChats = async (req, res) => {
  try {
    const chats = await ChatHistory.find({ user: req.user._id })
      .populate('document', 'title')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب محادثة معينة
// @route   GET /api/chat-history/:id
const getChatById = async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('document', 'title');

    if (!chat) {
      return res.status(404).json({ message: 'المحادثة غير موجودة' });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    جلب محادثات مستند معين
// @route   GET /api/chat-history/document/:documentId
const getChatsByDocument = async (req, res) => {
  try {
    const chats = await ChatHistory.find({
      user: req.user._id,
      document: req.params.documentId,
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    تحديث عنوان المحادثة
// @route   PUT /api/chat-history/:id/title
const updateChatTitle = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'العنوان مطلوب' });
    }

    const chat = await ChatHistory.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'المحادثة غير موجودة' });
    }

    chat.title = title;
    await chat.save();

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف محادثة
// @route   DELETE /api/chat-history/:id
const deleteChat = async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'المحادثة غير موجودة' });
    }

    await chat.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف المحادثة بنجاح',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف كل محادثات مستند
// @route   DELETE /api/chat-history/document/:documentId
const deleteChatsByDocument = async (req, res) => {
  try {
    const result = await ChatHistory.deleteMany({
      user: req.user._id,
      document: req.params.documentId,
    });

    res.json({
      success: true,
      message: `تم حذف ${result.deletedCount} محادثة`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    حذف كل محادثات المستخدم
// @route   DELETE /api/chat-history
const deleteAllChats = async (req, res) => {
  try {
    const result = await ChatHistory.deleteMany({
      user: req.user._id,
    });

    res.json({
      success: true,
      message: `تم حذف ${result.deletedCount} محادثة`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createChat,
  addMessage,
  getChats,
  getChatById,
  getChatsByDocument,
  updateChatTitle,
  deleteChat,
  deleteChatsByDocument,
  deleteAllChats,
};