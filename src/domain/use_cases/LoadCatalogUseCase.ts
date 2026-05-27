import { AcademicOfferDto } from "@/application/dtos/AcademicOfferDto";
import { SchoolDataAdapter } from "@/application/ports/SchoolDataAdapter";

export class LoadCatalogUseCase {
  constructor(private readonly adapter: SchoolDataAdapter) {}

  async execute(): Promise<AcademicOfferDto> {
    return this.adapter.fetchCatalog();
  }
}
