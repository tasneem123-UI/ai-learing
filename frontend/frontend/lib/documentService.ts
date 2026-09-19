import type { Document } from "@/types/document";
export const documents: Document[] = [
  { id: "1", title: "أساسيات الذكاء الاصطناعي", type: "PDF", size: "4.2 MB", updatedAt: "منذ ساعتين", progress: 72, color: "#d7f3e8" },
  { id: "2", title: "تصميم واجهات المستخدم", type: "PPTX", size: "8.7 MB", updatedAt: "أمس", progress: 38, color: "#ffe5d8" },
  { id: "3", title: "مقدمة في علم البيانات", type: "DOCX", size: "1.8 MB", updatedAt: "منذ 3 أيام", progress: 100, color: "#e2e8ff" },
];
export const documentService = { list: async () => documents, get: async (id: string) => documents.find((document) => document.id === id) ?? documents[0] };