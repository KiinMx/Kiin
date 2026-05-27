import { LoadCatalogUseCase } from "@/domain/use_cases/LoadCatalogUseCase";
import { CatalogRepositoryImpl } from "@/infrastructure/repositories/CatalogRepositoryImpl";
import { catalogState } from "@/infrastructure/state/catalogState";

export async function globalInitialLoad() {
  const loadCatalogUseCase = new LoadCatalogUseCase(new CatalogRepositoryImpl());
  const snapshot = await loadCatalogUseCase.execute();

  catalogState.degrees = snapshot.degrees;
  catalogState.subjects = snapshot.subjects;
  catalogState.professors = snapshot.professors;
  catalogState.courses = snapshot.courses;

}