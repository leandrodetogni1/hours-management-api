import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserMapper } from '../users/mappers/user.mapper.js';
import { UserResponseDto } from '../users/dto/UserResponseDto.js';
import { AuthResponseDto } from './dto/AuthResponseDto.js';
import { UserSituation } from '../enums/UserSituation.js';

const DEFAULT_ROLE_NAME = 'member';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }
    this.googleClientId = clientId;
    this.googleClient = new OAuth2Client(clientId);
    this.jwtExpiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
  }

  async onModuleInit(): Promise<void> {
    const role = await this.prisma.roles.findUnique({
      where: { name: DEFAULT_ROLE_NAME },
    });
    if (!role) {
      this.logger.warn(
        `Default role "${DEFAULT_ROLE_NAME}" not found in DB. Run prisma migrations.`,
      );
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyGoogleIdToken(idToken);

    const email = payload.email;
    if (!email) {
      throw new UnauthorizedException('Google token sem email');
    }
    if (payload.email_verified !== true) {
      throw new UnauthorizedException('Email Google não verificado');
    }

    const firstName = payload.given_name?.trim() || '';
    const lastName = payload.family_name?.trim() || '';
    const picture = payload.picture ?? null;

    const user = await this.upsertGoogleUser({
      email,
      firstName,
      lastName,
      picture,
    });

    const token = await this.signJwt(user);

    return { token, user };
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return UserMapper.toResponseDto(user);
  }

  private async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Google token sem payload');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(
        `Google token verification failed: ${(error as Error).message}`,
      );
      throw new UnauthorizedException('Google token inválido ou expirado');
    }
  }

  private async upsertGoogleUser(input: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string | null;
  }): Promise<UserResponseDto> {
    const existing = await this.prisma.users.findUnique({
      where: { email: input.email },
      include: { role: true },
    });

    if (existing) {
      const updated = await this.prisma.users.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName || existing.firstName,
          lastName: input.lastName || existing.lastName,
          picture: input.picture,
          updatedAt: new Date(),
        },
        include: { role: true },
      });
      return UserMapper.toResponseDto(updated);
    }

    const defaultRole = await this.prisma.roles.findUnique({
      where: { name: DEFAULT_ROLE_NAME },
    });
    if (!defaultRole) {
      throw new InternalServerErrorException(
        `Default role "${DEFAULT_ROLE_NAME}" not seeded. Run migrations.`,
      );
    }

    const created = await this.prisma.users.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        picture: input.picture,
        role: { connect: { id: defaultRole.id } },
      },
      include: { role: true },
    });
    return UserMapper.toResponseDto({
      ...created,
      situation: created.situation as UserSituation | null,
    });
  }

  private signJwt(user: UserResponseDto): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: this.jwtExpiresIn as unknown as number },
    );
  }
}
