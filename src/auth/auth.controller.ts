import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/GoogleLoginDto.js';
import { AuthResponseDto } from './dto/AuthResponseDto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { JwtUserPayload } from './decorators/current-user.decorator.js';
import { UserResponseDto } from '../users/dto/UserResponseDto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login com Google (troca um ID token Google por um JWT próprio)',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'ID token inválido/expirado, email não verificado ou audience inválido',
  })
  googleLogin(@Body() body: GoogleLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(body.idToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dados do usuário autenticado (role atualizada do DB, não do JWT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atual',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT ausente, inválido ou expirado',
  })
  me(@CurrentUser() user: JwtUserPayload): Promise<UserResponseDto> {
    return this.authService.getCurrentUser(user.sub);
  }
}
