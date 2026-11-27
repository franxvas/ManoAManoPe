import { badges, stableRating, TrustIndicators, trustLevel } from "./indicators";
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

describe("valoración estable", () => {
  it("sin reseñas devuelve 0", () => expect(stableRating(0, 0)).toBe(0));
  it("una sola reseña de 5 no gana a 40 reseñas de 4.8", () => {
    expect(stableRating(5, 1)).toBeLessThan(stableRating(4.8 * 40, 40));
  });
  it("con muchas reseñas se acerca al promedio real", () => {
    expect(stableRating(5 * 200, 200)).toBeGreaterThan(4.95);
  });
});

describe("estado de confianza", () => {
  it("usuario sin actividad es nuevo", () =>
    expect(trustLevel(base)).toBe("nuevo"));
  it("con una operación está en crecimiento", () =>
    expect(trustLevel({ ...base, completed_operations: 1 })).toBe(
      "en_crecimiento",
    ));
  const solid = {
    ...base,
    completed_operations: 6,
    review_count: 4,
    review_average: 4.3,
  };
  it("historial sólido es confiable", () =>
    expect(trustLevel(solid)).toBe("confiable"));
  it("historial sólido y DNI verificado es verificado", () =>
    expect(trustLevel({ ...solid, verified: true })).toBe("verificado"));
  it("3 denuncias recientes lo ponen en revisión", () =>
    expect(trustLevel({ ...solid, verified: true, recent_reports: 3 })).toBe(
      "en_revision",
    ));
  it("insignia de identidad verificada", () =>
    expect(badges({ ...base, verified: true })).toContain(
      "Identidad verificada",
    ));
});
