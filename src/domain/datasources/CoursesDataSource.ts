import { Course } from "../entities/Course";
import { Filter } from "@/application/filters/Filter";

export interface CoursesDataSource {
  getAll(): Promise<Course[]>;
  getCoursesByFilter(filter: Filter): Promise<Course[]>;
}
