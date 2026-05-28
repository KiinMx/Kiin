/* @jest-environment node */

import { Session } from "@/domain/entities/Session";

function buildSession(start: string, end: string, day = "Lunes", room = "A1"): Session {
  return new Session(day, Session.fromTimeString(start), Session.fromTimeString(end), room);
}

describe("Session entity", () => {
  describe("Invariantes basicas", () => {
    const sessions = [
      buildSession("08:00", "10:00"),
      buildSession("10:00", "12:00", "Martes"),
      buildSession("14:30", "16:00", "Miercoles", "B2"),
    ];

    test("toda Session tiene startHour definido y no nulo", () => {
      for (const session of sessions) {
        expect(session.startHour).not.toBeNull();
        expect(session.startHour).toBeDefined();
      }
    });

    test("toda Session tiene endHour definido y no nulo", () => {
      for (const session of sessions) {
        expect(session.endHour).not.toBeNull();
        expect(session.endHour).toBeDefined();
      }
    });

    test("endHour es siempre posterior a startHour", () => {
      for (const session of sessions) {
        expect(session.endHour).toBeGreaterThan(session.startHour);
      }
    });
  });

  describe("Session.fromTimeString", () => {
    test("convierte HH:mm a minutos absolutos", () => {
      expect(Session.fromTimeString("08:00")).toBe(480);
      expect(Session.fromTimeString("14:30")).toBe(870);
      expect(Session.fromTimeString("23:59")).toBe(1439);
    });
  });

  describe("Session.formatMinutes", () => {
    test("convierte minutos absolutos a HH:mm con padding", () => {
      expect(Session.formatMinutes(480)).toBe("08:00");
      expect(Session.formatMinutes(870)).toBe("14:30");
      expect(Session.formatMinutes(0)).toBe("00:00");
    });
  });

  describe("Accesores derivados", () => {
    test("hours/minutes y endHours/endMinutes se computan a partir de los totales", () => {
      const session = buildSession("08:30", "10:45");
      expect(session.hours).toBe(8);
      expect(session.minutes).toBe(30);
      expect(session.endHours).toBe(10);
      expect(session.endMinutes).toBe(45);
      expect(session.startHourFormatted).toBe("08:30");
      expect(session.endHourFormatted).toBe("10:45");
    });
  });
});
