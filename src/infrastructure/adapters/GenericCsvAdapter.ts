import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { School } from "@/domain/entities/School";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";
import { Session } from "@/domain/entities/Session";
import { CanonicalCourseCSV } from "@/infrastructure/models/CanonicalCourseCSV";
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
    const degrees = this.buildDegrees(rows);
    const subjects = this.buildSubjects(rows);
    const professors = this.buildProfessors(rows);
    this.attachRelations(rows, degrees, subjects, professors);
    const courses = this.buildCourses(rows, subjects, professors);

    this.cachedCatalog = { degrees, subjects, professors, courses };
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

  private buildDegrees(rows: CanonicalCourseCSV[]): Degree[] {
    const degrees: Degree[] = [];
    const degreeByName = new Map<string, Degree>();

    for (const row of rows) {
      for (const degreeName of this.splitDegreeNames(row.PE)) {
        const normalizedName = this.normalizeName(degreeName);
        if (degreeByName.has(normalizedName)) continue;
        const degree = new Degree(degrees.length + 1, normalizedName);
        degrees.push(degree);
        degreeByName.set(normalizedName, degree);
      }
    }
    return degrees;
  }

  private buildSubjects(rows: CanonicalCourseCSV[]): Subject[] {
    const subjects: Subject[] = [];
    const subjectByKey = new Map<string, Subject>();

    for (const row of rows) {
      const key = this.subjectKey(row);
      if (subjectByKey.has(key)) continue;
      const semesters = row.Semestre.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      const subject = new Subject(
        subjects.length + 1,
        this.normalizeName(row.Asignatura),
        this.normalizeName(row.PE),
        row.Modelo,
        row.Tipo,
        semesters,
        parseInt(row.Creditos) || 0
      );
      subjects.push(subject);
      subjectByKey.set(key, subject);
    }
    return subjects;
  }

  private buildProfessors(rows: CanonicalCourseCSV[]): Professor[] {
    const professors: Professor[] = [];
    const professorByKey = new Map<string, Professor>();

    for (const row of rows) {
      const key = this.professorKey(row);
      if (professorByKey.has(key)) continue;
      const professor = new Professor(
        professors.length + 1,
        row.Nombres || '',
        row.Apellidos || ''
      );
      professors.push(professor);
      professorByKey.set(key, professor);
    }
    return professors;
  }

  private buildCourses(rows: CanonicalCourseCSV[], subjects: Subject[], professors: Professor[]): Course[] {
    const courses: Course[] = [];
    const coursesByKey = new Map<string, Course>();

    for (const row of rows) {
      const subject = subjects.find(s => this.subjectMatchesRow(s, row));
      const professor = professors.find(p => this.professorMatchesRow(p, row));
      if (!subject || !professor) continue;

      const course = new Course(
        courses.length + 1,
        subject,
        professor,
        parseInt(row.GRUPO) || 0,
        row.Modalidad || '',
        parseFloat(row.Horas_a_la_semana) || 0,
        false
      );

      const sessions = this.getSessions(row);
      course.sessions = sessions;

      const courseKey = `${course.subject.id}-${course.group}`;
      const existingCourse = coursesByKey.get(courseKey);

      if (existingCourse) {
        if (course.sessions[0]) {
          existingCourse.addSession(course.sessions[0]);
        }
        continue;
      }

      courses.push(course);
      coursesByKey.set(courseKey, course);

      if (!subject.courses.includes(course.id)) {
        subject.addCourse(course.id);
      }
      if (!subject.professors.includes(professor.id)) {
        subject.addProfessor(professor.id);
      }
    }
    return courses;
  }

  private attachRelations(rows: CanonicalCourseCSV[], degrees: Degree[], subjects: Subject[], professors: Professor[]): void {
    const degreeByName = new Map(degrees.map(d => [d.name, d] as const));
    const subjectByKey = new Map(subjects.map(s => [this.subjectKeyFromSubject(s), s] as const));
    const professorByKey = new Map(professors.map(p => [this.professorKeyFromProfessor(p), p] as const));

    for (const row of rows) {
      const subject = subjectByKey.get(this.subjectKey(row));
      if (!subject) continue;

      for (const degreeName of this.splitDegreeNames(row.PE)) {
        const degree = degreeByName.get(this.normalizeName(degreeName));
        if (degree && !degree.subjects.some(existing => existing.id === subject.id)) {
          degree.addSubject(subject);
        }
        if (degree && !subject.degrees.includes(degree.id)) {
          subject.addDegree(degree.id);
        }
      }

      const professor = professorByKey.get(this.professorKey(row));
      if (professor && !subject.professors.includes(professor.id)) {
        subject.addProfessor(professor.id);
      }
    }
  }

  private getSessions(row: CanonicalCourseCSV): Session[] {
    const sessions: Session[] = [];
    const days = new Map<string, string>([
      ['Lunes', 'Aula1'],
      ['Martes', 'Aula2'],
      ['Miercoles', 'Aula3'],
      ['Jueves', 'Aula4'],
      ['Viernes', 'Aula5'],
    ]);

    for (const [day, aulaKey] of days) {
      if (!row[day as keyof CanonicalCourseCSV]) continue;

      const timeSlots = (row[day as keyof CanonicalCourseCSV] as string).split(/\r?\n/).map(t => t.trim()).filter(Boolean);
      const classrooms = (row[aulaKey as keyof CanonicalCourseCSV] as string).split(/\r?\n/).map(c => c.trim()).filter(Boolean);

      for (let i = 0; i < timeSlots.length; i++) {
        const parts = timeSlots[i].split('-').map(h => h.trim());
        if (parts.length !== 2) continue;
        const startMinutes = Session.fromTimeString(parts[0]);
        const endMinutes = Session.fromTimeString(parts[1]);
        if (isNaN(startMinutes) || isNaN(endMinutes)) continue;

        const classroom = classrooms[i] || classrooms[0] || '';
        const session = new Session(day, startMinutes, endMinutes, classroom);
        sessions.push(session);
      }
    }
    return sessions;
  }

  private splitDegreeNames(rawDegrees: string): string[] {
    return rawDegrees.split('-').map(d => this.normalizeName(d)).filter(Boolean);
  }

  private normalizeName(value: string): string {
    return value.trim() || 'Unknown';
  }

  private subjectKey(row: CanonicalCourseCSV): string {
    return `${this.normalizeName(row.Asignatura)}|${this.normalizeName(row.PE)}`;
  }

  private subjectKeyFromSubject(subject: Subject): string {
    return `${this.normalizeName(subject.name)}|${this.normalizeName(subject.degreeResume)}`;
  }

  private professorKey(row: CanonicalCourseCSV): string {
    return `${this.normalizeName(row.Nombres)}|${this.normalizeName(row.Apellidos)}`;
  }

  private professorKeyFromProfessor(professor: Professor): string {
    return `${this.normalizeName(professor.names)}|${this.normalizeName(professor.lastNames)}`;
  }

  private subjectMatchesRow(subject: Subject, row: CanonicalCourseCSV): boolean {
    return subject.name === this.normalizeName(row.Asignatura) && subject.degreeResume === this.normalizeName(row.PE);
  }

  private professorMatchesRow(professor: Professor, row: CanonicalCourseCSV): boolean {
    return professor.names === this.normalizeName(row.Nombres) && professor.lastNames === this.normalizeName(row.Apellidos);
  }
}