/* @jest-environment node */
/**
 * Tests de ScheduleUseCase — generateSchedules
 *
 * Qué validan:
 *  1. Que se generan combinaciones correctas cuando no hay choques
 *  2. Que dos cursos que chocan NUNCA aparecen en el mismo horario
 *  3. Que PinnedSubjectFilter funciona dentro del pipeline
 *  4. Que PivotFilter funciona dentro del pipeline
 *  5. Que el resultado está ordenado por cantidad de materias (descendente)
 *  6. Que maxCourses refleja el horario más completo
 *  7. Que con cero cursos el resultado es vacío sin errores
 *
 * Por qué usamos constructores directos y no mocks:
 *  ScheduleUseCase opera sobre entidades del dominio puro (Course, Session,
 *  Schedule). No hay I/O ni red involucrada, por lo que podemos testear
 *  la lógica real sin necesidad de stubs.
 */

/* @jest-environment node */
import ScheduleUseCase from "@/domain/use_cases/ScheduleUseCase";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Schedule } from "@/domain/entities/Schedule";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";
import { Pivot } from "@/application/filters/Pivot";
import SubjectCategory from "@/application/filters/SubjectCategory";

// ---------------------------------------------------------------------------
// Helpers — construyen datos sin I/O
// ---------------------------------------------------------------------------

function makeSubject(id: number, name: string, semester = 1): Subject {
  return new Subject(id, name, "PE", "modelo", "teorica", [semester], 6);
}

function makeProf(id: number, first = "Prof", last = `${id}`): Professor {
  return new Professor(id, first, last);
}

/**
 * Crea un curso con una sesión de `startStr` a `endStr` el día indicado.
 * Por defecto el día es "Lunes".
 */
function makeCourse(
  id: number,
  subject: Subject,
  professor: Professor,
  startStr: string,
  endStr: string,
  day = "Lunes"
): Course {
  const course = new Course(id, subject, professor, String(id), "Presencial", 4, false);
  course.sessions = [
    new Session(day, Session.fromTimeString(startStr), Session.fromTimeString(endStr), "A1"),
  ];
  return course;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const subjCalculo  = makeSubject(1, "Calculo");
const subjAlgebra  = makeSubject(2, "Algebra");
const subjFisica   = makeSubject(3, "Fisica");

const profGomez = makeProf(1, "Carlos", "Gomez");
const profLopez = makeProf(2, "Maria",  "Lopez");
const profRuiz  = makeProf(3, "Pedro",  "Ruiz");

// Cursos sin choque: cada uno en franja diferente del mismo día
const courseCalculo = makeCourse(101, subjCalculo, profGomez, "08:00", "10:00");
const courseAlgebra = makeCourse(102, subjAlgebra, profLopez, "10:00", "12:00");
const courseFisica  = makeCourse(103, subjFisica,  profRuiz,  "12:00", "14:00");

// Curso que choca con courseCalculo (mismo horario)
const courseCalculoChoca = makeCourse(104, makeSubject(4, "CalculoB"), profRuiz, "08:00", "10:00");

// ---------------------------------------------------------------------------
// Suite: generateSchedules
// ---------------------------------------------------------------------------

describe("ScheduleUseCase — generateSchedules", () => {
  let useCase: ScheduleUseCase;

  beforeEach(() => {
    useCase = new ScheduleUseCase();
  });

  // ── Sin cursos ─────────────────────────────────────────────────────────────

  describe("sin cursos de entrada", () => {
    it("devuelve schedules vacío sin lanzar errores", () => {
      const result = useCase.generateSchedules([], [], []);
      expect(result.schedules).toEqual([]);
      expect(result.maxCourses).toBe(0);
    });
  });

  // ── Un solo curso ──────────────────────────────────────────────────────────

  describe("con un único curso", () => {
    it("genera al menos un horario que contiene ese curso", () => {
      const result = useCase.generateSchedules([courseCalculo], [], []);
      expect(result.schedules.length).toBeGreaterThan(0);
      const hasCourse = result.schedules.some(s => s.courses.includes(courseCalculo));
      expect(hasCourse).toBe(true);
    });
  });

  // ── Cursos sin choque ──────────────────────────────────────────────────────

  describe("con cursos compatibles (sin choques)", () => {
    it("genera al menos un horario que combina todos los cursos", () => {
      const all = [courseCalculo, courseAlgebra, courseFisica];
      const result = useCase.generateSchedules(all, [], []);

      const fullSchedule = result.schedules.find(s => s.courses.length === 3);
      expect(fullSchedule).toBeDefined();
    });

    it("maxCourses refleja el horario con más materias", () => {
      const all = [courseCalculo, courseAlgebra, courseFisica];
      const result = useCase.generateSchedules(all, [], []);
      expect(result.maxCourses).toBe(3);
    });

    it("los horarios están ordenados de mayor a menor cantidad de cursos", () => {
      const all = [courseCalculo, courseAlgebra, courseFisica];
      const result = useCase.generateSchedules(all, [], []);

      for (let i = 0; i < result.schedules.length - 1; i++) {
        expect(result.schedules[i].courses.length).toBeGreaterThanOrEqual(
          result.schedules[i + 1].courses.length
        );
      }
    });
  });

  // ── Cursos con choque ──────────────────────────────────────────────────────

  describe("con cursos que se empalman en horario", () => {
    it("nunca combina dos cursos que chocan en el mismo horario generado", () => {
      // courseCalculo y courseCalculoChoca ambos son Lunes 08:00-10:00
      const all = [courseCalculo, courseCalculoChoca, courseAlgebra];
      const result = useCase.generateSchedules(all, [], []);

      for (const schedule of result.schedules) {
        const tieneCalculo      = schedule.courses.includes(courseCalculo);
        const tieneCalculoChoca = schedule.courses.includes(courseCalculoChoca);
        // No pueden aparecer juntos nunca
        expect(tieneCalculo && tieneCalculoChoca).toBe(false);
      }
    });
  });

  // ── PinnedSubjectFilter dentro del pipeline ────────────────────────────────

  describe("con materias fijadas (pinnedSubjects)", () => {
    it("elimina horarios que no incluyan la materia fijada", () => {
      const all = [courseCalculo, courseAlgebra, courseFisica];
      // Fijamos Algebra — solo deben quedar horarios que la incluyan
      const result = useCase.generateSchedules(all, [subjAlgebra.id], []);

      for (const schedule of result.schedules) {
        const tieneAlgebra = schedule.courses.some(c => c.subject.id === subjAlgebra.id);
        expect(tieneAlgebra).toBe(true);
      }
    });

    it("con materia fijada inexistente devuelve cero horarios", () => {
      const result = useCase.generateSchedules([courseCalculo], [9999], []);
      expect(result.schedules).toHaveLength(0);
    });
  });

  // ── PivotFilter dentro del pipeline ───────────────────────────────────────

  describe("con pivots (profesor fijado por materia)", () => {
    it("elimina horarios donde la materia tiene un profesor distinto al pivot", () => {
      // Pivot: Calculo debe ir con profGomez (id 1)
      const pivot = Pivot.create(subjCalculo.id, profGomez.id);
      // courseCalculo tiene profGomez — debe quedar
      // courseCalculoChoca tiene profRuiz — debe ser eliminado
      const all = [courseCalculo, courseCalculoChoca];
      const result = useCase.generateSchedules(all, [], [pivot]);

      for (const schedule of result.schedules) {
        const calculo = schedule.courses.find(c => c.subject.id === subjCalculo.id);
        if (calculo) {
          expect(calculo.professor.id).toBe(profGomez.id);
        }
      }
    });
  });

  // ── Una materia, múltiples grupos ──────────────────────────────────────────

  describe("con una sola materia y múltiples grupos", () => {
    it("cada horario tiene como mucho un grupo de esa materia", () => {
      const grupo1 = makeCourse(201, subjCalculo, profGomez, "08:00", "10:00");
      const grupo2 = makeCourse(202, subjCalculo, profLopez, "10:00", "12:00");
      const result = useCase.generateSchedules([grupo1, grupo2], [], []);

      for (const schedule of result.schedules) {
        const cursosCalculo = schedule.courses.filter(c => c.subject.id === subjCalculo.id);
        expect(cursosCalculo.length).toBeLessThanOrEqual(1);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Suite: cleanOrphanedState
// ---------------------------------------------------------------------------

describe("ScheduleUseCase — cleanOrphanedState", () => {
  let useCase: ScheduleUseCase;

  beforeEach(() => { useCase = new ScheduleUseCase(); });

  it("elimina pinnedSubjects que ya no están seleccionados en ningún semestre", () => {
    const subject = makeSubject(10, "Matematicas");
    const cat = new SubjectCategory(1, [subject]);
    cat.onClick(10); // seleccionar

    const result = useCase.cleanOrphanedState([cat], [10, 99], []);
    expect(result.cleanPinnedSubjects).toEqual([10]);
    expect(result.cleanPinnedSubjects).not.toContain(99);
  });

  it("elimina pivots cuya materia ya no está seleccionada", () => {
    const subject = makeSubject(10, "Matematicas");
    const cat = new SubjectCategory(1, [subject]);
    cat.onClick(10);

    const pivotValido   = Pivot.create(10, 1);
    const pivotHuerfano = Pivot.create(99, 2); // materia 99 no seleccionada

    const result = useCase.cleanOrphanedState([cat], [], [pivotValido, pivotHuerfano]);
    expect(result.cleanPivots).toContain(pivotValido);
    expect(result.cleanPivots).not.toContain(pivotHuerfano);
  });

  it("maxSubjectsCount refleja el total de materias seleccionadas en todos los semestres", () => {
    // El semestre de la materia debe coincidir con el semestre de la SubjectCategory
    // SubjectCategory filtra internamente: values.filter(s => s.semestre.includes(semester))
    const s1 = makeSubject(1, "A", 1); // semestre 1
    const s2 = makeSubject(2, "B", 2); // semestre 2 — debe coincidir con SubjectCategory(2, ...)
    const cat1 = new SubjectCategory(1, [s1]);
    const cat2 = new SubjectCategory(2, [s2]);
    cat1.onClick(1);
    cat2.onClick(2);

    const result = useCase.cleanOrphanedState([cat1, cat2], [], []);
    expect(result.maxSubjectsCount).toBe(2);
  });

  it("sin nada seleccionado devuelve listas vacías y maxSubjectsCount 0", () => {
    const cat = new SubjectCategory(1, [makeSubject(1, "A")]);
    // No se llama onClick — nada seleccionado
    const result = useCase.cleanOrphanedState([cat], [1], [Pivot.create(1, 1)]);
    expect(result.cleanPinnedSubjects).toHaveLength(0);
    expect(result.cleanPivots).toHaveLength(0);
    expect(result.maxSubjectsCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite: buildInitialCategories
// ---------------------------------------------------------------------------

describe("ScheduleUseCase — buildInitialCategories", () => {
  let useCase: ScheduleUseCase;
  beforeEach(() => { useCase = new ScheduleUseCase(); });

  it("crea 1 categoría de carrera + N semestres + 1 sin semestre", () => {
    const degrees = [new Degree(1, "Matematicas")];
    const subjects = [makeSubject(1, "Calculo")];
    // 3 semestres → 1 (carrera) + 3 (semestres) + 1 (sin semestre) = 5
    const cats = useCase.buildInitialCategories(degrees, subjects, 3);
    expect(cats).toHaveLength(5);
  });

  it("la primera categoría es siempre la de carreras", () => {
    const cats = useCase.buildInitialCategories([new Degree(1, "Ing")], [], 2);
    expect(cats[0].title).toBe("Carrera");
  });

  it("con semesterCount por defecto (9) genera 11 categorías en total", () => {
    const cats = useCase.buildInitialCategories([new Degree(1, "Ing")], []);
    // 1 (carrera) + 9 (semestres) + 1 (sin semestre) = 11
    expect(cats).toHaveLength(11);
  });
});
