'use client';

import { useState, useEffect } from 'react';
import flashcardService from '@/lib/flashcardService';
import toast from 'react-hot-toast';

interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  isFavorite: boolean;
  document?: { title: string };
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      const { data } = await flashcardService.getAll();
      setFlashcards(data.data || data || []);
    } catch {
      toast.error('خطأ في جلب البطاقات');
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">كل البطاقات</h1>

      {flashcards.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-6xl mb-4">🃏</p>
          <h2 className="text-xl font-bold text-gray-700 mb-2">لا توجد بطاقات بعد</h2>
          <p className="text-gray-500">ارفع مستنداً وولّد بطاقات منه</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((card) => (
            <div key={card._id} className="bg-white rounded-xl shadow p-4">
              <p className="font-bold text-gray-800 mb-2">{card.question}</p>
              <p className="text-gray-600 text-sm">{card.answer}</p>
              {card.document && (
                <p className="text-xs text-gray-400 mt-3">📄 {card.document.title}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}