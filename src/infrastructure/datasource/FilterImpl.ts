import { Course } from "@/domain/entities/Course";
import { CoursesCsvDatasource } from "./CoursesCsvDatasource";
import { Filter } from "@/domain/entities/Filter";
import { CoursesRepositoryImpl } from "../repositories/CoursesRepositoryImpl";
import CourseFilter from "@/domain/entities/CourseFilter";
import SubjectFilter from "@/domain/entities/SubjectFilter";
import DegreeFilter from "@/domain/entities/DegreeFilter";

export class FilterImpl implements Filter {

  private _filters: CourseFilter[];
  constructor(
    filters: CourseFilter[]
  ) {
    this._filters = filters;
  }

  //union filter
  async filter(

  ) {
    const coursesDataSource = new CoursesRepositoryImpl(new CoursesCsvDatasource());
    const allCourses: Course[] = await coursesDataSource.getAll();
    const filtered: Course[] = allCourses.filter(course =>
      this._filters.every(filter => (filter instanceof DegreeFilter) ? filter.satify(course) : true)
    );

    const subjectsToBeFilteredIds: number[] = [];

    this._filters.filter(f => f instanceof SubjectFilter).flatMap(sf => sf.subjects.forEach(subject => {
      subjectsToBeFilteredIds.push(subject.id);
    }))

    const finalFiltered = filtered.filter(course => subjectsToBeFilteredIds.includes(course.subject.id));

    return finalFiltered;
  }

  filterByProfessor(courses: Course[], professorFullName: string): Course[] {
    return courses.filter(course => {
      const maybeFn = (course.professor as any).fullName;
      const name = typeof maybeFn === 'function' ? maybeFn.call(course.professor) : maybeFn;
      return name === professorFullName;
    });
  }

  filterBySubjects(courses: Course[], subjectNameOrModality: string): Course[] {
    return courses.filter(course => course.subject.name === subjectNameOrModality || course.modality === subjectNameOrModality);
  }
}