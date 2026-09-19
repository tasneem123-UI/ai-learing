'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  questions: any[];
  document?: { title: string; _id: string };
  createdAt: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const { data } = await api.get('/quizzes');
      setQuizzes(data.data || data || []);
    } catch {
      toast.error('خطأ في جلب الاختبارات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف الاختبار؟')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes(quizzes.filter((q) => q._id !== id));
      toast.success('تم الحذف');
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  const difficultyLabel = (d: string) => {
    if (d === 'easy') return { text: 'سهل', color: 'bg-green-100 text-green-700' };
    if (d === 'hard') return { text: 'صعب', color: 'bg-red-100 text-red-700' };
    return { text: 'متوسط', color: 'bg-yellow-100 text-yellow-700' };
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">الاختبارات</h1>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-6xl mb-4">📝</p>
          <h2 className="text-xl font-bold text-gray-700 mb-2">لا توجد اختبارات بعد</h2>
          <p className="text-gray-500 mb-6">افتح مستند وولّد اختبار منه</p>
          <Link
            href="/documents"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            عرض المستندات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const diff = difficultyLabel(quiz.difficulty);
            return (
              <div key={quiz._id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                    📝
                  </div>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>

                <h3 className="font-bold text-gray-800 mb-2 truncate">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {quiz.questions.length} أسئلة
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${diff.color}`}>
                    {diff.text}
                  </span>
                  {quiz.document && (
                    <span className="text-xs text-gray-400">
                      📄 {quiz.document.title}
                    </span>
                  )}
                </div>

                <Link
                  href={`/quizzes/${quiz._id}`}
                  className="block text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  ابدأ الاختبار
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}