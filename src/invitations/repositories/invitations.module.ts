import { Module } from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InvitationsRepository],
  exports: [InvitationsRepository],
})
export class InvitationsRepositoriesModule {}
