import { badges, TrustIndicators } from "./indicators";
const base: TrustIndicators = {
  joined_at: "2026-01-01",
  confirmed_services: 0,
  completed_operations: 0,
  review_count: 0,
  review_average: 0,
  supported_sources: ["service"],
};
describe("insignias verificables", () => {
  it("no inventa insignias para usuarios nuevos", () =>
    expect(badges(base)).toEqual([]));
  it("usa umbrales de la actividad de origen y no de las reseñas", () => {
    expect(badges({ ...base, review_count: 100, review_average: 5 })).toEqual(
      [],
    );
    expect(
      badges({ ...base, confirmed_services: 1, completed_operations: 1 }),
    ).toEqual(["Primer servicio confirmado"]);
    expect(
      badges({ ...base, confirmed_services: 10, completed_operations: 10 }),
    ).toHaveLength(2);
  });
});
