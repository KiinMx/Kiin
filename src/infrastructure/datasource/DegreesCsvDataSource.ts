import { DegreesDataSource } from "@/domain/datasources/DegreesDataSource";
import { Degree } from "@/domain/entities/Degree";
import { Mapper } from "../mappers/Mapper";

export class DegreesCsvDataSource implements DegreesDataSource {
  private degrees: Degree[] = [];
  private readonly faculty: string;

  constructor(faculty: string = "matematicas") {
    this.faculty = faculty;
  }

  async getAll(): Promise<Degree[]> {
    if (this.degrees.length > 0) {
      return this.degrees;
    }

    const res = await fetch(`/api/version?faculty=${this.faculty}`);
    const versionDeLaAPI = await res.json();

    const cacheKey = `degree-info-${versionDeLaAPI}`;
    const storedData = localStorage.getItem(cacheKey);

    if (storedData) {
      console.log("Grados recuperados de local storage");
      this.degrees = Mapper.toDegrees(JSON.parse(storedData)) as Degree[];
    } else {
      Object.keys(localStorage)
        .filter(key => key.startsWith(`degree-info-`) && key.includes(`_${this.faculty}_`))
        .forEach(key => localStorage.removeItem(key));

      console.log("Recuperado de la API");
      const response = await fetch(`/api/degrees/all?faculty=${this.faculty}`);
      this.degrees = Mapper.toDegrees(await response.json()) as Degree[];
      localStorage.setItem(cacheKey, JSON.stringify(this.degrees));
    }

    return this.degrees;
  }
}
