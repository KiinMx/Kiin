import { CoursesDataSource } from "@/domain/datasources/CoursesDataSource";
import { Course } from "@/domain/entities/Course";
import { Filter } from "@/domain/entities/Filter";
import { Mapper } from "../mappers/Mapper";

// Este archivo se encuentra del lado del cliente

export class CoursesCsvDatasource implements CoursesDataSource {
  private courses: Course[] = [];

  async getAll(): Promise<Course[]> {
    if (this.courses.length > 0) {
      return this.courses;
    }


    const res = await (await import("./apiFetch")).apiFetch("/api/version");
    const versionDeLaAPI = await res.json();

    const storedData = localStorage.getItem("course-info-" + versionDeLaAPI);

    if (storedData) {
      console.log("Cursos recuperados de local storage");
      const convertedCourses = Mapper.toCourses(JSON.parse(storedData));
      const courses = convertedCourses as Course[];

      this.courses = courses;
    } else {
      // Eliminar la informacion desactualizada
      Object.keys(localStorage)
        .filter(key => key.startsWith("course-info-"))
        .forEach(key => localStorage.removeItem(key));

      console.log("Cursos recuperados de la API");
      const response = await (await import("./apiFetch")).apiFetch("/api/courses/all");

      const convertedCourses = Mapper.toCourses(await response.json());
      const courses = convertedCourses as Course[];

      this.courses = courses;

      localStorage.setItem(
        "course-info-" + versionDeLaAPI,
        JSON.stringify(this.courses),
      );
    }

    return this.courses;
  }

  async getCoursesByFilter(filter: Filter): Promise<Course[]> {
    return filter.filter(await this.getAll());
  }
}
