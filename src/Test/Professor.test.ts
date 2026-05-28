/* @jest-environment node */

import { Professor } from "@/domain/entities/Professor";

describe("Professor entity", () => {
  test("expone id, names y lastNames pasados al constructor", () => {
    const professor = new Professor(7, "Juan", "Perez");

    expect(professor.id).toBe(7);
    expect(professor.names).toBe("Juan");
    expect(professor.lastNames).toBe("Perez");
  });

  test("fullName concatena nombres y apellidos con un espacio", () => {
    const professor = new Professor(1, "Ana", "Gomez Lopez");
    expect(professor.fullName).toBe("Ana Gomez Lopez");
  });

  test("dos profesores distintos siempre tienen un fullName no vacio", () => {
    const professors = [
      new Professor(1, "A", "B"),
      new Professor(2, "C", "D"),
      new Professor(3, "E", "F"),
    ];

    for (const professor of professors) {
      expect(professor.fullName).toBeDefined();
      expect(professor.fullName.trim()).not.toBe("");
    }
  });

  test("identidad: dos Professor con el mismo id son la misma entidad logicamente", () => {
    const a = new Professor(42, "X", "Y");
    const b = new Professor(42, "X", "Y");

    expect(a).not.toBe(b);
    expect(a.id).toBe(b.id);
  });
});
