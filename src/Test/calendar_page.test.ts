import { Course } from "@/domain/entities/Course";
import { Pivot } from "@/domain/entities/Pivot";
import { Professor } from "@/domain/entities/Professor";
import { Schedule } from "@/domain/entities/Schedule";
import { Subject } from "@/domain/entities/Subject";

describe('Schedule.hasPivots', () => {
  test('Caso 1: Pivotes coinciden', () => {
    const schedule = new Schedule(1);
    const subject10 = new Subject(10, 'Subject 10', '', '', '', [], 0);
    const professor100 = new Professor(100, 'Prof', 'One');
    const course10 = new Course(1, subject10, professor100, 1, 'Online', 0, false);

    const subject20 = new Subject(20, 'Subject 20', '', '', '', [], 0);
    const professor200 = new Professor(200, 'Prof', 'Two');
    const course20 = new Course(2, subject20, professor200, 1, 'Online', 0, false);

    schedule.courses = [course10, course20];

    const pivots = [
      new Pivot(10, 100),
      new Pivot(20, 200),
    ];

    expect(schedule.hasPivots(pivots)).toBe(true);
  });

  test('Caso 2: Un pivote no coincide', () => {
    const schedule = new Schedule(2);
    const subject20 = new Subject(20, 'Subject 20', '', '', '', [], 0);
    const professor200 = new Professor(200, 'Prof', 'Two');
    const course20 = new Course(2, subject20, professor200, 1, 'Online', 0, false);

    schedule.courses = [course20];

    const pivots = [
      new Pivot(20, 300),
    ];

    expect(schedule.hasPivots(pivots)).toBe(false);
  });

  test('Caso 3: Lista de pivotes vacia', () => {
    const schedule = new Schedule(3);
    const subject10 = new Subject(10, 'Subject 10', '', '', '', [], 0);
    const professor100 = new Professor(100, 'Prof', 'One');
    const course10 = new Course(1, subject10, professor100, 1, 'Online', 0, false);

    schedule.courses = [course10];

    expect(schedule.hasPivots([])).toBe(true);
  });

  test('Caso 4: Multiples pivotes validos para una misma materia', () => {
    const schedule = new Schedule(4);
    const subject10 = new Subject(10, 'Subject 10', '', '', '', [], 0);
    const professor101 = new Professor(101, 'Prof', 'Three');
    const course10 = new Course(1, subject10, professor101, 1, 'Online', 0, false);

    schedule.courses = [course10];

    const pivots = [
      new Pivot(10, 100),
      new Pivot(10, 101),
    ];

    expect(schedule.hasPivots(pivots)).toBe(true);
  });

  test('Caso 5: Multiples pivotes para una misma materia sin coincidencia', () => {
    const schedule = new Schedule(5);
    const subject10 = new Subject(10, 'Subject 10', '', '', '', [], 0);
    const professor102 = new Professor(102, 'Prof', 'Four');
    const course10 = new Course(1, subject10, professor102, 1, 'Online', 0, false);

    schedule.courses = [course10];

    const pivots = [
      new Pivot(10, 100),
      new Pivot(10, 101),
    ];

    expect(schedule.hasPivots(pivots)).toBe(false);
  });
});

describe('Schedule.hasAllPinnedSubjects', () => {
  test('Caso 1: Lista vacia de materias fijadas', () => {
    const schedule = new Schedule(6);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const professor1 = new Professor(1, 'Prof', 'One');
    const course1 = new Course(1, subject1, professor1, 1, 'Online', 0, false);

    schedule.courses = [course1];

    expect(schedule.hasAllPinnedSubjects([])).toBe(true);
  });

  test('Caso 2: Todas las materias fijadas existen - [1]', () => {
    const schedule = new Schedule(7);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const subject2 = new Subject(2, 'Subject 2', '', '', '', [], 0);
    const subject3 = new Subject(3, 'Subject 3', '', '', '', [], 0);
    const professorA = new Professor(10, 'Prof', 'A');
    const professorB = new Professor(20, 'Prof', 'B');
    const professorC = new Professor(30, 'Prof', 'C');

    const course1 = new Course(1, subject1, professorA, 1, 'Online', 0, false);
    const course2 = new Course(2, subject2, professorB, 1, 'Online', 0, false);
    const course3 = new Course(3, subject3, professorC, 1, 'Online', 0, false);

    schedule.courses = [course1, course2, course3];

    expect(schedule.hasAllPinnedSubjects([1])).toBe(true);
  });

  test('Caso 2: Todas las materias fijadas existen - [1, 2]', () => {
    const schedule = new Schedule(8);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const subject2 = new Subject(2, 'Subject 2', '', '', '', [], 0);
    const subject3 = new Subject(3, 'Subject 3', '', '', '', [], 0);
    const professorA = new Professor(10, 'Prof', 'A');
    const professorB = new Professor(20, 'Prof', 'B');
    const professorC = new Professor(30, 'Prof', 'C');

    const course1 = new Course(1, subject1, professorA, 1, 'Online', 0, false);
    const course2 = new Course(2, subject2, professorB, 1, 'Online', 0, false);
    const course3 = new Course(3, subject3, professorC, 1, 'Online', 0, false);

    schedule.courses = [course1, course2, course3];

    expect(schedule.hasAllPinnedSubjects([1, 2])).toBe(true);
  });

  test('Caso 2: Todas las materias fijadas existen - [1, 2, 3]', () => {
    const schedule = new Schedule(9);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const subject2 = new Subject(2, 'Subject 2', '', '', '', [], 0);
    const subject3 = new Subject(3, 'Subject 3', '', '', '', [], 0);
    const professorA = new Professor(10, 'Prof', 'A');
    const professorB = new Professor(20, 'Prof', 'B');
    const professorC = new Professor(30, 'Prof', 'C');

    const course1 = new Course(1, subject1, professorA, 1, 'Online', 0, false);
    const course2 = new Course(2, subject2, professorB, 1, 'Online', 0, false);
    const course3 = new Course(3, subject3, professorC, 1, 'Online', 0, false);

    schedule.courses = [course1, course2, course3];

    expect(schedule.hasAllPinnedSubjects([1, 2, 3])).toBe(true);
  });

  test('Caso 3: Falta una materia fijada - [4]', () => {
    const schedule = new Schedule(10);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const subject2 = new Subject(2, 'Subject 2', '', '', '', [], 0);
    const subject3 = new Subject(3, 'Subject 3', '', '', '', [], 0);
    const professorA = new Professor(10, 'Prof', 'A');
    const professorB = new Professor(20, 'Prof', 'B');
    const professorC = new Professor(30, 'Prof', 'C');

    const course1 = new Course(1, subject1, professorA, 1, 'Online', 0, false);
    const course2 = new Course(2, subject2, professorB, 1, 'Online', 0, false);
    const course3 = new Course(3, subject3, professorC, 1, 'Online', 0, false);

    schedule.courses = [course1, course2, course3];

    expect(schedule.hasAllPinnedSubjects([4])).toBe(false);
  });

  test('Caso 3: Falta una materia fijada - [1, 4]', () => {
    const schedule = new Schedule(11);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const subject2 = new Subject(2, 'Subject 2', '', '', '', [], 0);
    const subject3 = new Subject(3, 'Subject 3', '', '', '', [], 0);
    const professorA = new Professor(10, 'Prof', 'A');
    const professorB = new Professor(20, 'Prof', 'B');
    const professorC = new Professor(30, 'Prof', 'C');

    const course1 = new Course(1, subject1, professorA, 1, 'Online', 0, false);
    const course2 = new Course(2, subject2, professorB, 1, 'Online', 0, false);
    const course3 = new Course(3, subject3, professorC, 1, 'Online', 0, false);

    schedule.courses = [course1, course2, course3];

    expect(schedule.hasAllPinnedSubjects([1, 4])).toBe(false);
  });

  test('Caso 3: Falta una materia fijada - [2, 3, 5]', () => {
    const schedule = new Schedule(12);
    const subject1 = new Subject(1, 'Subject 1', '', '', '', [], 0);
    const subject2 = new Subject(2, 'Subject 2', '', '', '', [], 0);
    const subject3 = new Subject(3, 'Subject 3', '', '', '', [], 0);
    const professorA = new Professor(10, 'Prof', 'A');
    const professorB = new Professor(20, 'Prof', 'B');
    const professorC = new Professor(30, 'Prof', 'C');

    const course1 = new Course(1, subject1, professorA, 1, 'Online', 0, false);
    const course2 = new Course(2, subject2, professorB, 1, 'Online', 0, false);
    const course3 = new Course(3, subject3, professorC, 1, 'Online', 0, false);

    schedule.courses = [course1, course2, course3];

    expect(schedule.hasAllPinnedSubjects([2, 3, 5])).toBe(false);
  });
});
