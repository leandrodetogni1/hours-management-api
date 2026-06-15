import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditRepositoriesModule } from '../repositories/audit.module';

@Module({
  imports: [AuditRepositoriesModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditServicesModule {}
