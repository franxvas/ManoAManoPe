import { imageType, validateWork } from "./model";
describe("portafolio", () => {
  it("rechaza archivos falsos y archivos demasiado grandes", () => {
    expect(() => imageType(new Uint8Array([1, 2, 3]))).toThrow();
    expect(() => imageType(new Uint8Array(8388609))).toThrow();
    expect(imageType(new Uint8Array([255, 216, 255, 1]))).toBe("image/jpeg");
  });
  it("valida mes, descripción y número de imágenes", () => {
    expect(() =>
      validateWork(
        "Mesa nueva",
        "Muebles",
        "Trabajo hecho con madera y acabado mate",
        "2026-01",
        1,
      ),
    ).not.toThrow();
    expect(() =>
      validateWork(
        "Mesa nueva",
        "Muebles",
        "Trabajo hecho con madera y acabado mate",
        "2099-01",
        1,
      ),
    ).toThrow();
    expect(() =>
      validateWork(
        "Mesa nueva",
        "Muebles",
        "Trabajo hecho con madera y acabado mate",
        "2026-01",
        0,
      ),
    ).toThrow();
  });
});
