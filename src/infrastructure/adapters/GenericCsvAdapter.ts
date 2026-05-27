import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { School } from "@/domain/entities/School";
import { CanonicalCourseCSV } from "@/infrastructure/models/CanonicalCourseCSV";
import { buildCatalogFromRows } from "@/infrastructure/adapters/helpers/catalogBuilder";
import csvParser from "csv-parser";
import fs from "fs";
import path from "path";

export class GenericCsvAdapter implements SchoolDataAdapter {
  private cachedCatalog: AcademicOfferDto | null = null;

  constructor(
    private readonly school: School,
    private readonly dataDir: string
  ) {}

  async fetchCatalog(): Promise<AcademicOfferDto> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }

    const rows = await this.readCsvFiles();
    this.cachedCatalog = buildCatalogFromRows(rows);
    return this.cachedCatalog;
  }

  clearCache(): void {
    this.cachedCatalog = null;
  }

  private async readCsvFiles(): Promise<CanonicalCourseCSV[]> {
    const dir = path.join(process.cwd(), this.dataDir, this.school.slug);

    if (!fs.existsSync(dir)) {
      throw new Error(`Data directory not found for school "${this.school.slug}": ${dir}`);
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
    if (files.length === 0) {
      throw new Error(`No CSV files found in ${dir}`);
    }

    const sortedFiles = files
      .filter(f => {
        const match = f.match(/_(\d{2})\.(\d{2})\.(\d{4})(?:_(\d+))?\.csv$/);
        return match !== null;
      })
      .sort((a, b) => {
        const getDate = (fn: string): { date: Date; version: number } => {
          const m = fn.match(/_(\d{2})\.(\d{2})\.(\d{4})(?:_(\d+))?\.csv$/);
          if (!m) return { date: new Date(0), version: 0 };
          const [, d, mo, y, ver] = m;
          return { date: new Date(+y, +mo - 1, +d), version: ver ? +ver : 0 };
        };
        const aInfo = getDate(a);
        const bInfo = getDate(b);
        const dateDiff = bInfo.date.getTime() - aInfo.date.getTime();
        if (dateDiff !== 0) return dateDiff;
        return bInfo.version - aInfo.version;
      });

    const latestFile = sortedFiles[0] || files[0];
    const filePath = path.join(dir, latestFile);

    return this.parseCsvFile(filePath);
  }

  private parseCsvFile(filePath: string): Promise<CanonicalCourseCSV[]> {
    return new Promise((resolve, reject) => {
      const results: CanonicalCourseCSV[] = [];
      const stream = fs.createReadStream(filePath);
      stream
        .pipe(csvParser())
        .on('data', (data) => {
          results.push(this.normalizeRow(data));
        })
        .on('end', () => resolve(results))
        .on('error', (error: Error) => reject(error));
    });
  }

  private normalizeRow(raw: Record<string, string>): CanonicalCourseCSV {
    const find = (keys: string[], fallback: string = ''): string => {
      for (const key of keys) {
        const found = Object.keys(raw).find(k => k.trim().toLowerCase().replace(/[^\wáéíóúüñ]/g, '') === key);
        if (found && raw[found] !== undefined) return raw[found];
      }
      return fallback;
    };

    const aulaKeys = Object.keys(raw).filter(k => k.trim().toLowerCase().startsWith('aula'));

    return {
      Periodo: find(['periodo']),
      Tipo: find(['tipo']),
      Asignatura: find(['asignatura']),
      GRUPO: find(['grupo']),
      PE: find(['pe']),
      Semestre: find(['semestre']),
      Horas_a_la_semana: find(['horas_a_la_semana', 'horasalasemana', 'horassemana']),
      Modalidad: find(['modalidad']),
      Nombres: find(['nombres']),
      Apellidos: find(['apellidos']),
      Creditos: find(['creditos']),
      Modelo: find(['modelo']),
      Lunes: find(['lunes']),
      Aula1: raw[aulaKeys[0]] || '',
      Martes: find(['martes']),
      Aula2: raw[aulaKeys[1]] || '',
      Miercoles: find(['miercoles']),
      Aula3: raw[aulaKeys[2]] || '',
      Jueves: find(['jueves']),
      Aula4: raw[aulaKeys[3]] || '',
      Viernes: find(['viernes']),
      Aula5: raw[aulaKeys[4]] || '',
    };
  }
}
