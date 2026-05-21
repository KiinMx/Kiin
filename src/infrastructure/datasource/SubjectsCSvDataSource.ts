import { SubjectsDatasource } from "@/domain/datasources/SubjectsDataSource";
import { Subject } from "@/domain/entities/Subject";
import { Mapper } from "../mappers/Mapper";

export class SubjectsCsvDataSource implements SubjectsDatasource {
  private subjects: Subject[] = [];
  private readonly faculty: string;

  constructor(faculty: string = "matematicas") {
    this.faculty = faculty;
  }

  async getAll(): Promise<Subject[]> {
    if (this.subjects.length > 0) {
      return this.subjects;
    }

    const res = await fetch(`/api/version?faculty=${this.faculty}`);
    const versionDeLaAPI = await res.json();

    const cacheKey = `subject-info-${versionDeLaAPI}`;
    const storedData = localStorage.getItem(cacheKey);

    if (storedData) {
      console.log("Asignaturas recuperados de local storage");
      this.subjects = Mapper.toSubjects(JSON.parse(storedData)) as Subject[];
    } else {
      Object.keys(localStorage)
        .filter(key => key.startsWith(`subject-info-`) && key.includes(`_${this.faculty}_`))
        .forEach(key => localStorage.removeItem(key));

      console.log("Asignaturas recuperados de la API");
      const response = await fetch(`/api/subjects/all?faculty=${this.faculty}`);
      this.subjects = Mapper.toSubjects(await response.json()) as Subject[];
      localStorage.setItem(cacheKey, JSON.stringify(this.subjects));
    }

    return this.subjects;
  }
}
