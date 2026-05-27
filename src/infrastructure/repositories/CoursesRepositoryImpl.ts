import { Filter } from "@/application/filters/Filter";
import { Course } from "@/domain/entities/Course";
import { CoursesDataSource } from "@/domain/datasources/CoursesDataSource";
import { CoursesRepository } from "@/domain/repositories/CoursesRepository";

export class CoursesRepositoryImpl implements CoursesRepository {
  private _dataSource;

  constructor(dataSource: CoursesDataSource) {
    this._dataSource = dataSource;
  }
  getCoursesByFilter(filter: Filter): Promise<Course[]> {
    return this._dataSource.getCoursesByFilter(filter);
  }

  getAll(): Promise<Course[]> {
    return this._dataSource.getAll();
  }
}
