import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";

export interface SchoolDataAdapter {
  fetchCatalog(): Promise<AcademicOfferDto>;
}
