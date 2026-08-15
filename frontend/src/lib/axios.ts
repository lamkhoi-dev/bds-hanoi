import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Gửi HttpOnly cookie tự động với mọi request
  withCredentials: true,
  timeout: 10000,
});

// Không cần request interceptor để gắn token từ localStorage nữa
// Token giờ được gửi qua HttpOnly cookie tự động bởi trình duyệt

let isRefreshing = false;
let refreshSubscribers: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const subscribeTokenRefresh = (resolve: (token: string) => void, reject: (err: any) => void) => {
  refreshSubscribers.push({ resolve, reject });
};

const onRefreshed = (err: any | null, token: string | null) => {
  if (err) {
    refreshSubscribers.forEach((cb) => cb.reject(err));
  } else {
    refreshSubscribers.forEach((cb) => cb.resolve(token!));
  }
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401) {
      if (originalRequest._retry) {
        if (typeof window !== 'undefined') {
          document.cookie = 'isLoggedIn=; Max-Age=0; path=/';
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      if (!originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
              withCredentials: true,
            });
            isRefreshing = false;
            onRefreshed(null, 'success');
            return api(originalRequest);
          } catch (err) {
            isRefreshing = false;
            onRefreshed(err, null);
            if (typeof window !== 'undefined') {
              // Clear the isLoggedIn cookie to prevent AuthContext from retrying
              document.cookie = 'isLoggedIn=; Max-Age=0; path=/';
              // Only redirect if not already on login page to prevent infinite loop
              if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
              }
            }
            return Promise.reject(err);
          }
        }

        // Nếu đang refresh, đưa các request khác vào hàng đợi
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            () => resolve(api(originalRequest)),
            (err: any) => reject(err)
          );
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
