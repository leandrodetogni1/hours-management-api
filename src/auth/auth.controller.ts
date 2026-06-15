import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/GoogleLoginDto.js';
import { AuthResponseDto } from './dto/AuthResponseDto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { JwtUserPayload } from './decorators/current-user.decorator.js';
import { UserResponseDto } from '../users/dto/UserResponseDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';
import { Audit } from '../audit/audit.decorator.js';

function loginActor(result: unknown): { id: string; email: string } | null {
  const root = result as { user?: unknown; data?: { user?: unknown } } | null;
  const user = (root?.user ?? root?.data?.user) as
    | { id?: unknown; email?: unknown }
    | undefined;
  if (user && typeof user.id === 'string' && typeof user.email === 'string') {
    return { id: user.id, email: user.email };
  }
  return null;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @Audit({
    action: 'auth.login',
    entityType: 'auth',
    resolveActorId: (_req, result) => loginActor(result)?.id ?? null,
    resolveActorEmail: (_req, result) => loginActor(result)?.email ?? null,
  })
  @ApiEndpoint({
    summary: 'Login com Google (troca um ID token Google por um JWT próprio)',
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
    isPublic: true,
    hasBody: true,
    errors: [
      {
        status: 401,
        description:
          'ID token inválido/expirado, email não verificado ou audience inválido',
      },
    ],
  })
  googleLogin(@Body() body: GoogleLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(body.idToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiEndpoint({
    summary: 'Dados do usuário autenticado (role atualizada do DB, não do JWT)',
    description: 'Usuário atual',
    type: UserResponseDto,
    errors: [{ status: 401, description: 'JWT ausente, inválido ou expirado' }],
  })
  me(@CurrentUser() user: JwtUserPayload): Promise<UserResponseDto> {
    return this.authService.getCurrentUser(user.sub);
  }
}
