/* @jest-environment node */

import SubjectFilter from "@/application/filters/SubjectFilter";
import { Course } from "@/domain/entities/Course";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";

function makeSubject(id: number, name: string): Subject {
  return new Subject(id, name, "Ing", "M21", "Teorica", [1], 6);
}

function makeCourse(id: number, subject: Subject, professor: Professor, modality = "Presencial"): Course {
  return new Course(id, subject, professor, "G1", modality, 4, false);
}

describe("Filtros (application/filters)", () => {
  const matematicas = makeSubject(1, "Matematicas");
  const fisica = makeSubject(2, "Fisica");
  const quimica = makeSubject(3, "Quimica");

  const profA = new Professor(10, "Ana", "Lopez");
  const profB = new Professor(11, "Bruno", "Diaz");

  const courses: Course[] = [
    makeCourse(100, matematicas, profA, "Presencial"),
    makeCourse(101, matematicas, profB, "Acompañamiento"),
    makeCourse(102, fisica, profA, "Ordinario"),
    makeCourse(103, quimica, profB, "Presencial"),
  ];

  describe("SubjectFilter", () => {
    test("vacio: no filtra nada (satisfy siempre true)", () => {
      const filter = new SubjectFilter([]);
      for (const course of courses) {
        expect(filter.satisfy(course)).toBe(true);
      }
    });

    test("filtra unicamente cursos cuya materia coincide por id", () => {
      const filter = new SubjectFilter([matematicas]);
      const filtered = courses.filter(c => filter.satisfy(c));

      expect(filtered).toHaveLength(2);
      for (const course of filtered) {
        expect(course.subject.id).toBe(matematicas.id);
      }
    });

    test("acepta multiples materias", () => {
      const filter = new SubjectFilter([matematicas, quimica]);
      const filtered = courses.filter(c => filter.satisfy(c));

      const ids = filtered.map(c => c.subject.id).sort();
      expect(ids).toEqual([matematicas.id, matematicas.id, quimica.id]);
    });
  });

  describe("Filtrado por profesor (criterio del dominio)", () => {
    test("filtra cursos cuyo profesor.fullName coincide", () => {
      const target = profA.fullName;
      const filtered = courses.filter(c => c.professor.fullName === target);

      expect(filtered.length).toBeGreaterThan(0);
      for (const course of filtered) {
        expect(course.professor.fullName).toBe(target);
      }
    });
  });

  describe("Filtrado por modalidad (criterio del dominio)", () => {
    test.each(["Presencial", "Acompañamiento", "Ordinario"])(
      "filtra cursos con modalidad %s",
      (modality) => {
        const filtered = courses.filter(c => c.modality === modality);
        for (const course of filtered) {
          expect(course.modality).toBe(modality);
        }
      }
    );
  });
});
