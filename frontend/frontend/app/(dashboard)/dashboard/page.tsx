'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = [
    {
      title: 'المستندات',
      value: '0',
      icon: '📄',
      color: 'bg-blue-500',
      href: '/documents',
    },
    {
      title: 'البطاقات',
      value: '0',
      icon: '🃏',
      color: 'bg-green-500',
      href: '/flashcards',
    },
    {
      title: 'الاختبارات',
      value: '0',
      icon: '📝',
      color: 'bg-purple-500',
      href: '/quizzes',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        مرحباً، {user?.name} 👋
      </h1>
      <p className="text-gray-600 mb-8">مرحباً بك في لوحة التحكم</p>

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

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">ابدأ الآن</h2>
        <p className="text-gray-600 mb-4">
          ارفع مستندك الأول لتبدأ رحلتك التعليمية
        </p>
        <Link
          href="/documents"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ارفع مستند
        </Link>
      </div>
    </div>
  );
}