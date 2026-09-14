export interface SmsProvider {
  /**
   * Sends an OTP to the given phone number.
   * @param phoneNumber The phone number with country code (e.g., +84901234567)
   * @param recaptchaVerifier Optional RecaptchaVerifier for Firebase Auth
   * @returns A promise that resolves to a confirmation object (can be anything depending on provider)
   */
  sendOtp(phoneNumber: string, recaptchaVerifier?: any): Promise<any>;

  /**
   * Verifies the OTP provided by the user.
   * @param confirmationResult The result object returned from sendOtp
   * @param otp The code entered by the user
   * @returns A promise that resolves to a verified token or user payload
   */
  verifyOtp(confirmationResult: any, otp: string): Promise<any>;

  /**
   * Optional method to setup recaptcha for providers like Firebase
   * @param containerId HTML element id
   */
  setupRecaptcha?(containerId: string): Promise<any>;

  /**
   * Dọn widget reCAPTCHA đang giữ (nếu có). Gọi khi người dùng rời luồng SMS trước khi hoàn
   * tất — không chỉ khi gửi OTP thất bại — để lần sau quay lại không dùng nhầm verifier cũ
   * trỏ vào một phần tử DOM đã bị gỡ.
   */
  clearRecaptcha?(): void;
}
