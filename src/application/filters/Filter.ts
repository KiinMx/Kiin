import { Course } from "@/domain/entities/Course";

export interface Filter {
    filter(courses: Course[]): Promise<Course[]>;
}