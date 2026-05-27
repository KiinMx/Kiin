import { ProfessorsDataSource } from "@/domain/datasources/ProfessorsDataSource";
import { Professor } from "@/domain/entities/Professor";
import { Mapper } from "../mappers/Mapper";

export class ProfessorsCsvDataSource implements ProfessorsDataSource {
  private professors: Professor[] = [];

  async getAll(): Promise<Professor[]> {
    if (this.professors.length > 0) {
      return this.professors;
    }


    const res = await (await import("./apiFetch")).apiFetch("/api/version");
    const versionDeLaAPI = await res.json();

    const storedData = localStorage.getItem("professor-info-" + versionDeLaAPI);

    if (storedData) {
      console.log("Profesores recuperados de local storage");
      const convertedDegrees = Mapper.toProfessors(JSON.parse(storedData));
      const professors = convertedDegrees as Professor[];

      this.professors = professors;
    } else {
      // Eliminar la informacion desactualizada
    Object.keys(localStorage)
      .filter(key => key.startsWith("professor-info-"))
      .forEach(key => localStorage.removeItem(key));
      console.log("Profesores recuperados de la API");
      const response = await (await import("./apiFetch")).apiFetch("/api/professors/all");

      const convertedDegrees = Mapper.toProfessors(await response.json());
      const professors = convertedDegrees as Professor[];

      this.professors = professors;

      localStorage.setItem(
        "professor-info-" + versionDeLaAPI,
        JSON.stringify(this.professors),
      );
    }

    return this.professors;
  }
}
