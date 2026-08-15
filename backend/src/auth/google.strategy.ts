import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const publicApiUrl = process.env.PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');
    if (!process.env.GOOGLE_CALLBACK_URL && !publicApiUrl) {
      throw new Error('PUBLIC_API_URL or GOOGLE_CALLBACK_URL is required for Google OAuth in production');
    }

    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'google_oauth_disabled',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google_oauth_disabled',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${publicApiUrl}/auth/google/callback`,
      scope: ['email', 'profile'],
      proxy: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, id, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: profile.displayName || `${name?.givenName || ''} ${name?.familyName || ''}`.trim() || 'Người dùng',
      avatar: photos?.[0]?.value,
      provider: 'GOOGLE',
      providerId: id,
    };
    
    const dbUser = await this.authService.validateOAuthLogin(user);
    return dbUser;
  }
}
