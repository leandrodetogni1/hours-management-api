import { Module } from '@nestjs/common';
import { CurriculaRepository } from './curricula.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CurriculaRepository],
  exports: [CurriculaRepository],
})
export class CurriculaRepositoryModule {}
