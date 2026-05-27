import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";
import { CanonicalCourseCSV } from "@/infrastructure/models/CanonicalCourseCSV";

export function normalizeName(value: string): string {
  return value.trim() || "Unknown";
}

export function subjectKey(row: CanonicalCourseCSV): string {
  return `${normalizeName(row.Asignatura)}|${normalizeName(row.PE)}`;
}

export function subjectKeyFromSubject(subject: Subject): string {
  return `${normalizeName(subject.name)}|${normalizeName(subject.degreeResume)}`;
}

export function professorKey(row: CanonicalCourseCSV): string {
  return `${normalizeName(row.Nombres)}|${normalizeName(row.Apellidos)}`;
}

export function professorKeyFromProfessor(professor: Professor): string {
  return `${normalizeName(professor.names)}|${normalizeName(professor.lastNames)}`;
}

function subjectMatchesRow(subject: Subject, row: CanonicalCourseCSV): boolean {
  return subject.name === normalizeName(row.Asignatura) && subject.degreeResume === normalizeName(row.PE);
}

function professorMatchesRow(professor: Professor, row: CanonicalCourseCSV): boolean {
  return professor.names === normalizeName(row.Nombres) && professor.lastNames === normalizeName(row.Apellidos);
}

function splitDegreeNames(rawDegrees: string): string[] {
  return rawDegrees.split("-").map(d => normalizeName(d)).filter(Boolean);
}

function getSessions(row: CanonicalCourseCSV): Session[] {
  const sessions: Session[] = [];
  const days = new Map<string, string>([
    ["Lunes", "Aula1"],
    ["Martes", "Aula2"],
    ["Miercoles", "Aula3"],
    ["Jueves", "Aula4"],
    ["Viernes", "Aula5"],
  ]);

  for (const [day, aulaKey] of days) {
    const dayValue = row[day as keyof CanonicalCourseCSV];
    if (!dayValue) continue;

    const timeSlots = (dayValue as string).split(/\r?\n/).map(t => t.trim()).filter(Boolean);
    const classrooms = (row[aulaKey as keyof CanonicalCourseCSV] as string).split(/\r?\n/).map(c => c.trim()).filter(Boolean);

    for (let i = 0; i < timeSlots.length; i++) {
      const parts = timeSlots[i].split("-").map(h => h.trim());
      if (parts.length !== 2) continue;
      const startMinutes = Session.fromTimeString(parts[0]);
      const endMinutes = Session.fromTimeString(parts[1]);
      if (isNaN(startMinutes) || isNaN(endMinutes)) continue;

      const classroom = classrooms[i] || classrooms[0] || "";
      const session = new Session(day, startMinutes, endMinutes, classroom);
      sessions.push(session);
    }
  }
  return sessions;
}

export function buildDegrees(rows: CanonicalCourseCSV[]): Degree[] {
  const degrees: Degree[] = [];
  const degreeByName = new Map<string, Degree>();

  for (const row of rows) {
    for (const degreeName of splitDegreeNames(row.PE)) {
      const normalizedName = normalizeName(degreeName);
      if (degreeByName.has(normalizedName)) continue;
      const degree = new Degree(degrees.length + 1, normalizedName);
      degrees.push(degree);
      degreeByName.set(normalizedName, degree);
    }
  }
  return degrees;
}

export function buildSubjects(rows: CanonicalCourseCSV[]): Subject[] {
  const subjects: Subject[] = [];
  const subjectByKey = new Map<string, Subject>();

  for (const row of rows) {
    const key = subjectKey(row);
    if (subjectByKey.has(key)) continue;
    const semesters = row.Semestre.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const subject = new Subject(
      subjects.length + 1,
      normalizeName(row.Asignatura),
      normalizeName(row.PE),
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

export function buildProfessors(rows: CanonicalCourseCSV[]): Professor[] {
  const professors: Professor[] = [];
  const professorByKey = new Map<string, Professor>();

  for (const row of rows) {
    const key = professorKey(row);
    if (professorByKey.has(key)) continue;
    const professor = new Professor(
      professors.length + 1,
      row.Nombres || "",
      row.Apellidos || ""
    );
    professors.push(professor);
    professorByKey.set(key, professor);
  }
  return professors;
}

export function buildCourses(rows: CanonicalCourseCSV[], subjects: Subject[], professors: Professor[]): Course[] {
  const courses: Course[] = [];
  const coursesByKey = new Map<string, Course>();

  for (const row of rows) {
    const subject = subjects.find(s => subjectMatchesRow(s, row));
    const professor = professors.find(p => professorMatchesRow(p, row));
    if (!subject || !professor) continue;

    const course = new Course(
      courses.length + 1,
      subject,
      professor,
      parseInt(row.GRUPO) || 0,
      row.Modalidad || "",
      parseFloat(row.Horas_a_la_semana) || 0,
      false
    );

    const sessions = getSessions(row);
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

export function attachRelations(
  rows: CanonicalCourseCSV[],
  degrees: Degree[],
  subjects: Subject[],
  professors: Professor[]
): void {
  const degreeByName = new Map(degrees.map(d => [d.name, d] as const));
  const subjectByKey = new Map(subjects.map(s => [subjectKeyFromSubject(s), s] as const));
  const professorByKey = new Map(professors.map(p => [professorKeyFromProfessor(p), p] as const));

  for (const row of rows) {
    const subject = subjectByKey.get(subjectKey(row));
    if (!subject) continue;

    for (const degreeName of splitDegreeNames(row.PE)) {
      const degree = degreeByName.get(normalizeName(degreeName));
      if (degree && !degree.subjects.some(existing => existing.id === subject.id)) {
        degree.addSubject(subject);
      }
      if (degree && !subject.degrees.includes(degree.id)) {
        subject.addDegree(degree.id);
      }
    }

    const professor = professorByKey.get(professorKey(row));
    if (professor && !subject.professors.includes(professor.id)) {
      subject.addProfessor(professor.id);
    }
  }
}

export function buildCatalogFromRows(rows: CanonicalCourseCSV[]): AcademicOfferDto {
  const degrees = buildDegrees(rows);
  const subjects = buildSubjects(rows);
  const professors = buildProfessors(rows);
  attachRelations(rows, degrees, subjects, professors);
  const courses = buildCourses(rows, subjects, professors);
  return { degrees, subjects, professors, courses };
}
