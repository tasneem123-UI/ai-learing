'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import documentService from '@/lib/documentService';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  title: string;
  fileName: string;
  fileType: string;
  content: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data } = await documentService.getAll();
      setDocuments(data.data || data || []);
    } catch {
      toast.error('خطأ في جلب المستندات');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('اختر ملف أولاً');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);

    try {
      await documentService.upload(formData);
      toast.success('تم رفع المستند بنجاح');
      setShowModal(false);
      setTitle('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المستند؟')) return;
    try {
      await documentService.delete(id);
      setDocuments(documents.filter((d) => d._id !== id));
      toast.success('تم الحذف');
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">المستندات</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + رفع مستند
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-6xl mb-4">📄</p>
          <h2 className="text-xl font-bold text-gray-700 mb-2">لا توجد مستندات بعد</h2>
          <p className="text-gray-500 mb-6">ارفع مستندك الأول لتبدأ</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ارفع مستند
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc._id} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                  📄
                </div>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  🗑️
                </button>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 truncate">{doc.title}</h3>
              <p className="text-sm text-gray-500 mb-4 truncate">{doc.fileName}</p>
              <Link
                href={`/documents/${doc._id}`}
                className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                عرض التفاصيل
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">رفع مستند جديد</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان المستند
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقدمة في React"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الملف (PDF, DOCX, TXT)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.docx,.txt,.doc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}