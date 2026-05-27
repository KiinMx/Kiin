import { CatalogSnapshotDto } from "@/application/dtos/CatalogSnapshotDto";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";
import { CatalogRepository } from "@/domain/repositories/CatalogRepository";
import { CourseMapper } from "@/infrastructure/mappers/FmatCourseMapper";
import { CourseCSV } from "@/infrastructure/models/CourseModel";
import { CoursesModelDao } from "@/infrastructure/datasource/CoursesModelDAO";
import { SubjectMapper } from "@/infrastructure/mappers/FmatSubjectMapper";
import { normalizeName } from "@/infrastructure/helpers/normalizeName";

export class CatalogRepositoryImpl implements CatalogRepository {
  async loadCatalog(): Promise<CatalogSnapshotDto> {
    const rows = await CoursesModelDao.getCourses();
    const degrees = this.buildDegrees(rows);
    const subjects = this.buildSubjects(rows);
    const professors = this.buildProfessors(rows);
    this.attachRelations(rows, degrees, subjects, professors);

    const courses = this.buildCourses(rows, subjects, professors);

    return {
      degrees,
      subjects,
      professors,
      courses,
    };
  }

  private buildDegrees(rows: CourseCSV[]): Degree[] {
    const degrees: Degree[] = [];
    const degreeByName = new Map<string, Degree>();

    for (const row of rows) {
      for (const degreeName of this.splitDegreeNames(row.PE)) {
        const normalizedName = normalizeName(degreeName);

        if (degreeByName.has(normalizedName)) {
          continue;
        }

        const degree = new Degree(degrees.length + 1, normalizedName);
        degrees.push(degree);
        degreeByName.set(normalizedName, degree);
      }
    }

    return degrees;
  }

  private buildSubjects(rows: CourseCSV[]): Subject[] {
    const subjects: Subject[] = [];
    const subjectByKey = new Map<string, Subject>();

    for (const row of rows) {
      const key = this.subjectKey(row);

      if (subjectByKey.has(key)) {
        continue;
      }

      const subject = SubjectMapper.fromModelToEntity(subjects.length + 1, row);
      subjects.push(subject);
      subjectByKey.set(key, subject);
    }

    return subjects;
  }

  private buildProfessors(rows: CourseCSV[]): Professor[] {
    const professors: Professor[] = [];
    const professorByKey = new Map<string, Professor>();

    for (const row of rows) {
      const key = this.professorKey(row);

      if (professorByKey.has(key)) {
        continue;
      }

      const professor = new Professor(professors.length + 1, normalizeName(row.Nombres ?? ""), normalizeName(row.Apellidos ?? ""));
      professors.push(professor);
      professorByKey.set(key, professor);
    }

    return professors;
  }

  private buildCourses(rows: CourseCSV[], subjects: Subject[], professors: Professor[]): Course[] {
    const courses: Course[] = [];
    const coursesByKey = new Map<string, Course>();

    for (const row of rows) {
      const course = CourseMapper.fromModelToEntity(
        courses.length + 1,
        row,
        candidate => subjects.find(subject => this.subjectMatchesRow(subject, candidate)),
        candidate => professors.find(professor => this.professorMatchesRow(professor, candidate)),
      );

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

      if (!course.subject.courses.includes(course.id)) {
        course.subject.addCourse(course.id);
      }

      if (!course.subject.professors.includes(course.professor.id)) {
        course.subject.addProfessor(course.professor.id);
      }
    }

    return courses;
  }

  private attachRelations(rows: CourseCSV[], degrees: Degree[], subjects: Subject[], professors: Professor[]): void {
    const degreeByName = new Map(degrees.map(degree => [degree.name, degree] as const));
    const subjectByKey = new Map(subjects.map(subject => [this.subjectKeyFromSubject(subject), subject] as const));
    const professorByKey = new Map(professors.map(professor => [this.professorKeyFromProfessor(professor), professor] as const));

    for (const row of rows) {
      const subject = subjectByKey.get(this.subjectKey(row));

      if (!subject) {
        continue;
      }

      for (const degreeName of this.splitDegreeNames(row.PE)) {
        const degree = degreeByName.get(normalizeName(degreeName));

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

  private splitDegreeNames(rawDegrees: string): string[] {
    return rawDegrees
      .split("-")
      .map(degree => normalizeName(degree))
      .filter(Boolean);
  }

  private subjectKey(row: CourseCSV): string {
    return `${normalizeName(row.Asignatura)}|${normalizeName(row.PE)}`;
  }

  private subjectKeyFromSubject(subject: Subject): string {
    return `${normalizeName(subject.name)}|${normalizeName(subject.degreeResume)}`;
  }

  private professorKey(row: CourseCSV): string {
    return `${normalizeName(row.Nombres)}|${normalizeName(row.Apellidos)}`;
  }

  private professorKeyFromProfessor(professor: Professor): string {
    return `${normalizeName(professor.names)}|${normalizeName(professor.lastNames)}`;
  }

  private subjectMatchesRow(subject: Subject, row: CourseCSV): boolean {
    return subject.name === normalizeName(row.Asignatura) && subject.degreeResume === normalizeName(row.PE);
  }

  private professorMatchesRow(professor: Professor, row: CourseCSV): boolean {
    return professor.names === normalizeName(row.Nombres) && professor.lastNames === normalizeName(row.Apellidos);
  }
}