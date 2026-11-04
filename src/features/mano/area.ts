export interface ApproximateArea {
  latitude: number;
  longitude: number;
}
export function approximateArea(area: ApproximateArea): ApproximateArea {
  if (
    !Number.isFinite(area.latitude) ||
    !Number.isFinite(area.longitude) ||
    Math.abs(area.latitude) > 90 ||
    Math.abs(area.longitude) > 180
  )
    throw Error('Coordenadas inválidas.');
  return {
    latitude: Math.round(area.latitude * 100) / 100,
    longitude: Math.round(area.longitude * 100) / 100,
  };
}
export function distanceKm(a: ApproximateArea, b: ApproximateArea) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const dlat = rad(b.latitude - a.latitude),
    dlon = rad(b.longitude - a.longitude);
  const n =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, n))));
}
export function nearby<
  T extends {
    approximate_latitude?: number | null;
    approximate_longitude?: number | null;
  },
>(rows: T[], origin: ApproximateArea | null, radius: number | null) {
  return rows
    .map((row) => ({
      ...row,
      distance:
        origin &&
        row.approximate_latitude != null &&
        row.approximate_longitude != null
          ? distanceKm(origin, {
              latitude: row.approximate_latitude,
              longitude: row.approximate_longitude,
            })
          : null,
    }))
    .filter(
      (row) =>
        radius == null || (row.distance != null && row.distance <= radius),
    )
    .sort((a, b) =>
      origin ? (a.distance ?? Infinity) - (b.distance ?? Infinity) : 0,
    );
}
