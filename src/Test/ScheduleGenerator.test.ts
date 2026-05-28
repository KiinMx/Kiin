/* @jest-environment node */

import { Course } from "@/domain/entities/Course";
import { Professor } from "@/domain/entities/Professor";
import { ScheduleGenerator } from "@/domain/entities/ScheduleGenerator";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";

function makeSubject(id: number, name: string): Subject {
  return new Subject(id, name, "Ing", "M21", "Teorica", [1], 6);
}

function makeCourse(id: number, subjectId: number, professorId: number, sessions: Session[]): Course {
  const subject = makeSubject(subjectId, `S${subjectId}`);
  const professor = new Professor(professorId, "P", `${professorId}`);
  const course = new Course(id, subject, professor, "G1", "Presencial", 4, false);
  course.sessions = sessions;
  return course;
}

function session(day: string, start: string, end: string): Session {
  return new Session(day, Session.fromTimeString(start), Session.fromTimeString(end), "A");
}

describe("ScheduleGenerator", () => {
  let generator: ScheduleGenerator;

  beforeEach(() => {
    generator = new ScheduleGenerator();
  });

  describe("sessionCompatible", () => {
    test("dos sesiones en dias distintos son siempre compatibles", () => {
      const a = session("Lunes", "08:00", "10:00");
      const b = session("Martes", "08:00", "10:00");
      expect(generator.sessionCompatible(a, b)).toBe(true);
    });

    test("sesiones que se traslapan en el mismo dia no son compatibles", () => {
      const a = session("Lunes", "08:00", "10:00");
      const b = session("Lunes", "09:00", "11:00");
      expect(generator.sessionCompatible(a, b)).toBe(false);
    });

    test("sesiones contiguas (fin == inicio) son compatibles", () => {
      const a = session("Lunes", "08:00", "10:00");
      const b = session("Lunes", "10:00", "12:00");
      expect(generator.sessionCompatible(a, b)).toBe(true);
    });
  });

  describe("courseCompatible", () => {
    test("dos cursos sin sesiones traslapadas son compatibles", () => {
      const c1 = makeCourse(1, 10, 100, [session("Lunes", "08:00", "10:00")]);
      const c2 = makeCourse(2, 11, 101, [session("Lunes", "10:00", "12:00")]);
      expect(generator.courseCompatible(c1, c2)).toBe(true);
    });

    test("dos cursos con cualquier sesion traslapada son incompatibles", () => {
      const c1 = makeCourse(1, 10, 100, [session("Lunes", "08:00", "10:00")]);
      const c2 = makeCourse(2, 11, 101, [
        session("Martes", "08:00", "10:00"),
        session("Lunes", "09:00", "11:00"),
      ]);
      expect(generator.courseCompatible(c1, c2)).toBe(false);
    });
  });

  describe("generateSchedules", () => {
    test("genera al menos un horario y dentro de el todos los cursos son compatibles entre si", () => {
      const courses = [
        makeCourse(1, 10, 100, [session("Lunes", "08:00", "10:00")]),
        makeCourse(2, 11, 101, [session("Lunes", "10:00", "12:00")]),
        makeCourse(3, 12, 102, [session("Martes", "08:00", "10:00")]),
      ];

      const schedules = generator.generateSchedules(courses);

      expect(schedules.length).toBeGreaterThan(0);
      for (const schedule of schedules) {
        expect(schedule.courses.length).toBeGreaterThan(0);
        for (let i = 0; i < schedule.courses.length; i++) {
          for (let j = i + 1; j < schedule.courses.length; j++) {
            expect(generator.courseCompatible(schedule.courses[i], schedule.courses[j])).toBe(true);
          }
        }
      }
    });

    test("no incluye dos cursos de la misma materia en el mismo horario", () => {
      const courses = [
        makeCourse(1, 10, 100, [session("Lunes", "08:00", "10:00")]),
        makeCourse(2, 10, 101, [session("Martes", "08:00", "10:00")]), // misma materia (10), distinto profesor
      ];

      const schedules = generator.generateSchedules(courses);

      for (const schedule of schedules) {
        const subjectIds = schedule.courses.map(c => c.subject.id);
        const uniqueSubjectIds = new Set(subjectIds);
        expect(subjectIds.length).toBe(uniqueSubjectIds.size);
      }
    });
  });
});
