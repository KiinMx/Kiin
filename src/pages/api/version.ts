import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

interface ExcelFileInfo {
    filename: string;
    label: string;
    date: Date;
    version: number;
    fullPath: string;
}

/**
 * Returns a version string for the given faculty.
 * - "matematicas": reads the latest .xlsx filename date (existing logic)
 * - "psicologia": reads the mtime of the latest *psicologia*.csv file
 */
async function getVersionForFaculty(faculty: string): Promise<string> {
    if (faculty === "psicologia") {
        return getPsicologiaVersion();
    }
    return getLatestExcelFileDate();
}

function getPsicologiaVersion(): string {
    try {
        const dataDir = path.join(process.cwd(), "public", "data");
        const files = fs.readdirSync(dataDir).filter(
            f => f.toLowerCase().includes("psicologia") && f.toLowerCase().endsWith(".csv")
        );
        if (files.length === 0) return "psic-default";
        const sorted = files.sort((a, b) => {
            const statA = fs.statSync(path.join(dataDir, a)).mtimeMs;
            const statB = fs.statSync(path.join(dataDir, b)).mtimeMs;
            return statB - statA;
        });
        const mtime = fs.statSync(path.join(dataDir, sorted[0])).mtime;
        return `psic-${mtime.toISOString().slice(0, 10)}`;
    } catch {
        return "psic-default";
    }
}

/**
 * Obtiene la fecha del archivo Excel más reciente seleccionado
 */
async function getLatestExcelFileDate(): Promise<string> {
    try {
        const dataDir = path.join(process.cwd(), 'public', 'data');

        // Leer todos los archivos en la carpeta public/data
        const files = fs.readdirSync(dataDir);

        // Filtrar solo archivos Excel (.xlsx, .xls)
        const excelFiles = files.filter(file =>
            file.endsWith('.xlsx') || file.endsWith('.xls')
        );

        if (excelFiles.length === 0) {
            return "20.05.2025"; // Fecha por defecto si no hay archivos
        }

        // Extraer información de cada archivo Excel
        const excelFilesWithDates: ExcelFileInfo[] = [];

        for (const filename of excelFiles) {
            const fullPath = path.join(dataDir, filename);

            // Parsear el archivo usando el mismo formato que CoursesModelDAO
            const fileInfo = parseExcelFileName(filename, fullPath);

            if (fileInfo) {
                excelFilesWithDates.push(fileInfo);
            }
        }

        if (excelFilesWithDates.length === 0) {
            return "20.05.2025"; // Fecha por defecto si no hay archivos válidos
        }

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

        // Formatear la fecha como DD.MM.YYYY
        const day = latestFile.date.getDate().toString().padStart(2, '0');
        const month = (latestFile.date.getMonth() + 1).toString().padStart(2, '0');
        const year = latestFile.date.getFullYear();

        // Incluir la versión si existe (diferente de 0)
        const dateString = `${day}.${month}.${year}`;
        return latestFile.version > 0 ? `${dateString}_${latestFile.version}` : dateString;

    } catch (error) {
        console.error('Error getting latest Excel file date:', error);
        return "20.05.2025"; // Fecha por defecto en caso de error
    }
}

/**
 * Parsea el nombre del archivo Excel según el formato: data_label_DD.MM.YYYY[_version].xlsx
 */
function parseExcelFileName(filename: string, fullPath: string): ExcelFileInfo | null {
    // Remover la extensión (.xlsx, .xls)
    const nameWithoutExt = filename.replace(/\.(xlsx|xls)$/i, '');

    // Patrón para: data_label_DD.MM.YYYY[_version]
    const pattern = /^data_([^_]+(?:_[^_]+)*)_(\d{1,2})\.(\d{1,2})\.(\d{4})(?:_(\d+))?$/;

    const match = nameWithoutExt.match(pattern);

    if (!match) {
        return null;
    }

    try {
        const label = match[1];
        const day = parseInt(match[2]);
        const month = parseInt(match[3]);
        const year = parseInt(match[4]);
        const version = match[5] ? parseInt(match[5]) : 0;

        // Validar fecha
        if (day < 1 || day > 31 || month < 1 || month > 12) {
            return null;
        }

        const date = new Date(year, month - 1, day);

        return {
            filename,
            label,
            date,
            version,
            fullPath
        };

    } catch {
        return null;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const faculty = (req.query.faculty as string) ?? "matematicas";
    const versionDate = await getVersionForFaculty(faculty);
    const currentVersion = `1.4.2_${faculty}_${versionDate}`;
    return res.status(200).json(currentVersion);
}
