import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
