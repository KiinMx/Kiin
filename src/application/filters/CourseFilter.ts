import { Course } from "@/domain/entities/Course";

export default interface CourseFilter {
    satisfy(course: Course): boolean
}