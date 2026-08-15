import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY is required in production');
    }

    const rawKey = process.env.ENCRYPTION_KEY || 'dev-only-32-bytes-secret-key-000';
    // Ensure key is 32 bytes
    this.key = Buffer.from(rawKey.padEnd(32, '0').slice(0, 32));
  }

  encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    try {
      const [ivHex, encryptedHex] = encryptedText.split(':');
      if (!ivHex || !encryptedHex) return encryptedText;

      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('Lỗi giải mã:', err);
      return '';
    }
  }
}
