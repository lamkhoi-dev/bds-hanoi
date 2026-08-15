import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    if (err || !user) {
      const res = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
      // Pass the error message back to the frontend
      const errorMsg = err?.message || 'OAuthFailed';
      res.redirect(`${frontendUrl.replace(/\/$/, '')}/login?error=${encodeURIComponent(errorMsg)}`);
      return null;
    }
    return user;
  }
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    if (err || !user) {
      console.error('GoogleAuthGuard error:', err, 'info:', info, 'user:', user);
      require('fs').appendFileSync('/app/oauth_error.log', JSON.stringify({error: err ? err.toString() : null, info, user}) + '\\n');
      const res = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
      const errorMsg = err?.message || 'OAuthFailed';
      res.redirect(`${frontendUrl.replace(/\/$/, '')}/login?error=${encodeURIComponent(errorMsg)}`);
      return null;
    }
    return user;
  }
}
