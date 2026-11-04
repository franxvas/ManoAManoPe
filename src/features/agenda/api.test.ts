import { futureInterval } from "./api";
jest.mock("@/lib/supabase", () => ({ supabase: null }));
describe("horarios de atención", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-04T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());
  it("interpreta las horas en Perú", () => {
    expect(futureInterval("2026-11-05", "09:00", "10:00")).toEqual({
      start: "2026-11-05T14:00:00.000Z",
      end: "2026-11-05T15:00:00.000Z",
    });
  });
  it("rechaza fechas inexistentes y horas invertidas o pasadas", () => {
    expect(() => futureInterval("2027-02-30", "09:00", "10:00")).toThrow();
    expect(() => futureInterval("2026-11-05", "10:00", "09:00")).toThrow();
    expect(() => futureInterval("2026-11-01", "09:00", "10:00")).toThrow();
  });
});
