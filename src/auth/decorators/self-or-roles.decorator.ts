import { SetMetadata } from '@nestjs/common';

export const SELF_OR_ROLES_KEY = 'selfOrRoles';

export interface SelfOrRolesOptions {
  roles: string[];
  param: string;
}

export const SelfOrRoles = (options: SelfOrRolesOptions) =>
  SetMetadata(SELF_OR_ROLES_KEY, options);
