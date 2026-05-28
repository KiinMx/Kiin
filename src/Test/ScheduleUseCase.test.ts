/* @jest-environment node */

import ScheduleUseCase from "@/domain/use_cases/ScheduleUseCase";
import { Pivot } from "@/application/filters/Pivot";
import SubjectCategory from "@/application/filters/SubjectCategory";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";

describe("ScheduleUseCase", () => {
  test("buildInitialCategories creates degree + semesters", () => {
    const useCase = new ScheduleUseCase();
    const degrees = [new Degree(1, "Ingenieria")];
    const subjects = [new Subject(10, "Matematicas", "Ing", "modelo", "teorica", [1], 6)];

    const categories = useCase.buildInitialCategories(degrees, subjects, 3);

    expect(categories.length).toBe(5);
    expect(categories[0].title).toBe("Carrera");
    expect(categories[1]).toBeInstanceOf(SubjectCategory);
    expect(categories[categories.length - 1]).toBeInstanceOf(SubjectCategory);
    expect(categories[categories.length - 1].title).toBe("Sin semestre");
  });

  test("cleanOrphanedState filters pinned subjects and pivots", () => {
    const useCase = new ScheduleUseCase();
    const subjects = [new Subject(10, "Matematicas", "Ing", "modelo", "teorica", [1], 6)];
    const subjectCategory = new SubjectCategory(1, subjects);

    subjectCategory.onClick(10);

    const pinned = [10, 99];
    const pivots = [Pivot.create(10, 1), Pivot.create(99, 2)];

    const result = useCase.cleanOrphanedState([subjectCategory], pinned, pivots);

    expect(result.cleanPinnedSubjects).toEqual([10]);
    expect(result.cleanPivots).toEqual([pivots[0]]);
    expect(result.maxSubjectsCount).toBe(1);
  });

  test("generateSchedules returns combined schedules for compatible courses", () => {
    const useCase = new ScheduleUseCase();

    const subj1 = new Subject(1, "S1", "D", "m", "t", [1], 4);
    const subj2 = new Subject(2, "S2", "D", "m", "t", [1], 4);

    const prof1 = new Professor(1, "Juan", "Perez");
    const prof2 = new Professor(2, "Ana", "Gomez");

    const c1 = new Course(1, subj1, prof1, "1", "P", 4, false);
    const c2 = new Course(2, subj2, prof2, "1", "P", 4, false);

    const s1 = new Session("Lunes", Session.fromTimeString("08:00"), Session.fromTimeString("10:00"), "A1");
    const s2 = new Session("Lunes", Session.fromTimeString("10:00"), Session.fromTimeString("12:00"), "A1");

    c1.sessions = [s1];
    c2.sessions = [s2];

    const result = useCase.generateSchedules([c1, c2], [], []);

    expect(result.maxCourses).toBeGreaterThanOrEqual(2);
    const hasCombined = result.schedules.some(s => s.courses.length >= 2 && s.courses.includes(c1) && s.courses.includes(c2));
    expect(hasCombined).toBe(true);
  });
});
