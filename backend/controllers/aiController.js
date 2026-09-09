// ==========================================
// 1. استيراد الموديلات والمكتبات
// ==========================================

// موديل المستندات - للتعامل مع الملفات المرفوعة
const Document = require('../models/Document');
// موديل البطاقات التعليمية - لحفظ البطاقات
const Flashcard = require('../models/Flashcard');
// موديل الاختبارات - لحفظ الاختبارات
const Quiz = require('../models/Quiz');
// موديل سجل المحادثات - لحفظ الدردشات
const ChatHistory = require('../models/ChatHistory');
// مكتبة Google Gemini - للذكاء الاصطناعي
const model = require('../config/ai');
// مكتبة لتوليد معرفات فريدة (UUID)
const crypto = require('crypto');

// ==========================================
// 2. دالة تنظيف الرد من علامات Markdown والنصوص الزائدة
// ==========================================
// المشكلة: أحياناً الـ AI بيرد بـ JSON داخل Markdown (```json ... ```)
// أو بيكتب نص إضافي قبل أو بعد الـ JSON
// دالة تنظيف الرد من علامات Markdown والنصوص الزائدة
// ==========================================
const cleanAIResponse = (text) => {
  if (!text) return '[]';
  
  // 1️⃣ إزالة علامات Markdown (```json ... ```)
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // 2️⃣ إزالة أي نص قبل أول قوس [ أو { (عشان نبدأ من أول JSON)
  const firstBracket = cleaned.search(/[\[{]/);
  if (firstBracket > 0) {
    cleaned = cleaned.substring(firstBracket);
  }
  
  // 3️⃣ إزالة أي نص بعد آخر قوس ] أو } (عشان نخلص عند آخر JSON)
  const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (lastBracket > 0 && lastBracket < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBracket + 1);
  }
  
  // 4️⃣ إصلاح الفواصل الناقصة بين الكائنات (مثل: }{ → },{)
  cleaned = cleaned.replace(/\}\s*\{/g, '},{');
  
  // 5️⃣ إزالة الفواصل الزائدة في نهاية المصفوفات (مثل: ,] → ])
  cleaned = cleaned.replace(/,\s*\]/g, ']');
  cleaned = cleaned.replace(/,\s*\}/g, '}');
  
  // 6️⃣ إزالة الفواصل الزائدة بين العناصر (مثل: ,, → ,)
  cleaned = cleaned.replace(/,\s*,/g, ',');
  
  return cleaned;
};

// ==========================================
// 3. توليد بطاقات تعليمية (Flashcards)
// ==========================================
// الفكرة: المستخدم يبعت documentId، السيرفر يجيب المستند من قاعدة البيانات،
// يبعت النص للذكاء الاصطناعي، يستخرج بطاقات (سؤال/إجابة)، ويحفظها في قاعدة البيانات
// ==========================================
const generateFlashcards = async (req, res) => {
  try {
    // 1️⃣ استخراج البيانات من الطلب
    const { documentId, numberOfCards = 10 } = req.body;

    // 2️⃣ التأكد من وجود معرف المستند
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    // 3️⃣ جلب المستند من قاعدة البيانات (والتأكد إنه خاص بالمستخدم)
    const document = await Document.findOne({
      _id: documentId,
      user: req.user._id,
    });

    // 4️⃣ التأكد من وجود المستند
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // 5️⃣ التأكد من وجود محتوى في المستند
    if (!document.content || document.content === '') {
      return res.status(400).json({ 
        message: 'Document has no text content. Please upload a PDF or DOCX file.' 
      });
    }

    // 6️⃣ بناء الـ Prompt (التعليمات للذكاء الاصطناعي)
    const prompt = `
You are an expert educator specializing in converting documents into educational flashcards.

Task:
Read the following document and extract ${numberOfCards} flashcards (question and answer) from it.

Document:
${document.content}

Instructions:
1. Each flashcard = one question + one answer
2. Questions should cover the most important points in the document
3. Answers should be concise and clear
4. Use English language

Required format (JSON):
[
  {"question": "The question?", "answer": "The answer."}
]

Please produce only JSON, no additional text.
`;

    console.log('📝 Generating flashcards...');

    // 7️⃣ إرسال الطلب للذكاء الاصطناعي (Gemini)
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();

    console.log('🤖 Raw AI Response:', aiResponse);

    // 8️⃣ تنظيف الرد من أي نصوص إضافية
    aiResponse = cleanAIResponse(aiResponse);

    // 9️⃣ استخراج JSON من الرد
    let flashcards = [];
    try {
      // محاولة أولى: البحث عن JSON داخل الرد
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      flashcards = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      console.log('📝 Cleaned response:', aiResponse);
      
      // محاولة ثانية: استخدام JSON.parse مباشرة
      try {
        flashcards = JSON.parse(aiResponse);
      } catch (e) {
        console.error('❌ Second parse attempt failed:', e);
        flashcards = [];
      }
    }

    // 🔟 التأكد من وجود بطاقات
    if (flashcards.length === 0) {
      return res.status(500).json({
        message: 'AI could not generate flashcards from this document. Make sure the file contains readable text.'
      });
    }

    // 1️⃣1️⃣ حفظ البطاقات في قاعدة البيانات
    const savedFlashcards = await Flashcard.insertMany(
      flashcards.map(f => ({
        user: req.user._id,        // من يملك البطاقة
        document: documentId,      // المستند المرتبط
        question: f.question,      // السؤال
        answer: f.answer,          // الإجابة
        isFavorite: false,         // غير مفضلة افتراضياً
      }))
    );

    // 1️⃣2️⃣ الرد على المستخدم
    res.json({
      success: true,
      documentId: document._id,
      documentTitle: document.title,
      count: savedFlashcards.length,
      data: savedFlashcards,
    });

  } catch (error) {
    console.error('❌ Error in generateFlashcards:', error);
    res.status(500).json({ 
      message: 'Error generating flashcards: ' + error.message 
    });
  }
};

// ==========================================
// 4. توليد اختبارات (Quiz)
// ==========================================
// الفكرة: نفس فكرة البطاقات، لكن المخرج أسئلة اختيار من متعدد (4 خيارات)
// ==========================================
const generateQuiz = async (req, res) => {
  try {
    // 1️⃣ استخراج البيانات من الطلب
    const { documentId, numberOfQuestions = 5, title, difficulty = 'medium' } = req.body;

    // 2️⃣ التأكد من وجود معرف المستند
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    // 3️⃣ جلب المستند من قاعدة البيانات
    const document = await Document.findOne({
      _id: documentId,
      user: req.user._id,
    });

    // 4️⃣ التأكد من وجود المستند والمحتوى
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.content || document.content === '') {
      return res.status(400).json({ 
        message: 'Document has no text content. Please upload a PDF or DOCX file.' 
      });
    }

    // 5️⃣ بناء الـ Prompt (تعليمات مختلفة عن البطاقات)
    const prompt = `
You are an expert educator specializing in converting documents into multiple-choice quizzes.

Task:
Read the following document and extract ${numberOfQuestions} multiple-choice questions from it.
Each question must have 4 options and one correct answer.

Document:
${document.content}

Instructions:
1. Each question = question + 4 options + correct answer + brief explanation
2. Questions should cover the most important points in the document
3. Options should be diverse (one correct, others incorrect)
4. The correct answer must be one of the options
5. Use English language

Required format (JSON):
[
  {
    "question": "The question here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "The correct option",
    "explanation": "Brief explanation of the answer"
  }
]

Please produce only JSON, no additional text.
`;

    console.log('📝 Generating quiz...');

    // 6️⃣ إرسال الطلب للذكاء الاصطناعي
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();

    console.log('🤖 Raw AI Response:', aiResponse);

    // 7️⃣ تنظيف الرد
    aiResponse = cleanAIResponse(aiResponse);

    // 8️⃣ استخراج JSON من الرد
    let questions = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      console.log('📝 Cleaned response:', aiResponse);
      
      try {
        questions = JSON.parse(aiResponse);
      } catch (e) {
        console.error('❌ Second parse attempt failed:', e);
        questions = [];
      }
    }

    // 9️⃣ التأكد من وجود أسئلة
    if (questions.length === 0) {
      return res.status(500).json({
        message: 'AI could not generate a quiz from this document. Make sure the file contains readable text.'
      });
    }

    // 🔟 حفظ الاختبار في قاعدة البيانات
    const quiz = await Quiz.create({
      user: req.user._id,
      document: documentId,
      title: title || `Quiz: ${document.title}`,
      description: `Quiz with ${questions.length} questions about ${document.title}`,
      questions: questions,
      difficulty: difficulty,
      timeLimit: 0,
      attempts: 0,
      isActive: true,
    });

    // 1️⃣1️⃣ الرد على المستخدم
    res.json({
      success: true,
      data: {
        quiz: quiz,
        stats: {
          totalQuestions: questions.length,
          difficulty: difficulty,
        }
      },
    });

  } catch (error) {
    console.error('❌ Error in generateQuiz:', error);
    res.status(500).json({ 
      message: 'Error generating quiz: ' + error.message 
    });
  }
};

// ==========================================
// 5. الدردشة مع الذكاء الاصطناعي (Chat)
// ==========================================
// الفكرة: المستخدم يسأل سؤال، والذكاء الاصطناعي يرد عليه
// لو في مستند محدد، يرد بناءً على المستند، ولو مفيش يرد من معرفته
// كل المحادثات بتتحفظ في قاعدة البيانات
// ==========================================
const chatWithAI = async (req, res) => {
  try {
    // 1️⃣ استخراج البيانات من الطلب
    const { message, documentId, sessionId } = req.body;

    // 2️⃣ التأكد من وجود رسالة
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let prompt = '';
    let chatSessionId = sessionId || crypto.randomUUID();
    let chat = null;
    let document = null;

    // 3️⃣ لو في مستند محدد، نجيبه من قاعدة البيانات
    if (documentId) {
      document = await Document.findOne({
        _id: documentId,
        user: req.user._id,
      });
    }

    // 4️⃣ بناء الـ Prompt حسب وجود مستند أو لا
    if (document && document.content) {
      // لو في مستند: نطلب من الـ AI يرد بناءً على المستند
      prompt = `
You are an intelligent AI assistant.

You have access to this document:
${document.content}

User's Question:
${message}

Instructions:
1. If the question is related to the document, answer based on the document
2. If the question is general (not in the document), answer from your knowledge
3. Be helpful, concise, and accurate
4. Use the same language as the user's question (English or Arabic)

Please provide the answer.
`;
    } else {
      // لو مفيش مستند: الـ AI يرد من معرفته العامة
      prompt = `
You are an intelligent AI assistant.

User's Question:
${message}

Instructions:
1. Answer the user's question from your knowledge
2. Be helpful, concise, and accurate
3. Use the same language as the user's question (English or Arabic)

Please provide the answer.
`;
    }

    // 5️⃣ إرسال الطلب للذكاء الاصطناعي
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // ========== حفظ المحادثة في قاعدة البيانات ==========
    
    // 6️⃣ البحث عن جلسة محادثة موجودة
    chat = await ChatHistory.findOne({
      user: req.user._id,
      sessionId: chatSessionId,
    });

    // 7️⃣ لو مفيش جلسة، ننشئ واحدة جديدة
    if (!chat) {
      chat = await ChatHistory.create({
        user: req.user._id,
        document: documentId || null,
        sessionId: chatSessionId,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [],
        isActive: true,
      });
    }

    // 8️⃣ إضافة رسالة المستخدم للمحادثة
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // 9️⃣ إضافة رد الذكاء الاصطناعي للمحادثة
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });

    // 🔟 تحديث عنوان المحادثة (لو أول رسالة)
    if (chat.messages.length <= 2) {
      chat.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }

    chat.isActive = true;
    await chat.save();

    // 1️⃣1️⃣ الرد على المستخدم
    res.json({
      success: true,
      data: {
        message: aiResponse,
        sessionId: chatSessionId,
        chatId: chat._id,
      },
    });

  } catch (error) {
    console.error('❌ Error in chatWithAI:', error);
    res.status(500).json({ 
      message: 'Error in chat: ' + error.message 
    });
  }
};

// ==========================================
// 6. جلب محادثات المستخدم (Get Chat History)
// ==========================================
// الفكرة: جلب كل المحادثات بتاعة المستخدم من قاعدة البيانات
// ==========================================
const getChatHistory = async (req, res) => {
  try {
    // جلب المحادثات وترتيبها من الأحدث
    const chats = await ChatHistory.find({ user: req.user._id })
      .populate('document', 'title')  // نجيب عنوان المستند المرتبط
      .sort({ updatedAt: -1 });       // الأحدث أولاً

    res.json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    console.error('❌ Error in getChatHistory:', error);
    res.status(500).json({ 
      message: 'Error fetching chat history: ' + error.message 
    });
  }
};

// ==========================================
// 7. جلب محادثة معينة (Get Chat by ID)
// ==========================================
// الفكرة: جلب محادثة محددة بتاعتها
// ==========================================
const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    // جلب المحادثة مع التأكد إنها للمستخدم
    const chat = await ChatHistory.findOne({
      _id: id,
      user: req.user._id,
    }).populate('document', 'title');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('❌ Error in getChatById:', error);
    res.status(500).json({ 
      message: 'Error fetching chat: ' + error.message 
    });
  }
};

// ==========================================
// 8. حذف محادثة (Delete Chat)
// ==========================================
// الفكرة: حذف محادثة محددة
// ==========================================
const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    // البحث عن المحادثة مع التأكد إنها للمستخدم
    const chat = await ChatHistory.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // حذف المحادثة
    await chat.deleteOne();

    res.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error in deleteChat:', error);
    res.status(500).json({ 
      message: 'Error deleting chat: ' + error.message 
    });
  }
};

// ==========================================
// 9. تلخيص المستندات (Summary)
// ==========================================
// الفكرة: المستخدم يطلب تلخيص مستند معين في نقاط مختصرة
// ==========================================
const generateSummary = async (req, res) => {
  try {
    const { documentId, numberOfPoints = 5 } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }

    const document = await Document.findOne({
      _id: documentId,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.content || document.content === '') {
      return res.status(400).json({ 
        message: 'Document has no text content.' 
      });
    }

    // بناء الـ Prompt للتلخيص
    const prompt = `
You are an expert summarizer.

Task:
Read the following document and summarize it in ${numberOfPoints} concise points.

Document:
${document.content}

Instructions:
1. Each point should be clear and concise
2. Cover the most important information
3. Use English language

Required format (JSON):
["Point 1", "Point 2", "Point 3", ...]

Please produce only JSON, no additional text.
`;

    // إرسال الطلب للذكاء الاصطناعي
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();

    console.log('🤖 Raw AI Response:', aiResponse);

    // تنظيف الرد واستخراج JSON
    aiResponse = cleanAIResponse(aiResponse);

    let summaryPoints = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      summaryPoints = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      console.log('📝 Cleaned response:', aiResponse);
      
      try {
        summaryPoints = JSON.parse(aiResponse);
      } catch (e) {
        console.error('❌ Second parse attempt failed:', e);
        summaryPoints = [];
      }
    }

    if (summaryPoints.length === 0) {
      return res.status(500).json({
        message: 'AI could not summarize this document.'
      });
    }

    // حفظ التلخيص في حقل summary في المستند
    document.summary = summaryPoints.join('\n');
    await document.save();

    res.json({
      success: true,
      documentId: document._id,
      documentTitle: document.title,
      count: summaryPoints.length,
      data: summaryPoints,
    });

  } catch (error) {
    console.error('❌ Error in generateSummary:', error);
    res.status(500).json({ 
      message: 'Error generating summary: ' + error.message 
    });
  }
};

// ==========================================
// 10. شرح مفهوم (Explain Concept)
// ==========================================
// الفكرة: المستخدم يطلب شرح مفهوم معين (زي React، MongoDB، إلخ)
// لو في مستند محدد، يستخدمه كمرجع
// ==========================================
const explainConcept = async (req, res) => {
  try {
    const { concept, documentId } = req.body;

    if (!concept) {
      return res.status(400).json({ message: 'Concept is required' });
    }

    let context = '';
    if (documentId) {
      const document = await Document.findOne({
        _id: documentId,
        user: req.user._id,
      });
      if (document && document.content) {
        context = `\n\nUse this document as context:\n${document.content}`;
      }
    }

    // بناء الـ Prompt للشرح
    const prompt = `
You are an expert educator.

Task:
Explain the concept "${concept}" in a simple and clear way.${context}

Instructions:
1. Use simple language that anyone can understand
2. Provide examples if possible
3. Be concise but comprehensive
4. Use English language

Please provide the explanation in clear text.
`;

    // إرسال الطلب للذكاء الاصطناعي
    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

    res.json({
      success: true,
      concept: concept,
      explanation: explanation,
    });

  } catch (error) {
    console.error('❌ Error in explainConcept:', error);
    res.status(500).json({ 
      message: 'Error explaining concept: ' + error.message 
    });
  }
};

// ==========================================
// 11. تصدير الدوال
// ==========================================
// عشان نقدر نستخدمها في ملفات تانية (زي routes)
// ==========================================
module.exports = {
  generateFlashcards,
  generateQuiz,
  chatWithAI,
  getChatHistory,
  getChatById,
  deleteChat,
  generateSummary,
  explainConcept,
};