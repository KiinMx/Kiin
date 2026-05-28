/* @jest-environment node */
import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { LoadCatalogUseCase } from "@/domain/use_cases/LoadCatalogUseCase";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";

class InMemoryAdapter implements SchoolDataAdapter {
  constructor(private readonly snapshot: AcademicOfferDto) { }
  async fetchCatalog(): Promise<AcademicOfferDto> {
    return this.snapshot;
  }
}

describe("LoadCatalogUseCase", () => {
  test("devuelve arreglos vacios cuando el adapter no expone datos", async () => {
    const adapter = new InMemoryAdapter({degrees: [], subjects: [], professors: [], courses: [],
  });

    const useCase = new LoadCatalogUseCase(adapter);
    const snapshot = await useCase.execute();

    expect(snapshot.degrees).toEqual([]);
    expect(snapshot.subjects).toEqual([]);
    expect(snapshot.professors).toEqual([]);
    expect(snapshot.courses).toEqual([]);
  });

  test("propaga el snapshot completo provisto por el adapter", async () => {
    const degree = new Degree(1, "Ingenieria");
    const subject = new Subject(10, "Matematicas", "Ing", "M21", "Teorica", [1], 6);
    const professor = new Professor(100, "Ana", "Lopez");
    const course = new Course(1000, subject, professor, "G1", "Presencial", 4, false);

    const adapter = new InMemoryAdapter({
      degrees: [degree],
      subjects: [subject],
      professors: [professor],
      courses: [course],
    });

    const snapshot = await new LoadCatalogUseCase(adapter).execute();

    expect(snapshot.degrees).toHaveLength(1);
    expect(snapshot.degrees[0].id).toBe(1);
    expect(snapshot.subjects[0].name).toBe("Matematicas");
    expect(snapshot.professors[0].fullName).toBe("Ana Lopez");
    expect(snapshot.courses[0].id).toBe(1000);
  });

  test("delega la obtencion al adapter (verifica el contrato del puerto)", async () => {
    const fetchCatalog = jest.fn().mockResolvedValue({
      degrees: [], subjects: [], professors: [], courses: [],
    } satisfies AcademicOfferDto);
    const adapter: SchoolDataAdapter = { fetchCatalog };

    await new LoadCatalogUseCase(adapter).execute();

    expect(fetchCatalog).toHaveBeenCalledTimes(1);
  });
});
