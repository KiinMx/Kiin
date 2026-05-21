import { ProfessorsDataSource } from "@/domain/datasources/ProfessorsDataSource";
import { Professor } from "@/domain/entities/Professor";
import { Mapper } from "../mappers/Mapper";

export class ProfessorsCsvDataSource implements ProfessorsDataSource {
  private professors: Professor[] = [];
  private readonly faculty: string;

  constructor(faculty: string = "matematicas") {
    this.faculty = faculty;
  }

  async getAll(): Promise<Professor[]> {
    if (this.professors.length > 0) {
      return this.professors;
    }

    const res = await fetch(`/api/version?faculty=${this.faculty}`);
    const versionDeLaAPI = await res.json();

    const cacheKey = `professor-info-${versionDeLaAPI}`;
    const storedData = localStorage.getItem(cacheKey);

    if (storedData) {
      console.log("Profesores recuperados de local storage");
      this.professors = Mapper.toProfessors(JSON.parse(storedData)) as Professor[];
    } else {
      Object.keys(localStorage)
        .filter(key => key.startsWith(`professor-info-`) && key.includes(`_${this.faculty}_`))
        .forEach(key => localStorage.removeItem(key));

      console.log("Profesores recuperados de la API");
      const response = await fetch(`/api/professors/all?faculty=${this.faculty}`);
      this.professors = Mapper.toProfessors(await response.json()) as Professor[];
      localStorage.setItem(cacheKey, JSON.stringify(this.professors));
    }

    return this.professors;
  }
}
