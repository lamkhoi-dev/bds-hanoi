import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

// Khởi tạo Firebase Admin (chỉ chạy 1 lần)
// Ưu tiên biến môi trường FIREBASE_SERVICE_ACCOUNT (JSON thô hoặc base64) để không phải
// commit private key vào repo; fallback về file firebase-service-account.json cho dev.
function loadFirebaseCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw.trim()) {
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    return require(serviceAccountPath);
  }
  return null;
}

try {
  if (!admin.apps.length) {
    const serviceAccount = loadFirebaseCredential();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.log('Firebase Admin SDK: chưa cấu hình credential, bỏ qua (đăng nhập OTP sẽ không hoạt động).');
    }
  }
} catch (e) {
  console.log("Firebase Admin SDK failed to initialize:", e);
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private normalizeEmail(email?: string | null) {
    return String(email || '').trim().toLowerCase();
  }

  private normalizeIdentifier(identifier?: string | null) {
    const value = String(identifier || '').trim();
    return value.includes('@') ? value.toLowerCase() : value;
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = crypto.randomUUID();
    
    // Lưu refresh token vào Redis với key: refreshToken:<token>, value: userId, TTL: 7 days
    await this.cacheManager.set(`refreshToken:${refresh_token}`, user.id, 7 * 24 * 60 * 60 * 1000);
    
    return { access_token, refresh_token };
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmailOrPhone(this.normalizeIdentifier(identifier));
    if (!user) return null;

    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new UnauthorizedException('Tài khoản không còn được phép đăng nhập');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt. Vui lòng xác thực OTP để kích hoạt tài khoản.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Tài khoản đã bị khoá tạm thời do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau 15 phút.');
    }

    if (user.password && await bcrypt.compare(pass, user.password)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });
      const { password, otp, otpExpiresAt, emailOtp, emailOtpExpiresAt, pendingEmail, balance, ...rest } = user as any;
      return { ...rest, balance: balance ? Number(balance) : 0 };
    }

    const newAttempts = (user.loginAttempts || 0) + 1;
    const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60000) : null;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: newAttempts, lockedUntil },
    });

    if (newAttempts >= 5) {
      throw new UnauthorizedException('Tài khoản đã bị khoá tạm thời do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau 15 phút.');
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    
    const tokens = await this.generateTokens(user);

    if (user.status === 'FORCE_CHANGE_PASSWORD') {
      return {
        ...tokens,
        requirePasswordChange: true,
        message: 'Bạn phải đổi mật khẩu ở lần đăng nhập đầu tiên.',
        user,
      };
    }

    return {
      ...tokens,
      user,
    };
  }

  async changePassword(userId: string, body: { oldPassword?: string; newPassword: string }) {
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');
    
    if (user.password) {
      if (!body.oldPassword) {
        throw new BadRequestException('Bắt buộc phải nhập mật khẩu cũ');
      }
      const isValid = await bcrypt.compare(body.oldPassword, user.password);
      if (!isValid) throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        status: user.status === 'FORCE_CHANGE_PASSWORD' ? 'ACTIVE' : user.status,
      }
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const newUser = await this.userService.create({
      email: this.normalizeEmail(registerDto.email),
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone?.trim(),
      purpose: registerDto.purpose,
      status: 'INACTIVE',
      otp,
      otpExpiresAt: expiresAt,
    });

    // Gửi OTP kích hoạt qua email
    await this.mailService.sendOtpEmail(this.normalizeEmail(registerDto.email), otp, 'ACTIVATION');

    const { password, otp: userOtp, otpExpiresAt, emailOtp, emailOtpExpiresAt, pendingEmail, ...result } = newUser as any;
    return {
      ...result,
      message: 'Đăng ký thông tin thành công. Mã OTP kích hoạt đã được gửi tới email của bạn.',
    };
  }

  async resendActivationOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    
    if (!user || user.status !== 'INACTIVE') {
      // Return success even if invalid to prevent email enumeration, or just standard message
      return { message: 'Mã OTP mới đã được gửi tới email của bạn.' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiresAt: expiresAt,
      },
    });

    await this.mailService.sendOtpEmail(user.email, otp, 'ACTIVATION');
    return { message: 'Mã OTP mới đã được gửi tới email của bạn.' };
  }

  async requestVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    if (!user.email) throw new BadRequestException('Không tìm thấy địa chỉ email');
    if (user.emailVerified) throw new BadRequestException('Email đã được xác thực');

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.user.update({
      where: { id: userId },
      data: { otp, otpExpiresAt: expiresAt },
    });

    await this.mailService.sendOtpEmail(user.email, otp);
    return { message: 'Mã xác thực đã được gửi đến email của bạn' };
  }

  async verifyActivationOtp(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại.');
    }
    if (user.status !== 'INACTIVE') {
      throw new BadRequestException('Tài khoản đã được kích hoạt hoặc không ở trạng thái cần kích hoạt.');
    }

    if (user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      const newAttempts = (user.failedOtpAttempts || 0) + 1;
      const status = newAttempts >= 5 ? 'BANNED' : user.status;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedOtpAttempts: newAttempts, status },
      });
      if (status === 'BANNED') {
        throw new BadRequestException('Tài khoản đã bị khóa do nhập sai OTP quá 5 lần.');
      }
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        otp: null,
        otpExpiresAt: null,
        failedOtpAttempts: 0,
        emailVerified: true,
      },
    });

    const { password, otp: userOtp, otpExpiresAt, emailOtp, emailOtpExpiresAt, pendingEmail, balance, ...result } = updatedUser as any;
    const userToReturn = { ...result, balance: balance ? Number(balance) : 0 };
    const tokens = await this.generateTokens(updatedUser);

    return { 
      message: 'Kích hoạt tài khoản thành công.',
      ...tokens,
      user: userToReturn
    };
  }


  async validateOAuthLogin(profile: any) {
    const user = await this.userService.findOrCreateOAuthUser(profile);
    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new UnauthorizedException('Tài khoản không còn được phép đăng nhập');
    }
    const { password, otp, otpExpiresAt, emailOtp, emailOtpExpiresAt, pendingEmail, balance, ...safeUser } = user as any;
    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: { ...safeUser, balance: balance ? Number(balance) : 0 },
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      return { message: 'Nếu email tồn tại, mã OTP sẽ được gửi đến hộp thư của bạn' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: { otp, otpExpiresAt: expiresAt },
    });

    await this.mailService.sendOtpEmail(normalizedEmail, otp);
    return { message: 'OTP đã được gửi đến email của bạn' };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new BadRequestException('Tài khoản không còn được phép hoạt động');
    }

    if (user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      const newAttempts = (user.failedOtpAttempts || 0) + 1;
      const status = newAttempts >= 5 ? 'BANNED' : user.status;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedOtpAttempts: newAttempts, status },
      });
      if (status === 'BANNED') {
        throw new BadRequestException('Tài khoản đã bị khóa do nhập sai OTP quá 5 lần.');
      }
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedOtpAttempts: 0 },
    });

    return { message: 'Xác thực OTP thành công. Bạn có thể đặt mật khẩu mới.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new BadRequestException('Tài khoản không còn được phép hoạt động');
    }

    if (user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      const newAttempts = (user.failedOtpAttempts || 0) + 1;
      const status = newAttempts >= 5 ? 'BANNED' : user.status;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedOtpAttempts: newAttempts, status },
      });
      if (status === 'BANNED') {
        throw new BadRequestException('Tài khoản đã bị khóa do nhập sai OTP quá 5 lần.');
      }
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
        loginAttempts: 0,
        lockedUntil: null,
        failedOtpAttempts: 0,
      },
    });

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async requestEmailChange(userId: string, newEmail: string) {
    const normalizedEmail = this.normalizeEmail(newEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('Email mới không hợp lệ');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!currentUser) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    if (currentUser.email === normalizedEmail) {
      throw new BadRequestException('Email mới phải khác email hiện tại');
    }

    const existingUser = await this.userService.findByEmail(normalizedEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Email này đã được sử dụng bởi tài khoản khác');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: normalizedEmail, emailOtp: otp, emailOtpExpiresAt: expiresAt },
    });

    await this.mailService.sendOtpEmail(normalizedEmail, otp);
    return { message: 'OTP đã được gửi đến email mới của bạn' };
  }

  async verifyEmailChange(userId: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new BadRequestException('Tài khoản không còn được phép hoạt động');
    }

    if (user.emailOtp !== otp || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      const newAttempts = (user.failedOtpAttempts || 0) + 1;
      const status = newAttempts >= 5 ? 'BANNED' : user.status;
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedOtpAttempts: newAttempts, status },
      });
      if (status === 'BANNED') {
        throw new BadRequestException('Tài khoản đã bị khóa do nhập sai OTP quá 5 lần.');
      }
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    if (!user.pendingEmail) {
      throw new BadRequestException('Không có yêu cầu đổi email nào');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        emailOtp: null,
        emailOtpExpiresAt: null,
        failedOtpAttempts: 0,
      },
    });

    return { message: 'Đổi email thành công. Vui lòng đăng nhập lại.' };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }
    const userId = await this.cacheManager.get<string>(`refreshToken:${refreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'BANNED' || user.status === 'DELETED' || user.status === 'INACTIVE') {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
    }

    // Xoa token cu
    await this.cacheManager.del(`refreshToken:${refreshToken}`);

    // Tao token moi
    return this.generateTokens(user);
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.cacheManager.del(`refreshToken:${refreshToken}`);
    }
    return { message: 'Đăng xuất thành công' };
  }

  async verifyFirebasePhoneToken(idToken: string) {
    if (!idToken) {
      throw new BadRequestException('Token không được để trống.');
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase Token Verification Error:", error);
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
    }

    const phoneNumber = decodedToken.phone_number;
    
    if (!phoneNumber) {
      throw new BadRequestException('Firebase token does not contain a phone number.');
    }

    // Find user by phone number
    let user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber }
    });

    // Nếu chưa có tài khoản, tự động tạo mới (tùy vào logic nghiệp vụ của hệ thống, ở đây tạm thời tạo luôn)
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: `User ${phoneNumber}`,
          phone: phoneNumber,
          password: 'SMS_LOGIN_NO_PASSWORD',
          status: 'ACTIVE',
          emailVerified: true
        }
      });
    } else if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị khóa hoặc chưa kích hoạt');
    }

    const tokens = await this.generateTokens(user);
    const { password, otp, otpExpiresAt, emailOtp, emailOtpExpiresAt, pendingEmail, balance, ...safeUser } = user as any;
    return { ...tokens, user: { ...safeUser, balance: balance ? Number(balance) : 0 } };
  }
  async updatePhoneWithFirebase(userId: string, idToken: string) {
    if (!idToken) {
      throw new BadRequestException('Token không được để trống.');
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase Token Verification Error:", error);
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
    }

    const phoneNumber = decodedToken.phone_number;
    
    if (!phoneNumber) {
      throw new BadRequestException('Firebase token does not contain a phone number.');
    }

    // Check if phone number is already used by another user
    const existingUser = await this.prisma.user.findFirst({
      where: { phone: phoneNumber, id: { not: userId } }
    });

    if (existingUser) {
      throw new ConflictException('Số điện thoại đã được sử dụng bởi tài khoản khác.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { phone: phoneNumber }
    });

    return { message: 'Cập nhật số điện thoại thành công.', phone: updatedUser.phone };
  }
}
