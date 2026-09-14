import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

/**
 * `true` chỉ khi site này thật sự có cấu hình Firebase riêng.
 *
 * Site Hà Nội (nhân bản từ Nghệ An) chưa có dự án Firebase — cứ khởi tạo `initializeApp`
 * với chuỗi rỗng là site đó luôn báo lỗi mỗi lần bấm "Số điện thoại". Nơi gọi (nút chọn
 * phương thức đăng nhập) phải ẩn hẳn lựa chọn SMS khi cờ này `false`, thay vì để người dùng
 * bấm vào rồi mới thấy lỗi.
 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = !getApps().length && isFirebaseConfigured ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
