export interface CourseRepository {
    filterCourses(filters: { semester?: number; type?: string }): Promise<Course[]>;
}