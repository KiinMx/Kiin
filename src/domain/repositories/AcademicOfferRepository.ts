import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";

export interface AcademicOfferRepository {
  getDegrees(): Promise<Degree[]>;
  getSubjects(): Promise<Subject[]>;
  getProfessors(): Promise<Professor[]>;
  getCourses(): Promise<Course[]>;
}
