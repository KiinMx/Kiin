import { CatalogSnapshotDto } from "@/application/dtos/CatalogSnapshotDto";
import { CatalogRepository } from "@/domain/repositories/CatalogRepository";

export class LoadCatalogUseCase {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async execute(): Promise<CatalogSnapshotDto> {
    return this.catalogRepository.loadCatalog();
  }
}