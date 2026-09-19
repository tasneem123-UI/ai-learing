import api from './api';

export const documentService = {
  // رفع مستند
  upload: (formData: FormData) =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // جلب كل المستندات
  getAll: () => api.get('/documents'),

  // جلب مستند معين
  getById: (id: string) => api.get(`/documents/${id}`),

  // حذف مستند
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export default documentService;