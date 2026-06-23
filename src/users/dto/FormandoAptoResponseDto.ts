import { ApiProperty } from '@nestjs/swagger';

export class FormandoAptoItemDto {
  @ApiProperty() id: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true }) matricula: string | null;
  @ApiProperty({ nullable: true }) course: string | null;
  @ApiProperty({ nullable: true }) curriculumYear: string | null;
  @ApiProperty() hoursEnsino: number;
  @ApiProperty() hoursPesquisa: number;
  @ApiProperty() hoursExtensao: number;
  @ApiProperty() hoursComplementar: number;
  @ApiProperty() hoursLivre: number;
  @ApiProperty() totalHoursApproved: number;
}

export class FormandosAptosResponseDto {
  @ApiProperty({ type: [FormandoAptoItemDto] }) items: FormandoAptoItemDto[];
  @ApiProperty() total: number;
}
