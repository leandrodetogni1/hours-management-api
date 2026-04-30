import { applyDecorators, HttpCode, HttpStatus, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiResponseOptions,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { Public } from '../../auth/decorators/public.decorator.js';

interface ApiParamOptions {
  name: string;
  description: string;
}

interface ApiEndpointOptions {
  summary: string;
  status?: HttpStatus;
  type?: Type<unknown>;
  isArray?: boolean;
  description?: string;
  params?: ApiParamOptions[];
  errors?: ApiResponseOptions[];
  roles?: string[];
  isPublic?: boolean;
  hasBody?: boolean;
  hasParams?: boolean;
}

const DEFAULT_ERRORS = {
  unauthorized: { status: 401, description: 'JWT ausente ou inválido' },
  notFound: { status: 404, description: 'Recurso não encontrado' },
  badRequest: { status: 400, description: 'Dados inválidos' },
};

export const ApiEndpoint = (options: ApiEndpointOptions) => {
  const {
    summary,
    status = HttpStatus.OK,
    type,
    isArray = false,
    description,
    params = [],
    errors = [],
    roles,
    isPublic = false,
    hasBody = false,
    hasParams = params.length > 0,
  } = options;

  const overriddenStatuses = new Set(errors.map((e) => e.status));

  const decorators: MethodDecorator[] = [
    ApiOperation({ summary }),
    HttpCode(status),
    ApiResponse({
      status,
      description: description ?? 'Sucesso',
      ...(type && { type: isArray ? [type] : type }),
    }) as MethodDecorator,
  ];

  for (const param of params) {
    decorators.push(ApiParam(param) as MethodDecorator);
  }

  if (isPublic) {
    decorators.push(Public());
  } else if (!overriddenStatuses.has(401)) {
    decorators.push(
      ApiResponse(DEFAULT_ERRORS.unauthorized) as MethodDecorator,
    );
  }

  if (roles && roles.length > 0) {
    decorators.push(Roles(...roles));
    if (!overriddenStatuses.has(403)) {
      const rolesList = roles.join(' ou ');
      decorators.push(
        ApiResponse({
          status: 403,
          description: `Perfil sem permissão (apenas ${rolesList})`,
        }) as MethodDecorator,
      );
    }
  }

  if (hasBody && !overriddenStatuses.has(400)) {
    decorators.push(ApiResponse(DEFAULT_ERRORS.badRequest) as MethodDecorator);
  }

  if (hasParams && !overriddenStatuses.has(404)) {
    decorators.push(ApiResponse(DEFAULT_ERRORS.notFound) as MethodDecorator);
  }

  for (const error of errors) {
    decorators.push(ApiResponse(error) as MethodDecorator);
  }

  return applyDecorators(...decorators);
};
