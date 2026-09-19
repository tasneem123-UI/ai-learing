import api from './api';

export const flashcardService = {
  // جلب كل البطاقات
  getAll: () => api.get('/flashcards'),

  // جلب بطاقات مستند معين
  getByDocument: (documentId: string) =>
    api.get(`/flashcards/document/${documentId}`),

  // تحديث بطاقة (مفضلة)
  update: (id: string, data: any) => api.put(`/flashcards/${id}`, data),

  // حذف بطاقة
  delete: (id: string) => api.delete(`/flashcards/${id}`),
};

export default flashcardService;