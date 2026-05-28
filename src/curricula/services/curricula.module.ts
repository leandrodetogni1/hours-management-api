import { Module } from '@nestjs/common';
import { CurriculaService } from './curricula.service';
import { CurriculaRepositoryModule } from '../repositories/curricula.module';

@Module({
  imports: [CurriculaRepositoryModule],
  providers: [CurriculaService],
  exports: [CurriculaService, CurriculaRepositoryModule],
})
export class CurriculaServiceModule {}
