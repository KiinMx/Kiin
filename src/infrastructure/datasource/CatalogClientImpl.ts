import CatalogClientPort from "@/application/ports/CatalogClientPort";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Filter } from "@/domain/entities/Filter";
import { Subject } from "@/domain/entities/Subject";
import { CoursesCsvDatasource } from "@/infrastructure/datasource/CoursesCsvDatasource";
import { DegreesCsvDataSource } from "@/infrastructure/datasource/DegreesCsvDataSource";
import { SubjectsCsvDataSource } from "@/infrastructure/datasource/SubjectsCSvDataSource";

export class CatalogClientImpl implements CatalogClientPort {
  private degreesSource = new DegreesCsvDataSource();
  private subjectsSource = new SubjectsCsvDataSource();
  private coursesSource = new CoursesCsvDatasource();

  async getDegrees(): Promise<Degree[]> {
    return this.degreesSource.getAll();
  }

  async getSubjects(): Promise<Subject[]> {
    return this.subjectsSource.getAll();
  }

  async getCoursesByFilter(filter: Filter): Promise<Course[]> {
    return this.coursesSource.getCoursesByFilter(filter);
  }
}

export default CatalogClientImpl;