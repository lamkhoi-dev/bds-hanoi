import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { GoogleAuthGuard, FacebookAuthGuard } from './oauth.guard';
import { MailModule } from '../mail/mail.module';
import { getJwtSecret } from './jwt-secret';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '15m' },
    }),
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, FacebookStrategy, GoogleAuthGuard, FacebookAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
