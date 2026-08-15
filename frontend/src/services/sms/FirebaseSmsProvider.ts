import type { ConfirmationResult, RecaptchaVerifier as RecaptchaVerifierType } from "firebase/auth";
import type { SmsProvider } from "./SmsProvider";

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

    // Firebase requires phone numbers to include country code (e.g., +84)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+84' + phoneNumber.replace(/^0/, '');
    
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
