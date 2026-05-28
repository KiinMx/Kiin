import { GenericCsvAdapter } from "@/infrastructure/adapters/GenericCsvAdapter";
import { School } from "@/domain/entities/School";

export class ArquitecturaAdapter extends GenericCsvAdapter {
  constructor() {
    super(School.ARQUITECTURA, "public/data");
  }
}
