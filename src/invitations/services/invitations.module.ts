import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsRepositoriesModule } from '../repositories/invitations.module';

@Module({
  imports: [InvitationsRepositoriesModule],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsServicesModule {}
