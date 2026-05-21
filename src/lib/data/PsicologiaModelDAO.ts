import csvParser from "csv-parser";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { CourseCSV } from "./CourseModel";
import { mapPsicologiaRowToCourseCSV } from "./PsicologiaCsvMapper";

/**
 * DAO for Fac_B (Psicología) data.
 * Reads the latest CSV file matching "*psicologia*" from public/data/,
 * parses it with csv-parser, and maps each row via PsicologiaCsvMapper
 * to the normalized CourseCSV DTO.
 */
export class PsicologiaModelDAO {
    private static _results: CourseCSV[] = [];
    private static _version: string = "";

    static async getCourses(): Promise<CourseCSV[]> {
        if (this._results.length > 0) {
            return this._results;
        }
        this._results = await readLatestPsicologiaCSV();
        return this._results;
    }

    static getVersion(): string {
        return this._version;
    }

    static clearCache(): void {
        this._results = [];
        this._version = "";
    }
}

async function readLatestPsicologiaCSV(): Promise<CourseCSV[]> {
    const dataDir = path.join(process.cwd(), "public", "data");
    const files = fs.readdirSync(dataDir);

    const csvFiles = files.filter(
        f => f.toLowerCase().includes("psicologia") && f.toLowerCase().endsWith(".csv")
    );

    if (csvFiles.length === 0) {
        throw new Error(
            'No CSV file found for Psicología in public/data. Expected a file containing "psicologia" in its name.'
        );
    }

    // Pick the most recently modified file when there are several
    const sorted = csvFiles.sort((a, b) => {
        const statA = fs.statSync(path.join(dataDir, a)).mtimeMs;
        const statB = fs.statSync(path.join(dataDir, b)).mtimeMs;
        return statB - statA;
    });

    const latestFile = sorted[0];
    const fullPath = path.join(dataDir, latestFile);

    // Store version as mtime-based date string (matches pattern used by version API)
    const mtime = fs.statSync(fullPath).mtime;
    PsicologiaModelDAO["_version"] = `psic-${mtime.toISOString().slice(0, 10)}`;

    console.log(`Loading Psicología CSV: ${latestFile}`);

    const raw = fs.readFileSync(fullPath);
    return await parseCSVBuffer(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCSVBuffer(buffer: Buffer): Promise<CourseCSV[]> {
    return new Promise((resolve, reject) => {
        const results: CourseCSV[] = [];
        const stream = Readable.from(buffer.toString("utf8"));

        stream
            .pipe(
                csvParser({
                    // Some cells contain commas inside quotes – csv-parser handles this by default
                    skipComments: true,
                    skipLines: 1,  // Row 1 is a title ("PROPUESTA PERIODO..."), row 2 is the real header
                    mapHeaders: ({ header }) => header.trim(),
                })
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on("data", (row: any) => {
                // Skip header-like rows or empty rows
                const asignatura: string = (row["ASIGNATURAS"] ?? row["Asignaturas"] ?? "").trim();
                if (!asignatura || asignatura.toLowerCase() === "asignaturas") return;

                try {
                    const mapped = mapPsicologiaRowToCourseCSV(row);
                    // Only include rows that have at least one scheduled session
                    const hasSessions =
                        mapped.Lunes || mapped.Martes || mapped.Miercoles ||
                        mapped.Jueves || mapped.Viernes || mapped.Sabado;
                    if (hasSessions) {
                        results.push(mapped);
                    }
                } catch {
                    // Skip malformed rows silently
                }
            })
            .on("end", () => resolve(results))
            .on("error", (err: Error) => reject(err));
    });
}
