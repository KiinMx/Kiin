import { Course } from "@/domain/entities/Course";
import CourseFilter from "@/domain/entities/CourseFilter";
import DegreeFilter from "@/domain/entities/DegreeFilter";
import { Filter } from "@/domain/entities/Filter";
import SubjectFilter from "@/domain/entities/SubjectFilter";

export class FilterImpl implements Filter {

  private _filters: CourseFilter[];
  constructor(
    filters: CourseFilter[]
  ) {
    this._filters = filters;
  }

  //union filter
  async filter(courses: Course[]) {
    const filtered: Course[] = courses.filter(course =>
      this._filters.every(filter => (filter instanceof DegreeFilter) ? filter.satify(course) : true)
    );

    const subjectsToBeFilteredIds: number[] = [];

    this._filters.filter(f => f instanceof SubjectFilter).flatMap(sf => sf.subjects.forEach(subject => {
      subjectsToBeFilteredIds.push(subject.id);
    }))

    const finalFiltered = filtered.filter(course => subjectsToBeFilteredIds.includes(course.subject.id));

    return finalFiltered;
  }
}