import * as Location from "expo-location";
import { Platform } from "react-native";
import { readCache, writeCache } from "@/features/offline/cache";
export interface Ubigeo {
  departamento: string;
  provincia: string;
  distrito: string;
  nombre: string;
}
const endpoint =
  "https://jmc-software-x.github.io/public-ubigeo-pe/data/ubigeo-inei.json";
export const normalizePlace = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(departamento|region|provincia|distrito) (de |del )?/, "")
    .trim();
export async function peruLocations(): Promise<Ubigeo[]> {
  const cached = await readCache<Ubigeo[]>("peru-ubigeo-v2");
  if (cached?.length) return cached;
  const response = await fetch(endpoint);
  if (!response.ok)
    throw new Error("No pudimos cargar las localidades. Revisa tu conexión.");
  const data: unknown = await response.json();
  if (
    !Array.isArray(data) ||
    data.length < 1000 ||
    !data.every(
      (r) =>
        typeof r.nombre === "string" &&
        typeof r.departamento === "string" &&
        typeof r.provincia === "string" &&
        typeof r.distrito === "string",
    )
  )
    throw new Error("El catálogo de localidades no está disponible.");
  const codes = new Set<string>();
  const rows = (data as Ubigeo[]).filter(row=>{
    const code=row.departamento+row.provincia+row.distrito;
    if(codes.has(code))return false;
    codes.add(code);return true;
  });
  await writeCache("peru-ubigeo-v2", rows).catch(() => {});
  return rows;
}
export async function resolvePeruLocation(
  coords: { latitude: number; longitude: number },
  rows: Ubigeo[],
) {
  let region = "",
    names: string[] = [];
  if (Platform.OS === "web") {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&accept-language=es`;
    const r = await fetch(url);
    if (!r.ok)
      throw new Error(
        "No pudimos identificar tu distrito. Elígelo en la lista.",
      );
    const a = (await r.json()).address;
    if (a?.country_code !== "pe")
      throw new Error(
        "La ubicación está fuera del Perú. Elige una localidad peruana.",
      );
    region = a.state ?? a.region ?? "";
    names = [
      a.city_district,
      a.town,
      a.city,
      a.village,
      a.county,
      a.suburb,
    ].filter(Boolean);
  } else {
    const [p] = await Location.reverseGeocodeAsync(coords);
    if (!p || p.isoCountryCode !== "PE")
      throw new Error(
        "No pudimos identificar una localidad del Perú. Selecciónala en la lista.",
      );
    region = p.region ?? "";
    names = [p.district, p.city, p.subregion].filter((x): x is string => !!x);
  }
  const dep = rows.find(
    (r) =>
      r.provincia === "00" &&
      normalizePlace(r.nombre) === normalizePlace(region),
  );
  if (!dep)
    throw new Error(
      "No pudimos reconocer la región. Selecciónala en la lista.",
    );
  const district = names
    .map((n) =>
      rows.filter(
        (r) =>
          r.departamento === dep.departamento &&
          r.distrito !== "00" &&
          normalizePlace(r.nombre) === normalizePlace(n),
      ),
    )
    .find((matches) => matches.length === 1)?.[0];
  if (!district)
    throw new Error(
      `Tu región es ${dep.nombre}. Selecciona la provincia y el distrito para confirmar.`,
    );
  return {
    region: dep.nombre,
    city: district.nombre,
    province: district.provincia,
  };
}
export async function locateDistrict(
  region: string,
  province: string,
  city: string,
) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=pe&limit=1&q=${encodeURIComponent(`${city}, ${province}, ${region}, Perú`)}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      "No pudimos ubicar el distrito. Inténtalo otra vez o usa tu ubicación.",
    );
  const [row] = await response.json();
  if (!row)
    throw new Error(
      "No encontramos la localidad en el mapa. Usa tu ubicación actual.",
    );
  return { latitude: Number(row.lat), longitude: Number(row.lon) };
}
