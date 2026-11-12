import type { Ubigeo } from './peru';

// Provincias de un departamento. Algunas filas de la fuente vienen con el código de provincia mal
// (Bagua llega como "00"), así que se arman desde los distritos y, si falta el nombre, se usa el del distrito capital.
export function provinceOptions(rows: Ubigeo[], department?: string) {
  if (!department) return [];
  const codes = [...new Set(rows.filter((r) => r.departamento === department && r.provincia !== "00").map((r) => r.provincia))].sort();
  return codes.map((code) => {
    const own = rows.find((r) => r.departamento === department && r.provincia === code && r.distrito === "00");
    const capital = rows.find((r) => r.departamento === department && r.provincia === code && r.distrito === "01");
    return { value: code, label: own?.nombre ?? capital?.nombre ?? code };
  });
}
