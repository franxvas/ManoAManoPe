// Si varias publicaciones caen en el mismo punto, las reparte en un círculo pequeño para que no se tapen.
export function spreadPositions<T extends { id: string; latitude: number; longitude: number }>(items: T[], radius = 0.00035) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const positions = new Map<string, { latitude: number; longitude: number }>();
  for (const group of groups.values()) {
    group.forEach((item, index) => {
      if (group.length === 1) return positions.set(item.id, { latitude: item.latitude, longitude: item.longitude });
      const angle = (2 * Math.PI * index) / group.length;
      const ring = radius * Math.max(1, group.length / 6);
      positions.set(item.id, { latitude: item.latitude + ring * Math.sin(angle), longitude: item.longitude + ring * Math.cos(angle) });
    });
  }
  return positions;
}
