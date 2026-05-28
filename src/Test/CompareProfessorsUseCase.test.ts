/* @jest-environment node */
import { CompareProfessorsUseCase } from "@/domain/use_cases/CompareProfessorsUseCase";
import { Course } from "@/domain/entities/Course";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";
import { Session } from "@/domain/entities/Session";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSubject(id: number, name: string): Subject {
  return new Subject(id, name, "PE", "modelo", "teorica", [1], 6);
}
function makeProf(id: number, first: string, last: string): Professor {
  return new Professor(id, first, last);
}
function makeCourse(id: number, subject: Subject, professor: Professor, hours = 4): Course {
  const c = new Course(id, subject, professor, String(id), "Presencial", hours, false);
  c.sessions = [
    new Session("Lunes", Session.fromTimeString("08:00"), Session.fromTimeString("10:00"), "A1"),
  ];
  return c;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const calculo = makeSubject(1, "Calculo");
const algebra = makeSubject(2, "Algebra");

const gomez  = makeProf(1, "Carlos", "Gomez");
const lopez  = makeProf(2, "Maria",  "Lopez");
const ruiz   = makeProf(3, "Pedro",  "Ruiz");

// Calculo tiene 3 grupos: 2 con Gomez, 1 con Lopez
const calc1 = makeCourse(101, calculo, gomez,  4);
const calc2 = makeCourse(102, calculo, gomez,  4);
const calc3 = makeCourse(103, calculo, lopez,  4);
// Algebra tiene 1 grupo con Ruiz
const alg1  = makeCourse(104, algebra, ruiz,   3);

const allCourses = [calc1, calc2, calc3, alg1];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CompareProfessorsUseCase", () => {
  let useCase: CompareProfessorsUseCase;
  beforeEach(() => { useCase = new CompareProfessorsUseCase(); });

  describe("materia con varios profesores", () => {
    it("devuelve un resumen por cada profesor distinto", () => {
      const result = useCase.execute(calculo.id, allCourses);
      expect(result).toHaveLength(2); // Gomez y Lopez
    });

    it("agrupa todos los grupos de un mismo profesor", () => {
      const result = useCase.execute(calculo.id, allCourses);
      const gomezSummary = result.find(r => r.professor.id === gomez.id);
      expect(gomezSummary?.courses).toHaveLength(2); // calc1 y calc2
    });

    it("suma correctamente las horas semanales del profesor", () => {
      const result = useCase.execute(calculo.id, allCourses);
      const gomezSummary = result.find(r => r.professor.id === gomez.id);
      expect(gomezSummary?.totalWeekHours).toBe(8); // 4 + 4
    });

    it("el resultado viene ordenado alfabéticamente por apellido", () => {
      const result = useCase.execute(calculo.id, allCourses);
      // ✅ Cambiado lastName → lastNames
      expect(result[0].professor.lastNames).toBe("Gomez");
      expect(result[1].professor.lastNames).toBe("Lopez");
    });
  });

  describe("materia con un solo profesor", () => {
    it("devuelve exactamente un resumen", () => {
      const result = useCase.execute(algebra.id, allCourses);
      expect(result).toHaveLength(1);
      expect(result[0].professor.id).toBe(ruiz.id);
    });
  });

  describe("materia que no existe en el catálogo", () => {
    it("devuelve lista vacía sin errores", () => {
      const result = useCase.execute(9999, allCourses);
      expect(result).toEqual([]);
    });
  });

  describe("catálogo vacío", () => {
    it("devuelve lista vacía sin errores", () => {
      const result = useCase.execute(calculo.id, []);
      expect(result).toEqual([]);
    });
  });
});