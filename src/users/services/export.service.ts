import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { FormandoAptoItemDto } from '../dto/FormandoAptoResponseDto.js';

const COURSE_LABELS: Record<string, string> = {
  CIENCIA_DA_COMPUTACAO: 'Ciência da Computação',
  ENGENHARIA_DA_COMPUTACAO: 'Engenharia de Computação',
};

function courseLabel(course: string | null): string {
  if (!course) return '';
  return COURSE_LABELS[course] ?? course;
}

const COLUMNS = [
  { header: 'Nome', key: 'nome', width: 30 },
  { header: 'Matrícula', key: 'matricula', width: 15 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Curso', key: 'curso', width: 25 },
  { header: 'Ensino (h)', key: 'ensino', width: 12 },
  { header: 'Pesquisa (h)', key: 'pesquisa', width: 14 },
  { header: 'Extensão (h)', key: 'extensao', width: 14 },
  { header: 'Complementares (h)', key: 'complementar', width: 20 },
  { header: 'Livres (h)', key: 'livre', width: 12 },
];

@Injectable()
export class ExportService {
  async generateXlsx(items: FormandoAptoItemDto[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Formandos Aptos');

    sheet.columns = COLUMNS;

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const item of items) {
      sheet.addRow({
        nome: `${item.firstName} ${item.lastName}`,
        matricula: item.matricula ?? '',
        email: item.email,
        curso: courseLabel(item.course),
        ensino: item.hoursEnsino,
        pesquisa: item.hoursPesquisa,
        extensao: item.hoursExtensao,
        complementar: item.hoursComplementar,
        livre: item.hoursLivre,
      });
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  generatePdf(items: FormandoAptoItemDto[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        layout: 'landscape',
      });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const now = new Date().toLocaleDateString('pt-BR');
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Formandos Aptos — Atividades Complementares', {
          align: 'center',
        });
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Gerado em: ${now}`, { align: 'center' });
      doc.moveDown();

      const headers = [
        'Nome',
        'Matrícula',
        'Email',
        'Curso',
        'Ensino',
        'Pesquisa',
        'Extensão',
        'Compl.',
        'Livre',
      ];
      const colWidths = [140, 62, 160, 125, 42, 48, 48, 42, 35];
      const rowHeight = 18;
      const startX = 40;

      let x = startX;
      let y = doc.y;

      doc.fontSize(8).font('Helvetica-Bold');
      for (let i = 0; i < headers.length; i++) {
        doc
          .rect(x, y, colWidths[i], rowHeight)
          .fillAndStroke('#1F4E79', '#1F4E79');
        doc.fillColor('white').text(headers[i], x + 3, y + 4, {
          width: colWidths[i] - 6,
          lineBreak: false,
        });
        x += colWidths[i];
      }
      doc.fillColor('black');

      y += rowHeight;
      doc.font('Helvetica').fontSize(7);

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const row = [
          `${item.firstName} ${item.lastName}`,
          item.matricula ?? '',
          item.email,
          courseLabel(item.course),
          String(item.hoursEnsino),
          String(item.hoursPesquisa),
          String(item.hoursExtensao),
          String(item.hoursComplementar),
          String(item.hoursLivre),
        ];

        const bg = idx % 2 === 0 ? '#F0F4F8' : '#FFFFFF';
        x = startX;
        for (let i = 0; i < row.length; i++) {
          doc.rect(x, y, colWidths[i], rowHeight).fillAndStroke(bg, '#CCCCCC');
          doc.fillColor('black').text(row[i], x + 3, y + 4, {
            width: colWidths[i] - 6,
            lineBreak: false,
          });
          x += colWidths[i];
        }
        y += rowHeight;

        if (y > doc.page.height - 60) {
          doc.addPage({ layout: 'landscape' });
          y = 40;
        }
      }

      doc.end();
    });
  }
}
