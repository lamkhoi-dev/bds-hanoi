import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtSecret } from './jwt-secret';
import { Request } from 'express';

// Custom extractor: try HttpOnly cookie first, then fallback to Authorization header
function cookieOrBearerExtractor(req: Request): string | null {
  // 1. Try cookie
  if (req?.cookies?.token) {
    return req.cookies.token;
  }
  // 2. Fallback to Authorization header (for mobile apps, Postman, etc.)
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: cookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status === 'BANNED' || user.status === 'DELETED') {
      throw new UnauthorizedException('Tai khoan khong con duoc phep truy cap');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
