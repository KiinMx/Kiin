import { CourseCSV } from "./CourseModel";

/**
 * Maps a raw row from the Fac_B (Psicología) CSV format to the normalized CourseCSV DTO.
 *
 * Fac_B columns:
 *   MODALIDAD, ASIGNATURAS, CREDITOS, GRUPO, SALA, DOCENTE, DINAMICA, NOTAS,
 *   LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO
 *
 * Missing fields handled via mocks/defaults for the MVP:
 *   PE      → "LIC_PSIC"
 *   Semestre→ derived from NOTAS prerequisite count (0 antecedentes=1, 1=3, 2=5, else=1)
 *   Modelo  → "2022"
 *   Tipo    → from MODALIDAD column (OBLIGATORIA|OPTATIVA)
 *   Horas_a_la_semana → counted from non-empty day columns * 2
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPsicologiaRowToCourseCSV(raw: any): CourseCSV {
    const asignatura: string = (raw["ASIGNATURAS"] ?? raw["Asignaturas"] ?? "").trim();
    const creditos: string = (raw["CREDITOS"] ?? raw["Creditos"] ?? "0").trim();
    const grupoLetter: string = (raw["GRUPO"] ?? raw["Grupo"] ?? "A").trim();
    const sala: string = (raw["SALA"] ?? raw["Sala"] ?? "").trim();
    const docente: string = (raw["DOCENTE"] ?? raw["Docente"] ?? "").trim();
    const modalidad: string = (raw["MODALIDAD"] ?? raw["Modalidad"] ?? "").trim();
    const notas: string = (raw["NOTAS"] ?? raw["Notas"] ?? "").trim();

    const lunes: string = normalizeTimeRange(raw["LUNES"] ?? raw["Lunes"] ?? "");
    const martes: string = normalizeTimeRange(raw["MARTES"] ?? raw["Martes"] ?? "");
    const miercoles: string = normalizeTimeRange(raw["MIERCOLES"] ?? raw["Miercoles"] ?? raw["MIÉRCOLES"] ?? "");
    const jueves: string = normalizeTimeRange(raw["JUEVES"] ?? raw["Jueves"] ?? "");
    const viernes: string = normalizeTimeRange(raw["VIERNES"] ?? raw["Viernes"] ?? "");
    const sabado: string = normalizeTimeRange(raw["SABADO"] ?? raw["Sabado"] ?? raw["SÁBADO"] ?? "");

    const grupo: string = String(letterGroupToNumber(grupoLetter));
    const { nombres, apellidos } = splitDocente(docente);
    const semestre: string = String(deriveSemestre(notas, asignatura));
    const horasSemanales: string = String(calculateHorasSemana([lunes, martes, miercoles, jueves, viernes, sabado]));

    return {
        Periodo: "",
        Tipo: modalidad,
        Asignatura: asignatura,
        GRUPO: grupo,
        PE: "LIC_PSIC",
        Semestre: semestre,
        Horas_a_la_semana: horasSemanales,
        Modalidad: modalidad,
        Hr_Pres: "",
        Hr_Pres2: "",
        Hr_N_P: "",
        Creditos: creditos,
        Modelo: "2022",
        Nombres: nombres,
        Apellidos: apellidos,
        Cupo: "",
        LIC_MEFI: "",
        LCC_MEFI: "",
        LIS_MEFI: "",
        LA_MEFI: "",
        LEM_MEFI: "",
        LM: "",
        Lunes: lunes,
        Aula1: sala,
        Martes: martes,
        Aula2: sala,
        Miercoles: miercoles,
        Aula3: sala,
        Jueves: jueves,
        Aula4: sala,
        Viernes: viernes,
        Aula5: sala,
        Sabado: sabado,
        Aula6: sala,
    };
}

/** Converts letter group to numeric group: A→1, B→2, C→3, D→4, E→5, X→6, else→1 */
function letterGroupToNumber(letter: string): number {
    const map: Record<string, number> = {
        A: 1, B: 2, C: 3, D: 4, E: 5,
        X: 6, F: 7, G: 8, H: 9, I: 10,
    };
    return map[letter.toUpperCase()] ?? 1;
}

/**
 * Splits a combined DOCENTE string (e.g. "MARIO S.", "MA. JOSE C.") into
 * Nombres (everything before the last token) and Apellidos (last token).
 */
function splitDocente(docente: string): { nombres: string; apellidos: string } {
    const parts = docente.trim().split(/\s+/);
    if (parts.length === 1) return { nombres: parts[0], apellidos: "" };
    const apellidos = parts[parts.length - 1];
    const nombres = parts.slice(0, parts.length - 1).join(" ");
    return { nombres, apellidos };
}

/**
 * Derives a mock semester from the NOTAS prerequisite description.
 * Uses the subject name as a hash seed to spread subjects within each
 * prerequisite tier across multiple semesters, ensuring all 9 semesters have subjects:
 *   0 antecedentes → semesters 1-2   (introductory/electives)
 *   1 antecedente  → semesters 3-7   (intermediate)
 *   2 antecedentes → semesters 7-8   (advanced)
 *   3+ antecedentes / special → semester 9 (capstone)
 */
function deriveSemestre(notas: string, asignatura: string): number {
    const h = simpleHash(asignatura);
    const lower = notas.toLowerCase();

    if (lower.includes("3 antecedente") || lower.includes("4 antecedente") || /\d{3,}\s+cr/.test(lower)) {
        return 9;
    }
    if (lower.includes("2 antecedente")) {
        return 7 + (h % 2); // 7 or 8
    }
    if (lower.includes("1 antecedente")) {
        return 3 + (h % 5); // 3, 4, 5, 6, or 7
    }
    return 1 + (h % 2); // 1 or 2
}

/** Deterministic hash of a string used to distribute subjects across semesters. */
function simpleHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
}

/**
 * Normalizes time range strings like "8:00- 10:00" or "8:00 -10:00" to "8:00-10:00".
 */
function normalizeTimeRange(value: string): string {
    if (!value) return "";
    return value
        .trim()
        .replace(/\s*-\s*/g, "-")
        .replace(/\s+/g, " ");
}

/**
 * Estimates weekly hours as the number of non-empty day slots multiplied by 2h each.
 */
function calculateHorasSemana(days: string[]): number {
    const activeDays = days.filter(d => d.trim() !== "").length;
    return activeDays * 2;
}
