import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsServicesModule } from './services/invitations.module';
import { InvitationsRepositoriesModule } from './repositories/invitations.module';

@Module({
  imports: [InvitationsServicesModule, InvitationsRepositoriesModule],
  controllers: [InvitationsController],
  exports: [InvitationsRepositoriesModule],
})
export class InvitationsModule {}
