import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    const publicApiUrl = process.env.PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');
    if (!process.env.FACEBOOK_CALLBACK_URL && !publicApiUrl) {
      throw new Error('PUBLIC_API_URL or FACEBOOK_CALLBACK_URL is required for Facebook OAuth in production');
    }

    super({
      clientID: process.env.FACEBOOK_APP_ID || 'facebook_oauth_disabled',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'facebook_oauth_disabled',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${publicApiUrl}/auth/facebook/callback`,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      proxy: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user: any, info?: any) => void): Promise<any> {
    const { name, emails, id, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      avatar: photos?.[0]?.value,
      provider: 'FACEBOOK',
      providerId: id,
    };
    
    const dbUser = await this.authService.validateOAuthLogin(user);
    return dbUser;
  }
}
