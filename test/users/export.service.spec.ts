import ExcelJS from 'exceljs';
import { ExportService } from '../../src/users/services/export.service';
import { FormandoAptoItemDto } from '../../src/users/dto/FormandoAptoResponseDto';

function makeItem(
  overrides: Partial<FormandoAptoItemDto> = {},
): FormandoAptoItemDto {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    firstName: 'Victor',
    lastName: 'Santos',
    email: 'victor@ufpel.edu.br',
    matricula: '22101443',
    course: 'ENGENHARIA_DA_COMPUTACAO',
    curriculumYear: 'Y2015',
    hoursEnsino: 186,
    hoursPesquisa: 0,
    hoursExtensao: 10,
    hoursComplementar: 196,
    hoursLivre: 0,
    totalHoursApproved: 196,
    ...overrides,
  };
}

async function loadSheet(buffer: Buffer): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.getWorksheet('Formandos Aptos');
  if (!sheet) throw new Error('planilha não encontrada');
  return sheet;
}

describe('ExportService.generateXlsx', () => {
  const service = new ExportService();

  test('exporta o curso com nome legível em vez do enum', async () => {
    const buffer = await service.generateXlsx([
      makeItem({ course: 'ENGENHARIA_DA_COMPUTACAO' }),
      makeItem({ course: 'CIENCIA_DA_COMPUTACAO' }),
    ]);

    const sheet = await loadSheet(buffer);

    expect(sheet.getCell('D2').value).toBe('Engenharia de Computação');
    expect(sheet.getCell('D3').value).toBe('Ciência da Computação');
  });

  test('deixa o curso em branco quando não informado', async () => {
    const buffer = await service.generateXlsx([makeItem({ course: null })]);

    const sheet = await loadSheet(buffer);

    expect(sheet.getCell('D2').value ?? '').toBe('');
  });
});
