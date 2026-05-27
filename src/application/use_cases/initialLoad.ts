import "@/infrastructure/register";
import { LoadCatalogUseCase } from "@/domain/use_cases/LoadCatalogUseCase";
import { container } from "@/infrastructure/container";
import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { catalogState } from "@/infrastructure/state/catalogState";

export async function globalInitialLoad(schoolSlug: string) {
  const adapter = container.resolve<SchoolDataAdapter>("SchoolDataAdapter", schoolSlug);
  const loadCatalogUseCase = new LoadCatalogUseCase(adapter);
  const snapshot = await loadCatalogUseCase.execute();

  catalogState.schoolSlug = schoolSlug;
  catalogState.degrees = snapshot.degrees;
  catalogState.subjects = snapshot.subjects;
  catalogState.professors = snapshot.professors;
  catalogState.courses = snapshot.courses;
}
