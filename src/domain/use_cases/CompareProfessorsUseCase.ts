// src/domain/use_cases/CompareProfessorsUseCase.ts
import { Course } from "@/domain/entities/Course";
import { Professor } from "@/domain/entities/Professor";

export interface ProfessorSummary {
  professor: Professor;
  courses: Course[];
  totalWeekHours: number;
}

export class CompareProfessorsUseCase {
  execute(subjectId: number, allCourses: Course[]): ProfessorSummary[] {
    const subjectCourses = allCourses.filter(course => course.subject.id === subjectId);
    
    const map = new Map<number, { professor: Professor; courses: Course[]; totalHours: number }>();
    
    for (const course of subjectCourses) {
      const professor = course.professor;
      const existing = map.get(professor.id);
      if (existing) {
        existing.courses.push(course);
        existing.totalHours += course.weekHours;
      } else {
        map.set(professor.id, {
          professor,
          courses: [course],
          totalHours: course.weekHours,
        });
      }
    }
    
    const result: ProfessorSummary[] = Array.from(map.values()).map(item => ({
      professor: item.professor,
      courses: item.courses,
      totalWeekHours: item.totalHours,
    }));
    
    // Ordenar por lastNames (apellidos)
    result.sort((a, b) => a.professor.lastNames.localeCompare(b.professor.lastNames));
    
    return result;
  }
}