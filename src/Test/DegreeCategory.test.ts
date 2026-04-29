import { Degree } from "@/domain/entities/Degree";
import DegreeCategory from "@/domain/entities/DegreeCategory";

describe("CP-1: Validar método onClick de DegreeCategory", () => {
  let degreeA: Degree;
  let degreeB: Degree;
  let degreeC: Degree;
  let category: DegreeCategory;

  beforeEach(() => {
    // 3. Flujo de Ejecución: Crear instancias de "Degree" necesarias.
    degreeA = new Degree(0, "Carrera A");
    degreeB = new Degree(1, "Carrera B");
    degreeC = new Degree(2, "Carrera C");

    // Crear instancia de "DegreeCategory"
    category = new DegreeCategory("Carreras", [degreeA, degreeB, degreeC]);
  });

  test("Caso 1: Nada seleccionado (crear DegreeCategory y verificar que selectedValues.length es 0)", () => {
    expect(category.selectedValues.length).toBe(0);
  });

  test("Caso 2: Deseleccionado", () => {
    // onClick(0) / seleccionado: Carrera A
    category.onClick(0);
    expect(category.selectedValues.length).toBe(1);
    expect(category.selectedValues[0]).toEqual(degreeA);

    // onClick(0) / seleccionado: Ninguno
    category.onClick(0);
    expect(category.selectedValues.length).toBe(0);
  });

  test("Caso 3: Reemplazo", () => {
    // onClick(0) / seleccionado: Carrera A
    category.onClick(0);
    expect(category.selectedValues.length).toBe(1);
    expect(category.selectedValues[0]).toEqual(degreeA);

    // onClick(1) / seleccionado: Carrera B
    category.onClick(1);
    expect(category.selectedValues.length).toBe(1);
    expect(category.selectedValues[0]).toEqual(degreeB);

    // onClick(2) / seleccionado: Carrera C
    category.onClick(2);
    expect(category.selectedValues.length).toBe(1);
    expect(category.selectedValues[0]).toEqual(degreeC);
  });
});
