import { Module } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditRepository],
  exports: [AuditRepository],
})
export class AuditRepositoriesModule {}
