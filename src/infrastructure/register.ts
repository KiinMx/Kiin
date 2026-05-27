import { container } from "@/infrastructure/container";
import { GenericCsvAdapter } from "@/infrastructure/adapters/GenericCsvAdapter";
import { School } from "@/domain/entities/School";

container.register("SchoolDataAdapter", (schoolSlug: string) => {
  const school = School.fromSlug(schoolSlug);
  if (!school) {
    throw new Error(`Unknown school: ${schoolSlug}`);
  }
  return new GenericCsvAdapter(school, "public/data");
});
