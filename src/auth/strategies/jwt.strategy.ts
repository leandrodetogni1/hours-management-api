import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUserPayload } from '../decorators/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

interface JwtRawPayload {
  sub?: string;
  email?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtRawPayload): Promise<JwtUserPayload> {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.email !== payload.email) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
    };
  }
}
