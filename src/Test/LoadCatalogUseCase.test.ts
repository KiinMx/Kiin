/* @jest-environment node */
/**
 * Tests de LoadCatalogUseCase
 *
 * Qué validan:
 *  1. Que el caso de uso delega correctamente al adapter (no hace lógica propia)
 *  2. Que el resultado refleja exactamente lo que devuelve el adapter
 *  3. Que maneja catálogos vacíos sin explotar
 *  4. Que propaga errores del adapter sin ocultarlos
 *
 * Por qué mockeamos SchoolDataAdapter:
 *  LoadCatalogUseCase depende de la INTERFAZ SchoolDataAdapter, no de FmatAdapter
 *  ni de ninguna implementación concreta. Eso es Inversión de Dependencias (DIP).
 *  El mock simula cualquier fuente de datos (Excel, CSV, API) sin tocar archivos reales.
 */

import { LoadCatalogUseCase } from "@/domain/use_cases/LoadCatalogUseCase";
import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";
import { Session } from "@/domain/entities/Session";

// ---------------------------------------------------------------------------
// Helpers — construyen entidades mínimas sin archivos ni red
// ---------------------------------------------------------------------------

function makeSubject(id: number, name: string): Subject {
  return new Subject(id, name, "PE", "modelo", "teorica", [1], 6);
}

function makeProfessor(id: number, name = "Juan", lastName = "Perez"): Professor {
  return new Professor(id, name, lastName);
}

function makeCourse(id: number, subject: Subject, professor: Professor): Course {
  const course = new Course(id, subject, professor, "1", "Presencial", 4, false);
  course.sessions = [
    new Session("Lunes", Session.fromTimeString("08:00"), Session.fromTimeString("10:00"), "A1"),
  ];
  return course;
}

function makeDegree(id: number, name: string): Degree {
  return new Degree(id, name);
}

// ---------------------------------------------------------------------------
// Mock del adapter — implementa SchoolDataAdapter sin tocar disco ni red
// ---------------------------------------------------------------------------

function makeAdapter(overrides: Partial<AcademicOfferDto> = {}): SchoolDataAdapter {
  const defaultCatalog: AcademicOfferDto = {
    degrees: [],
    subjects: [],
    professors: [],
    courses: [],
    ...overrides,
  };

  return {
    fetchCatalog: jest.fn().mockResolvedValue(defaultCatalog),
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("LoadCatalogUseCase", () => {
  // ── Catálogo vacío ─────────────────────────────────────────────────────────

  describe("cuando el adapter devuelve un catálogo vacío", () => {
    it("devuelve arrays vacíos sin lanzar errores", async () => {
      const adapter = makeAdapter();
      const useCase = new LoadCatalogUseCase(adapter);

      const result = await useCase.execute();

      expect(result.degrees).toEqual([]);
      expect(result.subjects).toEqual([]);
      expect(result.professors).toEqual([]);
      expect(result.courses).toEqual([]);
    });

    it("llama al adapter exactamente una vez", async () => {
      const adapter = makeAdapter();
      const useCase = new LoadCatalogUseCase(adapter);

      await useCase.execute();

      expect(adapter.fetchCatalog).toHaveBeenCalledTimes(1);
    });
  });

  // ── Catálogo con datos reales ──────────────────────────────────────────────

  describe("cuando el adapter devuelve datos", () => {
    const subject1 = makeSubject(1, "Calculo Diferencial");
    const subject2 = makeSubject(2, "Algebra Lineal");
    const prof1 = makeProfessor(1, "Carlos", "Gomez");
    const prof2 = makeProfessor(2, "Maria", "Lopez");
    const degree = makeDegree(10, "Matematicas Aplicadas");
    const course1 = makeCourse(101, subject1, prof1);
    const course2 = makeCourse(102, subject2, prof2);

    let result: AcademicOfferDto;

    beforeEach(async () => {
      const adapter = makeAdapter({
        degrees: [degree],
        subjects: [subject1, subject2],
        professors: [prof1, prof2],
        courses: [course1, course2],
      });
      const useCase = new LoadCatalogUseCase(adapter);
      result = await useCase.execute();
    });

    it("devuelve el mismo número de carreras que el adapter", () => {
      expect(result.degrees).toHaveLength(1);
      expect(result.degrees[0].name).toBe("Matematicas Aplicadas");
    });

    it("devuelve el mismo número de materias que el adapter", () => {
      expect(result.subjects).toHaveLength(2);
    });

    it("devuelve el mismo número de profesores que el adapter", () => {
      expect(result.professors).toHaveLength(2);
    });

    it("devuelve el mismo número de cursos que el adapter", () => {
      expect(result.courses).toHaveLength(2);
    });

    it("los cursos conservan su materia y profesor intactos", () => {
      const calculo = result.courses.find(c => c.subject.id === 1);
      expect(calculo).toBeDefined();
      expect(calculo!.subject.name).toBe("Calculo Diferencial");
      expect(calculo!.professor.fullName).toBe("Carlos Gomez");
    });

    it("los cursos conservan sus sesiones", () => {
      const calculo = result.courses.find(c => c.id === 101);
      expect(calculo!.sessions).toHaveLength(1);
      expect(calculo!.sessions[0].day).toBe("Lunes");
    });
  });

  // ── El adapter falla ───────────────────────────────────────────────────────

  describe("cuando el adapter lanza un error", () => {
    it("propaga el error sin ocultarlo", async () => {
      const adapter: SchoolDataAdapter = {
        fetchCatalog: jest.fn().mockRejectedValue(
          new Error("Archivo Excel no encontrado")
        ),
      };
      const useCase = new LoadCatalogUseCase(adapter);

      await expect(useCase.execute()).rejects.toThrow("Archivo Excel no encontrado");
    });

    it("no devuelve un catálogo parcial cuando el adapter falla", async () => {
      const adapter: SchoolDataAdapter = {
        fetchCatalog: jest.fn().mockRejectedValue(new Error("Timeout")),
      };
      const useCase = new LoadCatalogUseCase(adapter);

      let result: AcademicOfferDto | undefined;
      try {
        result = await useCase.execute();
      } catch {
        result = undefined;
      }

      expect(result).toBeUndefined();
    });
  });

  // ── DIP — el use case no importa implementaciones concretas ───────────────

  describe("principio de inversion de dependencias (DIP)", () => {
    it("funciona con cualquier implementacion que cumpla SchoolDataAdapter", async () => {
      // Simula un adapter completamente distinto (podría ser Supabase, una API REST, etc.)
      const supabaseStyleAdapter: SchoolDataAdapter = {
        fetchCatalog: async () => ({
          degrees: [makeDegree(99, "Arquitectura")],
          subjects: [],
          professors: [],
          courses: [],
        }),
      };

      const useCase = new LoadCatalogUseCase(supabaseStyleAdapter);
      const result = await useCase.execute();

      expect(result.degrees[0].name).toBe("Arquitectura");
    });
  });
});
