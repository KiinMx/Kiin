import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { CanonicalCourseCSV } from "@/infrastructure/models/CanonicalCourseCSV";
import { buildCatalogFromRows } from "@/infrastructure/adapters/helpers/catalogBuilder";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

interface ExcelFileInfo {
  filename: string;
  date: Date;
  version: number;
  fullPath: string;
}

export class FmatAdapter implements SchoolDataAdapter {
  private cachedCatalog: AcademicOfferDto | null = null;

  constructor(private readonly dataDir: string) {}

  async fetchCatalog(): Promise<AcademicOfferDto> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }

    const rows = await this.readExcelFile();
    this.cachedCatalog = buildCatalogFromRows(rows);
    return this.cachedCatalog;
  }

  clearCache(): void {
    this.cachedCatalog = null;
  }

  private async readExcelFile(): Promise<CanonicalCourseCSV[]> {
    const dataDir = path.join(process.cwd(), this.dataDir);

    if (!fs.existsSync(dataDir)) {
      throw new Error(`Data directory not found: ${dataDir}`);
    }

    const files = fs.readdirSync(dataDir);
    const excelFiles = files
      .filter(f => f.endsWith(".xlsx") || f.endsWith(".xls"))
      .map(f => this.parseExcelFileName(f, path.join(dataDir, f)))
      .filter((info): info is ExcelFileInfo => info !== null)
      .sort((a, b) => {
        const dateDiff = b.date.getTime() - a.date.getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.version - a.version;
      });

    if (excelFiles.length === 0) {
      throw new Error(`No Excel files found in ${dataDir}`);
    }

    return this.parseExcelFile(excelFiles[0].fullPath);
  }

  private parseExcelFileName(filename: string, fullPath: string): ExcelFileInfo | null {
    const nameWithoutExt = filename.replace(/\.(xlsx|xls)$/i, "");
    const pattern = /^data_.+_(\d{1,2})\.(\d{1,2})\.(\d{4})(?:_(\d+))?$/;
    const match = nameWithoutExt.match(pattern);

    if (!match) return null;

    try {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      const version = match[4] ? parseInt(match[4]) : 0;

      if (day < 1 || day > 31 || month < 1 || month > 12) return null;

      return { filename, date: new Date(year, month - 1, day), version, fullPath };
    } catch {
      return null;
    }
  }

  private async parseExcelFile(filePath: string): Promise<CanonicalCourseCSV[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheets = workbook.worksheets;
    if (sheets.length === 0) {
      throw new Error(`No worksheets found in Excel file: ${filePath}`);
    }
    const worksheet = sheets[0];

    const rows: CanonicalCourseCSV[] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as unknown[];
      if (rowNumber === 1) {
        headers = (values.slice(1) as string[]).map(h => String(h ?? ""));
        return;
      }

      const raw: Record<string, string> = {};
      headers.forEach((header, index) => {
        const val = values[index + 1];
        raw[header] = val !== undefined && val !== null ? String(val) : "";
      });

      const hasData = Object.values(raw).some(v => v.trim() !== "");
      if (hasData) {
        rows.push(this.normalizeRow(raw));
      }
    });

    return rows;
  }

  private normalizeRow(raw: Record<string, string>): CanonicalCourseCSV {
    const normalize = (s: string) =>
      s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]/g, "");

    const find = (keys: string[], fallback: string = ""): string => {
      for (const key of keys) {
        const found = Object.keys(raw).find(
          k => normalize(k) === normalize(key)
        );
        if (found && raw[found] !== undefined) return raw[found];
      }
      return fallback;
    };

    const aulaKeys = Object.keys(raw).filter(k => normalize(k).startsWith("aula"));

    return {
      Periodo: find(["periodo"]),
      Tipo: find(["tipo"]),
      Asignatura: find(["asignatura"]),
      GRUPO: find(["grupo"]),
      PE: find(["pe"]),
      Semestre: find(["semestre"]),
      Horas_a_la_semana: find(["horas_a_la_semana", "horasalasemana", "horassemana"]),
      Modalidad: find(["modalidad"]),
      Nombres: find(["nombres"]),
      Apellidos: find(["apellidos"]),
      Creditos: find(["creditos"]),
      Modelo: find(["modelo"]),
      Lunes: find(["lunes"]),
      Aula1: raw[aulaKeys[0]] || "",
      Martes: find(["martes"]),
      Aula2: raw[aulaKeys[1]] || "",
      Miercoles: find(["miercoles"]),
      Aula3: raw[aulaKeys[2]] || "",
      Jueves: find(["jueves"]),
      Aula4: raw[aulaKeys[3]] || "",
      Viernes: find(["viernes"]),
      Aula5: raw[aulaKeys[4]] || "",
    };
  }
}
