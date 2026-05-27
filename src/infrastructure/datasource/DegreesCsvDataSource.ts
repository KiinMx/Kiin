import { DegreesDataSource } from "@/domain/datasources/DegreesDataSource";
import { Mapper } from "../mappers/Mapper";
import { Degree } from "@/domain/entities/Degree";

export class DegreesCsvDataSource implements DegreesDataSource {
  private degrees: Degree[] = [];

  async getAll(): Promise<Degree[]> {
    if (this.degrees.length > 0) {
      return this.degrees;
    }


    const res = await (await import("./apiFetch")).apiFetch("/api/version");
    const versionDeLaAPI = await res.json();

    const storedData = localStorage.getItem("degree-info-" + versionDeLaAPI);

    if (storedData) {
      console.log("Grados recuperados de local storage");
      const convertedDegrees = Mapper.toDegrees(JSON.parse(storedData));
      const degrees = convertedDegrees as Degree[];

      this.degrees = degrees;
    } else {
      // Eliminar la informacion desactualizada
      // Eliminar todas las claves que comienzan con "degree-info-"
      Object.keys(localStorage)
        .filter(key => key.startsWith("degree-info-"))
        .forEach(key => localStorage.removeItem(key));

      console.log("Recuperado de la API");
      const response = await (await import("./apiFetch")).apiFetch("/api/degrees/all");

      const convertedDegrees = Mapper.toDegrees(await response.json());
      const degrees = convertedDegrees as Degree[];

      this.degrees = degrees;

      localStorage.setItem(
        "degree-info-" + versionDeLaAPI,
        JSON.stringify(this.degrees),
      );
    }

    return this.degrees;
  }
}
