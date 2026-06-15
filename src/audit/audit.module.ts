import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './audit.controller';
import { AuditServicesModule } from './services/audit.module';
import { AuditRepositoriesModule } from './repositories/audit.module';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [AuditServicesModule, AuditRepositoriesModule],
  controllers: [AuditController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  exports: [AuditServicesModule],
})
export class AuditModule {}
