import { CatalogSnapshotDto } from "@/application/dtos/CatalogSnapshotDto";
import { School } from "@/domain/entities/School";

export interface SchoolDataAdapter {
  getSchool(): School;
  fetchCatalog(): Promise<CatalogSnapshotDto>;
}