'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-5 text-2xl font-bold text-gray-800 sm:mb-6 sm:text-3xl">الملف الشخصي</h1>

      <div className="rounded-2xl bg-white p-5 shadow-lg sm:p-8">
        <div className="mb-6 flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="wrap-break-word text-xl font-bold text-gray-800 sm:text-2xl">{user?.name}</h2>
            <p className="break-all text-sm text-gray-500 sm:text-base">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">الاسم</span>
            <span className="wrap-break-word font-medium text-gray-800">{user?.name}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">البريد الإلكتروني</span>
            <span className="break-all font-medium text-gray-800 sm:text-left">{user?.email}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">الدور</span>
            <span className="font-medium text-gray-800">
              {user?.role === 'admin' ? '👑 مدير' : '👤 مستخدم'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}