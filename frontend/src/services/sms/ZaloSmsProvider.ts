import { SmsProvider } from "./SmsProvider";

/**
 * Stub for future Zalo ZNS integration.
 * Zalo ZNS usually sends an API request to a backend, which then calls Zalo's API.
 * The verification is also usually handled by the backend.
 */
export class ZaloSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string): Promise<any> {
    console.log(`Sending Zalo ZNS to ${phoneNumber}...`);
    // Example: await fetch('/api/auth/zalo/send-otp', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
    return { provider: 'zalo', transactionId: 'dummy-zalo-transaction' };
  }

  async verifyOtp(confirmationResult: any, otp: string): Promise<any> {
    console.log(`Verifying Zalo ZNS OTP ${otp} for transaction`, confirmationResult);
    // Example: await fetch('/api/auth/zalo/verify-otp', { method: 'POST', body: JSON.stringify({ otp, transactionId: confirmationResult.transactionId }) });
    return { token: 'dummy-zalo-token' };
  }
}
