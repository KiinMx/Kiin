import { CourseRepository } from '../repositories/CourseRepository';
import { Course } from '../entities/Course';

export class FilterCoursesUseCase {
    constructor(private courseRepository: CourseRepository) { }

    async execute(filters: { semester?: number; type?: string }): Promise<Course[]> {
        // Business rule: validate semester range if present
        if (filters.semester && (filters.semester < 1 || filters.semester > 10)) {
            throw new Error("Invalid semester range");
        }
        return await this.courseRepository.filterCourses(filters);
    }
}