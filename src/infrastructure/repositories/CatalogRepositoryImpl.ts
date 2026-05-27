import { CatalogSnapshotDto } from "@/application/dtos/CatalogSnapshotDto";
import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";
import { CatalogRepository } from "@/domain/repositories/CatalogRepository";
import { GenericCsvAdapter } from "@/infrastructure/adapters/GenericCsvAdapter";
import { School } from "@/domain/entities/School";

const DATA_DIR = 'public/data';

export class CatalogRepositoryImpl implements CatalogRepository {
  private adapters: Map<string, SchoolDataAdapter> = new Map();

  async loadCatalog(schoolSlug: string): Promise<CatalogSnapshotDto> {
    const adapter = this.getAdapter(schoolSlug);
    return adapter.fetchCatalog();
  }

  private getAdapter(schoolSlug: string): SchoolDataAdapter {
    const cached = this.adapters.get(schoolSlug);
    if (cached) return cached;

    const school = School.fromSlug(schoolSlug);
    if (!school) {
      throw new Error(`Unknown school slug: "${schoolSlug}". Available: ${School.ALL.map(s => s.slug).join(', ')}`);
    }

    const adapter = new GenericCsvAdapter(school, DATA_DIR);
    this.adapters.set(schoolSlug, adapter);
    return adapter;
  }
}