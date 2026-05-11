import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export const INVITABLE_ROLES = ['admin', 'reviewer'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export class CreateInvitationDto {
  @ApiProperty({
    example: 'professor@ufpel.edu.br',
    description: 'Email do convidado',
  })
  @Expose()
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({
    example: 'admin',
    enum: INVITABLE_ROLES,
    description: 'Role que o usuário receberá ao se cadastrar via Google',
  })
  @Expose()
  @IsString({ message: 'Role deve ser uma string' })
  @IsIn(INVITABLE_ROLES as unknown as string[], {
    message: 'Role inválida. Use: admin ou reviewer',
  })
  role: InvitableRole;
}
