import { CatalogSnapshotDto } from "@/application/dtos/CatalogSnapshotDto";

export interface CatalogRepository {
  loadCatalog(schoolSlug: string): Promise<CatalogSnapshotDto>;
}