import { Module } from '@nestjs/common';
import { CurriculaController } from './curricula.controller';
import { CurriculaServiceModule } from './services/curricula.module';

@Module({
  imports: [CurriculaServiceModule],
  controllers: [CurriculaController],
  exports: [CurriculaServiceModule],
})
export class CurriculaModule {}
