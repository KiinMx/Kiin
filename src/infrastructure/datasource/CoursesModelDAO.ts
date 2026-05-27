import csvParser from "csv-parser";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { CourseCSV } from "@/infrastructure/models/CourseModel";

export class CoursesModelDao {
  private static _results: CourseCSV[] = [];

  static async getCourses(): Promise<CourseCSV[]> {
    if (this._results.length > 0) {
      return this._results;
    }

    // Buscar el archivo Excel más reciente en la carpeta public
    this._results = await readLatestExcelFile();

    return this._results;
  }

  // Método para limpiar el cache (útil para pruebas o recargas)
  static clearCache(): void {
    this._results = [];
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromRawToCourseCSV = (raw: any): CourseCSV => {

  const periodoKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'periodo'
  );
  const tipoKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'tipo'
  );
  const asignaturaKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'asignatura'
  );
  const grupoKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'grupo'
  );
  const semestreKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'semestre'
  );
  const peKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'pe'
  );
  const horasSemanaKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'horas_a_la_semana'
  );
  const modalidadKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'modalidad'
  );
  const modeloKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'modelo'
  );
  const nombresKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'nombres'
  );
  const apellidosKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'apellidos'
  );
  const lunesKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'lunes'
  );
  const martesKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'martes'
  );
  const miercolesKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^\wáéíóúüñ]/g, '').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i') === 'miercoles'
  );
  const juevesKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'jueves'
  );
  const viernesKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^a-z]/g, '') === 'viernes'
  );
  const creditosKey = Object.keys(raw).find(
    key => key.trim().toLowerCase().replace(/[^\wáéíóúüñ]/g, '').replace(/[éè]/g, 'e') === 'creditos'
  );

  const aulaKeys = Object.keys(raw).filter(
    key => key.trim().toLowerCase().startsWith('aula')
  );
  const aula1Key = aulaKeys[0];
  const aula2Key = aulaKeys[1];
  const aula3Key = aulaKeys[2];
  const aula4Key = aulaKeys[3];
  const aula5Key = aulaKeys[4];


  return {
    Periodo: raw[periodoKey as keyof typeof raw] || '',
    Tipo: raw[tipoKey as keyof typeof raw] || '',
    Asignatura: raw[asignaturaKey as keyof typeof raw] || '',
    GRUPO: raw[grupoKey as keyof typeof raw] || '',
    PE: raw[peKey as keyof typeof raw] || '',
    Semestre: raw[semestreKey as keyof typeof raw] || '',
    Horas_a_la_semana: raw[horasSemanaKey as keyof typeof raw] || '',
    Modalidad: raw[modalidadKey as keyof typeof raw] || '',

    Modelo: raw[modeloKey as keyof typeof raw] || '',
    Nombres: raw[nombresKey as keyof typeof raw] || '',
    Apellidos: raw[apellidosKey as keyof typeof raw] || '',


    Lunes: raw[lunesKey as keyof typeof raw] || '',
    Aula1: raw[aula1Key as keyof typeof raw] || '',
    Martes: raw[martesKey as keyof typeof raw] || '',
    Aula2: raw[aula2Key as keyof typeof raw] || '',
    Miercoles: raw[miercolesKey as keyof typeof raw] || '',
    Aula3: raw[aula3Key as keyof typeof raw] || '',
    Jueves: raw[juevesKey as keyof typeof raw] || '',
    Aula4: raw[aula4Key as keyof typeof raw] || '',
    Viernes: raw[viernesKey as keyof typeof raw] || '',
    Aula5: raw[aula5Key as keyof typeof raw] || '',

    Hr_Pres: "",
    Hr_Pres2: "",
    Hr_N_P: "",
    Creditos: raw[creditosKey as keyof typeof raw] || '',

    Cupo: "",
    LIC_MEFI: "",
    LCC_MEFI: "",
    LIS_MEFI: "",
    LA_MEFI: "",
    LEM_MEFI: "",
    LM: "",
  }
}


interface ExcelFileInfo {
  filename: string;
  label: string;
  date: Date;
  version: number; // Número de versión (_1, _2, etc.) 0 para archivos sin número
  fullPath: string;
}

/**
 * Lee el archivo Excel más reciente de la carpeta public/data
 */
const readLatestExcelFile = async (): Promise<CourseCSV[]> => {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    // Leer todos los archivos en la carpeta public/data
    const files = fs.readdirSync(dataDir);

    // Filtrar solo archivos Excel (.xlsx, .xls)
    const excelFiles = files.filter(file =>
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );

    if (excelFiles.length === 0) {
      throw new Error('No Excel files found in public/data directory');
    }

    // Extraer información de cada archivo Excel
    const excelFilesWithDates: ExcelFileInfo[] = [];

    for (const filename of excelFiles) {
      const fullPath = path.join(dataDir, filename);

      // Parsear el archivo usando el nuevo formato
      const fileInfo = parseExcelFileName(filename, fullPath);

      if (fileInfo) {
        excelFilesWithDates.push(fileInfo);
      }
    }

    if (excelFilesWithDates.length === 0) {
      throw new Error('No valid Excel files found with the expected format: data_label_DD.MM.YYYY[_version].xlsx');
    }

    console.log("archivos encontrados: \n", excelFilesWithDates);

    // Ordenar por fecha (más reciente primero) y luego por versión (más alta primero)
    excelFilesWithDates.sort((a, b) => {
      const dateA = a.date.getTime();
      const dateB = b.date.getTime();

      // Si las fechas son diferentes, usar esa diferencia
      if (dateA !== dateB) {
        return dateB - dateA; // Más reciente primero
      }

      // Si las fechas son iguales, comparar por versión (más alta primero)
      return b.version - a.version;
    });

    const latestFile = excelFilesWithDates[0];

    console.log(`Loading latest Excel file: ${latestFile.filename}`);
    console.log(`  - Label: ${latestFile.label}`);
    console.log(`  - Date: ${latestFile.date.toISOString()}`);
    console.log(`  - Version: ${latestFile.version}`);

    // Leer el contenido del archivo Excel más reciente usando exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(latestFile.fullPath);

    // Obtener la primera hoja del Excel
    const worksheet = workbook.worksheets[0];

    // Convertir a CSV manualmente
    const csvData = worksheetToCSV(worksheet);

    // Procesar el CSV usando la lógica existente
    return await processCSVData(csvData);

  } catch (error) {
    console.error('Error reading latest Excel file:', error);
    throw error;
  }
};

/**
 * Convierte una hoja de Excel (exceljs worksheet) a formato CSV
 */
const worksheetToCSV = (worksheet: ExcelJS.Worksheet): string => {
  const rows: string[] = [];

  worksheet.eachRow((row) => {
    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      let value = '';
      if (cell.value !== null && cell.value !== undefined) {
        // Handle different cell types
        if (typeof cell.value === 'object' && 'text' in cell.value) {
          value = cell.value.text;
        } else if (cell.value instanceof Date) {
          value = cell.value.toISOString();
        } else {
          value = String(cell.value);
        }
      }
      // Escape quotes and wrap in quotes if necessary
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      values.push(value);
    });
    rows.push(values.join(','));
  });

  return rows.join('\n');
};

/**
 * Procesa los datos CSV convertidos desde Excel
 */
const processCSVData = async (csvData: string): Promise<CourseCSV[]> => {
  return new Promise((resolve, reject) => {
    const results: CourseCSV[] = [];

    // Crear un stream legible desde el string CSV
    const readableStream = Readable.from(csvData);

    readableStream
      .pipe(csvParser())
      .on('data', (data) => {
        results.push(fromRawToCourseCSV(data));
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Parsea el nombre del archivo Excel según el formato: data_label_DD.MM.YYYY[_version].xlsx
 * @param filename - Nombre del archivo
 * @param fullPath - Ruta completa del archivo
 * @returns ExcelFileInfo o null si no coincide con el formato
 */
function parseExcelFileName(filename: string, fullPath: string): ExcelFileInfo | null {
  // Remover la extensión (.xlsx, .xls)
  const nameWithoutExt = filename.replace(/\.(xlsx|xls)$/i, '');

  // Patrón para: data_label_DD.MM.YYYY[_version]
  // Ejemplos: data_verano_26.06.2025, data_verano_26.06.2025_1, data_agosto-diciembre_01.07.2025_2
  const pattern = /^data_([^_]+(?:_[^_]+)*)_(\d{1,2})\.(\d{1,2})\.(\d{4})(?:_(\d+))?$/;

  const match = nameWithoutExt.match(pattern);

  if (!match) {
    console.warn(`File ${filename} does not match expected format: data_label_DD.MM.YYYY[_version].xlsx`);
    return null;
  }

  try {
    const label = match[1];
    const day = parseInt(match[2]);
    const month = parseInt(match[3]);
    const year = parseInt(match[4]);
    const version = match[5] ? parseInt(match[5]) : 0; // 0 si no hay versión

    // Validar fecha
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      console.warn(`Invalid date in filename: ${filename}`);
      return null;
    }

    const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado

    return {
      filename,
      label,
      date,
      version,
      fullPath
    };

  } catch (error) {
    console.warn(`Could not parse date from filename: ${filename}`, error);
    return null;
  }
}