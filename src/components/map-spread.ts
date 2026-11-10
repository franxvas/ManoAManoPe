import { formatMoney, getListingAmount } from '@/utils/format';

type Placed ={ id: string; ownerId: string; latitude: number; longitude: number };

export interface Place<T extends Placed> {
  key: string;
  latitude: number;
  longitude: number;
  listings: T[];
}

const coordKey = (item: { latitude: number; longitude: number }) => `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;

// Junta en un solo punto las publicaciones de un mismo vendedor en la misma dirección (un negocio = una burbuja).
export function groupByPlace<T extends Placed>(items: T[]): Place<T>[] {
  const places = new Map<string, Place<T>>();
  for (const item of items) {
    const key = `${item.ownerId}@${coordKey(item)}`;
    const place = places.get(key) ?? { key, latitude: item.latitude, longitude: item.longitude, listings: [] };
    place.listings.push(item);
    places.set(key, place);
  }
  return [...places.values()];
}

// Un solo producto muestra su precio; varios, cuántos hay en ese negocio.
export function placeLabel(listings: { price?: number | null; budget?: number | null }[]) {
  if (listings.length > 1) return `${listings.length} productos`;
  return formatMoney(getListingAmount(listings[0]?.price, listings[0]?.budget));
}

// Si dos negocios distintos caen en el mismo punto, los reparte en un círculo pequeño para que no se tapen.
export function spreadPositions<T extends { key: string; latitude: number; longitude: number }>(items: T[], radius = 0.00035) {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(coordKey(item), [...(groups.get(coordKey(item)) ?? []), item]);
  const positions = new Map<string, { latitude: number; longitude: number }>();
  for (const group of groups.values()) {
    group.forEach((item, index) => {
      if (group.length === 1) return positions.set(item.key, { latitude: item.latitude, longitude: item.longitude });
      const angle = (2 * Math.PI * index) / group.length;
      positions.set(item.key, { latitude: item.latitude + radius * Math.sin(angle), longitude: item.longitude + radius * Math.cos(angle) });
    });
  }
  return positions;
}
