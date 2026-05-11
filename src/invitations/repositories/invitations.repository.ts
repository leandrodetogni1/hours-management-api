import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInvitationDto } from '../dto/CreateInvitationDto';
import {
  CreateInvitationResponseDto,
  InvitationResponseDto,
} from '../dto/InvitationResponseDto';
import { InvitationMapper } from '../mappers/invitation.mapper';

const invitationInclude = {
  role: true,
  inviter: { select: { id: true, email: true } },
} as const;

@Injectable()
export class InvitationsRepository {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<InvitationResponseDto[]> {
    const invitations = await this.prisma.invitations.findMany({
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map((i) => InvitationMapper.toResponseDto(i));
  }

  async createInvitation(
    dto: CreateInvitationDto,
    createdBy: string,
  ): Promise<CreateInvitationResponseDto> {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com esse email',
      );
    }

    const role = await this.prisma.roles.findUnique({
      where: { name: dto.role },
      select: { id: true },
    });
    if (!role) {
      throw new BadRequestException(`Role "${dto.role}" não existe no sistema`);
    }

    try {
      const created = await this.prisma.invitations.create({
        data: {
          email: dto.email,
          roleId: role.id,
          createdBy,
        },
        include: invitationInclude,
      });

      return {
        message: 'Convite criado com sucesso',
        invitation: InvitationMapper.toResponseDto(created),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um convite para esse email');
      }
      throw error;
    }
  }

  async deleteInvitation(id: string): Promise<void> {
    const invitation = await this.prisma.invitations.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation with id ${id} not found`);
    }
    await this.prisma.invitations.delete({ where: { id } });
  }
}
