import { GenericCsvAdapter } from "@/infrastructure/adapters/GenericCsvAdapter";
import { School } from "@/domain/entities/School";

export class PsicologiaAdapter extends GenericCsvAdapter {
  constructor() {
    super(School.PSICOLOGIA, "public/data");
  }
}
