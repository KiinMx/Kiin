/* @jest-environment node */

import { Course } from "@/domain/entities/Course";
import { Professor } from "@/domain/entities/Professor";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";

function makeCourse(id: number, subjectId: number, professorId: number, sessions: Session[] = []): Course {
  const subject = new Subject(subjectId, `Subject ${subjectId}`, "Ing", "M21", "Teorica", [1], 6);
  const professor = new Professor(professorId, "Nombre", `Apellido${professorId}`);
  const course = new Course(id, subject, professor, "G1", "Presencial", 4, false);
  course.sessions = sessions;
  return course;
}

describe("Course entity", () => {
  test("expone los atributos pasados al constructor", () => {
    const course = makeCourse(1, 10, 100);

    expect(course.id).toBe(1);
    expect(course.subject.id).toBe(10);
    expect(course.professor.id).toBe(100);
    expect(course.group).toBe("G1");
    expect(course.modality).toBe("Presencial");
    expect(course.weekHours).toBe(4);
    expect(course.acceptModifications).toBe(false);
  });

  test("inicia sin sesiones y permite agregarlas", () => {
    const course = makeCourse(1, 10, 100);
    expect(course.sessions).toEqual([]);

    const session = new Session("Lunes", Session.fromTimeString("08:00"), Session.fromTimeString("10:00"), "A1");
    course.addSession(session);

    expect(course.sessions).toHaveLength(1);
    expect(course.sessions[0]).toBe(session);
  });

  test("todo Course tiene un profesor asociado", () => {
    const courses = [
      makeCourse(1, 10, 100),
      makeCourse(2, 11, 101),
      makeCourse(3, 12, 102),
    ];

    for (const course of courses) {
      expect(course.professor).toBeDefined();
      expect(course.professor).not.toBeNull();
      expect(typeof course.professor.fullName).toBe("string");
      expect(course.professor.fullName.length).toBeGreaterThan(0);
    }
  });

  test("normaliza group y modality a string vacio cuando son nulos", () => {
    const subject = new Subject(1, "S", "Ing", "M21", "Teorica", [1], 6);
    const professor = new Professor(1, "N", "A");
    const course = new Course(1, subject, professor, null as unknown as string, null as unknown as string, 4, false);

    expect(course.group).toBe("");
    expect(course.modality).toBe("");
  });
});
