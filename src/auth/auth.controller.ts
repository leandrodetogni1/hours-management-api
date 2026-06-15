import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/GoogleLoginDto.js';
import { AuthResponseDto } from './dto/AuthResponseDto.js';
import { LogoutResponseDto } from './dto/LogoutResponseDto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { JwtUserPayload } from './decorators/current-user.decorator.js';
import { UserResponseDto } from '../users/dto/UserResponseDto.js';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator.js';
import { Audit } from '../audit/audit.decorator.js';

function loginActorId(result: unknown): string | null {
  const root = result as { user?: unknown; data?: { user?: unknown } } | null;
  const user = (root?.user ?? root?.data?.user) as { id?: unknown } | undefined;
  return user && typeof user.id === 'string' ? user.id : null;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @Audit({
    action: 'auth.login',
    entityType: 'auth',
    resolveActorId: (_req, result) => loginActorId(result),
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

  @Post('logout')
  @ApiBearerAuth()
  @Audit({ action: 'auth.logout', entityType: 'auth' })
  @ApiEndpoint({
    summary:
      'Registrar logout do usuário autenticado (somente para auditoria; o JWT é stateless)',
    status: HttpStatus.OK,
    description: 'Logout registrado',
    type: LogoutResponseDto,
    errors: [{ status: 401, description: 'JWT ausente, inválido ou expirado' }],
  })
  logout(): LogoutResponseDto {
    return { message: 'Logout registrado com sucesso' };
  }
}
