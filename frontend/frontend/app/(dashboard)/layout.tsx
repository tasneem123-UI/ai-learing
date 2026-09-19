'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// ✅ نعمل navItems بره الـ Component
const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: '🏠' },
  { href: '/documents', label: 'المستندات', icon: '📄' },
  { href: '/flashcards', label: 'البطاقات', icon: '🃏' },
  { href: '/quizzes', label: 'الاختبارات', icon: '📝' },
  { href: '/profile', label: 'الملف الشخصي', icon: '👤' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">🤖 AI Learning</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">مرحباً، {user.name}</span>
            <button
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
            >
              خروج
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-60px)] p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}