import { LoadCatalogUseCase } from "@/domain/use_cases/LoadCatalogUseCase";
import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { catalogState } from "@/infrastructure/state/catalogState";
import { School } from "@/domain/entities/School";
import { FmatAdapter } from "@/infrastructure/adapters/FmatAdapter";
import { GenericCsvAdapter } from "@/infrastructure/adapters/GenericCsvAdapter";
import { ArquitecturaAdapter } from "@/infrastructure/adapters/ArquitecturaAdapter";
import { PsicologiaAdapter } from "@/infrastructure/adapters/PsicologiaAdapter";

function resolveAdapter(schoolSlug: string): SchoolDataAdapter {
  const school = School.fromSlug(schoolSlug);
  if (!school) {
    throw new Error(`Unknown school slug: "${schoolSlug}". Available: ${School.ALL.map(s => s.slug).join(", ")}`);
  }

  if (schoolSlug === "fmat") {
    return new FmatAdapter("public/data/fmat");
  }

  if (schoolSlug === "psicologia") {
    return new PsicologiaAdapter();
  }

  if (schoolSlug === "arquitectura") {
    return new ArquitecturaAdapter();
  }

  return new GenericCsvAdapter(school, "public/data");
}

export async function globalInitialLoad(schoolSlug: string) {
  const adapter = resolveAdapter(schoolSlug);
  const loadCatalogUseCase = new LoadCatalogUseCase(adapter);
  const snapshot = await loadCatalogUseCase.execute();

  catalogState.schoolSlug = schoolSlug;
  catalogState.degrees = snapshot.degrees;
  catalogState.subjects = snapshot.subjects;
  catalogState.professors = snapshot.professors;
  catalogState.courses = snapshot.courses;
}
