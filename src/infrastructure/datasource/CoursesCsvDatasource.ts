import { CoursesDataSource } from "@/domain/datasources/CoursesDataSource";
import { Course } from "@/domain/entities/Course";
import { Filter } from "@/domain/entities/Filter";
import { Mapper } from "../mappers/Mapper";

// Este archivo se encuentra del lado del cliente

export class CoursesCsvDatasource implements CoursesDataSource {
  private courses: Course[] = [];
  private readonly faculty: string;

  constructor(faculty: string = "matematicas") {
    this.faculty = faculty;
  }

  async getAll(): Promise<Course[]> {
    if (this.courses.length > 0) {
      return this.courses;
    }

    const res = await fetch(`/api/version?faculty=${this.faculty}`);
    const versionDeLaAPI = await res.json();

    const cacheKey = `course-info-${versionDeLaAPI}`;
    const storedData = localStorage.getItem(cacheKey);

    if (storedData) {
      console.log("Cursos recuperados de local storage");
      this.courses = Mapper.toCourses(JSON.parse(storedData)) as Course[];
    } else {
      // Eliminar la informacion desactualizada de esta facultad
      Object.keys(localStorage)
        .filter(key => key.startsWith(`course-info-`) && key.includes(`_${this.faculty}_`))
        .forEach(key => localStorage.removeItem(key));

      console.log("Cursos recuperados de la API");
      const response = await fetch(`/api/courses/all?faculty=${this.faculty}`);
      this.courses = Mapper.toCourses(await response.json()) as Course[];
      localStorage.setItem(cacheKey, JSON.stringify(this.courses));
    }

    return this.courses;
  }

  async getCoursesByFilter(filter: Filter): Promise<Course[]> {
    return filter.filter(await this.getAll());
  }
}
