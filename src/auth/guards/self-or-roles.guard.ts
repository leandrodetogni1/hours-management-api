import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import {
  SELF_OR_ROLES_KEY,
  SelfOrRolesOptions,
} from '../decorators/self-or-roles.decorator.js';
import { JwtUserPayload } from '../decorators/current-user.decorator.js';

@Injectable()
export class SelfOrRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const options = this.reflector.getAllAndOverride<SelfOrRolesOptions>(
      SELF_OR_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    if (!options.param || typeof options.param !== 'string') {
      throw new ForbiddenException('Configuração de autorização inválida');
    }

    const request = context.switchToHttp().getRequest<{
      user?: JwtUserPayload;
      params?: Record<string, string>;
    }>();

    const user = request.user;
    if (!user || typeof user.sub !== 'string' || user.sub.length === 0) {
      throw new ForbiddenException('Usuário sem permissão');
    }

    const paramValue = request.params?.[options.param];
    if (typeof paramValue !== 'string' || paramValue.length === 0) {
      throw new ForbiddenException('Parâmetro de identificação ausente');
    }

    if (user.sub === paramValue) return true;

    if (user.role && options.roles.includes(user.role)) return true;

    const rolesList = options.roles.join(', ');
    throw new ForbiddenException(
      `Acesso negado. Apenas o próprio usuário ou perfis: ${rolesList}`,
    );
  }
}
