/* @jest-environment node */
import { CatalogRepositoryImpl } from "@/infrastructure/repositories/CatalogRepositoryImpl";

jest.mock("@/infrastructure/datasource/CoursesModelDAO", () => ({
  CoursesModelDao: { getCourses: jest.fn().mockResolvedValue([]) }
}));

describe("CatalogRepositoryImpl", () => {
  test("loadCatalog returns empty arrays when no rows", async () => {
    const repo = new CatalogRepositoryImpl();
    const snapshot = await repo.loadCatalog();

    expect(snapshot.degrees).toEqual([]);
    expect(snapshot.subjects).toEqual([]);
    expect(snapshot.professors).toEqual([]);
    expect(snapshot.courses).toEqual([]);
  });
});
