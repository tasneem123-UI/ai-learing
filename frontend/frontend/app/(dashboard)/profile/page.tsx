'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">الملف الشخصي</h1>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">الاسم</span>
            <span className="font-medium text-gray-800">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">البريد الإلكتروني</span>
            <span className="font-medium text-gray-800">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
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