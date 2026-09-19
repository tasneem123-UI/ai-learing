// frontend/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ==========================================
// 1. إنشاء instance من axios
// ==========================================
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ مهم جدًا: يبعت الكوكيز مع كل طلب
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// 2. Response Interceptor: تجديد التوكن تلقائياً
// ==========================================
let isRefreshing = false;
type FailedRequest = { resolve: (value?: unknown) => void; reject: (error: unknown) => void };
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // لو الخطأ 401 (توكن منتهي) ومحاولناش نجدد قبل كده
    if (error.response?.status === 401 && !originalRequest._retry) {
      // لو مش بنجدد حالياً
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ✅ نطلب تجديد التوكن (الكوكي بيتبعت تلقائياً)
        await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // لو فشل التجديد، نروح لصفحة تسجيل الدخول
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;