'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  title: string;
  fileName: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // ✅ نجيب البيانات من الـ endpoints الموجودة
      const [docsRes, flashcardsRes, quizzesRes] = await Promise.all([
        api.get('/documents').catch(() => ({ data: [] })),
        api.get('/flashcards').catch(() => ({ data: [] })),
        api.get('/quizzes').catch(() => ({ data: [] })),
      ]);

      const docs = docsRes.data?.data || docsRes.data || [];
      const flashcards = flashcardsRes.data?.data || flashcardsRes.data || [];
      const quizzes = quizzesRes.data?.data || quizzesRes.data || [];

      setDocuments(docs);
      setFlashcardsCount(flashcards.length);
      setQuizzesCount(quizzes.length);
    } catch (error) {
      console.error(error);
      toast.error('خطأ في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'المستندات',
      value: documents.length,
      icon: '📄',
      color: 'bg-blue-500',
      href: '/documents',
    },
    {
      title: 'البطاقات',
      value: flashcardsCount,
      icon: '🃏',
      color: 'bg-green-500',
      href: '/flashcards',
    },
    {
      title: 'الاختبارات',
      value: quizzesCount,
      icon: '📝',
      color: 'bg-purple-500',
      href: '/quizzes',
    },
  ];

  const recentDocuments = documents.slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        مرحباً، {user?.name} 👋
      </h1>
      <p className="text-gray-600 mb-8">مرحباً بك في لوحة التحكم</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
          >
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4`}>
              {card.icon}
            </div>
            <h3 className="text-gray-600 text-sm">{card.title}</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">آخر المستندات</h2>
          <Link href="/documents" className="text-blue-600 hover:underline text-sm">
            عرض الكل
          </Link>
        </div>

        {recentDocuments.length > 0 ? (
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <Link
                key={doc._id}
                href={`/documents/${doc._id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  📄
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{doc.title}</p>
                  <p className="text-xs text-gray-500">{doc.fileName}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">📄</p>
            <p className="text-gray-500 mb-4">لا توجد مستندات بعد</p>
            <Link
              href="/documents"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              ارفع مستند
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}