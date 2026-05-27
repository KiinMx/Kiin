import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Subject } from "@/domain/entities/Subject";

export interface CatalogClientPort {
  getDegrees(): Promise<Degree[]>;
  getSubjects(): Promise<Subject[]>;
  getCourses(): Promise<Course[]>;
}

export default CatalogClientPort;