import type { SmsProvider } from "./SmsProvider";

let smsProviderInstance: SmsProvider | null = null;
let currentProviderType: string | null = null;

export const getSmsProvider = async (): Promise<SmsProvider> => {
  const providerType = process.env.NEXT_PUBLIC_SMS_PROVIDER || 'firebase';

  if (!smsProviderInstance || currentProviderType !== providerType) {
    if (providerType === 'zalo') {
      const { ZaloSmsProvider } = await import("./ZaloSmsProvider");
      smsProviderInstance = new ZaloSmsProvider();
    } else {
      const { FirebaseSmsProvider } = await import("./FirebaseSmsProvider");
      smsProviderInstance = new FirebaseSmsProvider();
    }
    currentProviderType = providerType;
  }

  return smsProviderInstance;
};
