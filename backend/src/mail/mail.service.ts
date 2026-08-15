import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP chưa được cấu hình. Email OTP sẽ không được gửi ra ngoài.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      requireTLS: port === 587,
      auth: {
        user,
        pass
      }
    });
  }

  async sendOtpEmail(to: string, otp: string, type: 'ACTIVATION' | 'FORGOT_PASSWORD' = 'FORGOT_PASSWORD') {
    if (!this.transporter) {
      this.logger.warn(`Bỏ qua gửi OTP tới ${to} vì SMTP chưa được cấu hình. MÃ OTP LÀ: ${otp}`);
      return false;
    }

    try {
      const fromName = process.env.SMTP_FROM_NAME || 'Nhà Đất Xứ Nghệ';
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'support@nhadatxunghe.vn';
      const subject = type === 'ACTIVATION' ? 'Mã xác nhận OTP - Kích hoạt tài khoản' : 'Mã xác nhận OTP - Quên mật khẩu';
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
        html: `<b>Mã OTP của bạn là: <span style="color:blue; font-size: 20px">${otp}</span></b><br>Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.`,
      });

      this.logger.log(`Message sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendNotificationEmail(to: string, subject: string, content: string) {
    if (!this.transporter) {
      this.logger.warn(`Bỏ qua gửi email thông báo tới ${to} vì SMTP chưa được cấu hình.`);
      return false;
    }

    try {
      const fromName = process.env.SMTP_FROM_NAME || 'Nhà Đất Xứ Nghệ';
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'support@nhadatxunghe.vn';
      
      const escapedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text: content,
        html: `<p>${escapedContent.replace(/\n/g, '<br>')}</p>`,
      });

      this.logger.log(`Notification email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send notification email', error);
      return false;
    }
  }
}
