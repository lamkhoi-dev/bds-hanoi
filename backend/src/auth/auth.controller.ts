import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Request, HttpException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard, FacebookAuthGuard } from './oauth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || false,
  sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'none' | 'strict') || 'lax',
  path: '/',
};

const IS_LOGGED_IN_COOKIE_OPTIONS = {
  httpOnly: false, // Frontend needs to read this!
  secure: process.env.COOKIE_SECURE === 'true' || false,
  sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'none' | 'strict') || 'lax',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

    private getFrontendUrl(req?: any) {
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
    if (!frontendUrl) {
      throw new HttpException('FRONTEND_URL is required for OAuth redirect', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return frontendUrl.replace(/\/$/, '');
  }

  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 requests per 10 mins to prevent email spam
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    // Set JWT as HttpOnly cookie instead of returning in body
    res.cookie('token', result.access_token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 min
    if (result.refresh_token) {
      res.cookie('refreshToken', result.refresh_token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
    }
    // Set non-HttpOnly flag for frontend to match refresh token lifetime (7 days)
    res.cookie('isLoggedIn', '1', { ...IS_LOGGED_IN_COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Return user info but NOT the tokens
    const { access_token, refresh_token, ...safeResult } = result;
    return safeResult;
  }

  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 requests per 10 minutes (600,000ms)
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('verify-activation-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyActivationOtp(@Body() body: { email: string; otp: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyActivationOtp(body.email, body.otp);
    if (result.access_token) {
      res.cookie('token', result.access_token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    }
    if (result.refresh_token) {
      res.cookie('refreshToken', result.refresh_token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    }
    return {
      message: result.message,
      user: result.user
    };
  }

  @Post('resend-activation-otp')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  async resendActivationOtp(@Body('email') email: string) {
    return this.authService.resendActivationOtp(email);
  }


  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    // Read refresh token from cookie instead of body
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new HttpException('Refresh token không tìm thấy', HttpStatus.UNAUTHORIZED);
    }
    const result = await this.authService.refresh(refreshToken);
    res.cookie('token', result.access_token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    if (result.refresh_token) {
      res.cookie('refreshToken', result.refresh_token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    }
    res.cookie('isLoggedIn', '1', { ...IS_LOGGED_IN_COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { message: 'Token đã được làm mới' };
  }

  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    const frontendUrl = this.getFrontendUrl();
    const domain = frontendUrl.includes('localhost') ? 'localhost' : new URL(frontendUrl).hostname;
    
    // Clear cookies without domain
    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('isLoggedIn', { path: '/' });
    
    // Clear cookies with domain (for backward compatibility with old OAuth cookies)
    if (domain !== 'localhost') {
      res.clearCookie('token', { domain, path: '/' });
      res.clearCookie('refreshToken', { domain, path: '/' });
      res.clearCookie('isLoggedIn', { domain, path: '/' });
    }

    return { message: 'Đã đăng xuất' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() body: { oldPassword?: string; newPassword: string }) {
    return this.authService.changePassword(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-verification-email')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestVerificationEmail(@Request() req) {
    return this.authService.requestVerificationEmail(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-email-change')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestEmailChange(@Request() req, @Body('newEmail') newEmail: string) {
    return this.authService.requestEmailChange(req.user.id, newEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-email-change')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmailChange(@Request() req, @Body('otp') otp: string) {
    return this.authService.verifyEmailChange(req.user.id, otp);
  }

  @Post('verify-phone-firebase')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyPhoneFirebase(@Body('idToken') idToken: string, @Res({ passthrough: true }) res) {
    if (!idToken) throw new BadRequestException('Token không hợp lệ');
    const result = await this.authService.verifyFirebasePhoneToken(idToken);
    
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || false,
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'none' | 'strict') || 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || false,
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'none' | 'strict') || 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('isLoggedIn', '1', {
      httpOnly: false,
      secure: process.env.COOKIE_SECURE === 'true' || false,
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'none' | 'strict') || 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-phone-firebase')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async updatePhoneFirebase(@Request() req, @Body('idToken') idToken: string) {
    if (!idToken) throw new BadRequestException('Token không hợp lệ');
    return this.authService.updatePhoneWithFirebase(req.user.id, idToken);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    if (res.headersSent) return;
    const loginResult = req.user as any;
    const frontendUrl = this.getFrontendUrl(req);
    res.cookie('token', loginResult.access_token, { path: '/', maxAge: 86400000 });
    res.cookie('refreshToken', loginResult.refresh_token || '', { path: '/', maxAge: 30 * 86400000 });
    res.redirect(`${frontendUrl}/login?loggedIn=1`);
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    // Initiates the Facebook OAuth flow
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthRedirect(@Req() req, @Res() res: Response) {
    if (res.headersSent) return;
    const loginResult = req.user as any;
    const frontendUrl = this.getFrontendUrl(req);
    res.cookie('token', loginResult.access_token, { path: '/', maxAge: 86400000 });
    res.cookie('refreshToken', loginResult.refresh_token || '', { path: '/', maxAge: 30 * 86400000 });
    res.redirect(`${frontendUrl}/login?loggedIn=1`);
  }
}
