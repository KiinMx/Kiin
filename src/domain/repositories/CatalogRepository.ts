import { CatalogSnapshotDto } from "@/application/dtos/CatalogSnapshotDto";

export interface CatalogRepository {
  loadCatalog(): Promise<CatalogSnapshotDto>;
}