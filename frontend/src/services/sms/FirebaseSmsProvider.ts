import type { ConfirmationResult, RecaptchaVerifier as RecaptchaVerifierType } from "firebase/auth";
import type { SmsProvider } from "./SmsProvider";
import { normalizeVnPhoneForFirebase } from "@/lib/phone";

export class FirebaseSmsProvider implements SmsProvider {
  /**
   * Khởi tạo RecaptchaVerifier
   */
  public async setupRecaptcha(containerId: string): Promise<RecaptchaVerifierType> {
    if (!(window as any).recaptchaVerifier) {
      const { RecaptchaVerifier } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase");
      
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
    return (window as any).recaptchaVerifier;
  }

  public clearRecaptcha() {
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
  }

  async sendOtp(phoneNumber: string, recaptchaVerifier?: any): Promise<ConfirmationResult> {
    if (!recaptchaVerifier) {
      throw new Error("RecaptchaVerifier is required for Firebase SMS Auth.");
    }
    if (!phoneNumber) {
      throw new Error("Phone number is required.");
    }

    const { signInWithPhoneNumber } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase");

    // Firebase requires phone numbers to include country code (e.g., +84). Dùng hàm dùng
    // chung thay vì tự nối chuỗi — nối tay từng làm `+84912...` gõ sẵn quốc mã thành
    // `+8484912...` vì ô nhập ở trang đăng nhập đã lọc dấu `+` trước khi tới đây.
    const formattedPhone = normalizeVnPhoneForFirebase(phoneNumber);
    
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP via Firebase:", error);
      // Clean up reCAPTCHA widget if sending fails
      if (recaptchaVerifier && typeof recaptchaVerifier.clear === 'function') {
        recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
      throw error;
    }
  }

  async verifyOtp(confirmationResult: ConfirmationResult, otp: string): Promise<any> {
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      // Get the ID token to send to the backend
      const idToken = await user.getIdToken();
      return { idToken, user };
    } catch (error) {
      console.error("Error verifying OTP via Firebase:", error);
      throw error;
    }
  }
}
