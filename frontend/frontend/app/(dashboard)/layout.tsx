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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="shrink-0 text-lg sm:text-xl font-bold text-blue-600">🤖 AI Learning</h1>
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <span className="max-w-[38vw] truncate text-sm sm:max-w-none sm:text-base text-gray-700">مرحباً، {user.name}</span>
            <button
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="shrink-0 bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 text-sm"
            >
              خروج
            </button>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-60px)]">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 bg-white shadow-md p-4">
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
        <main className="min-w-0 flex-1 p-3 pb-24 sm:p-5 sm:pb-24 md:p-6">{children}</main>
      </div>

      <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] leading-tight transition sm:text-xs ${
                  pathname === item.href
                    ? 'font-bold text-blue-700'
                    : 'text-gray-500 hover:text-blue-700'
                }`}
              >
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                <span className="line-clamp-1">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}