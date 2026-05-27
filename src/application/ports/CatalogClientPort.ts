import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Filter } from "@/domain/entities/Filter";
import { Subject } from "@/domain/entities/Subject";

export interface CatalogClientPort {
  getDegrees(): Promise<Degree[]>;
  getSubjects(): Promise<Subject[]>;
  getCoursesByFilter(filter: Filter): Promise<Course[]>;
}

export default CatalogClientPort;