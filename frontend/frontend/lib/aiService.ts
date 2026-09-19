import api from './api';

export const aiService = {
  // توليد بطاقات من مستند
  generateFlashcards: (documentId: string, numberOfCards = 10) =>
    api.post('/ai/generate-flashcards', { documentId, numberOfCards }),

  // توليد اختبار من مستند
  generateQuiz: (documentId: string, numberOfQuestions = 5, title?: string) =>
    api.post('/ai/generate-quiz', { documentId, numberOfQuestions, title }),

  // تلخيص مستند
  generateSummary: (documentId: string, numberOfPoints = 5) =>
    api.post('/ai/summary', { documentId, numberOfPoints }),

  // دردشة
  chat: (message: string, documentId?: string, sessionId?: string) =>
    api.post('/ai/chat', { message, documentId, sessionId }),

  // شرح مفهوم
  explainConcept: (concept: string, documentId?: string) =>
    api.post('/ai/explain', { concept, documentId }),

  // جلب كل المحادثات
  getChats: () => api.get('/ai/chats'),
};

export default aiService;