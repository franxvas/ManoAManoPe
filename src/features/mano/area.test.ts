import { approximateArea, distanceKm, nearby } from './area';
test('solo publica coordenadas aproximadas', () => {
  expect(
    approximateArea({ latitude: -5.639483, longitude: -78.531283 }),
  ).toEqual({ latitude: -5.64, longitude: -78.53 });
  expect(() => approximateArea({ latitude: 100, longitude: 0 })).toThrow();
});
test('ordena y filtra distancias sin tratar zonas desconocidas como cercanas', () => {
  expect(
    distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }),
  ).toBeCloseTo(111.195, 2);
  const rows = [
    { id: 'unknown' },
    { id: 'near', approximate_latitude: 0, approximate_longitude: 0.01 },
    { id: 'far', approximate_latitude: 0, approximate_longitude: 1 },
  ];
  expect(
    nearby(rows, { latitude: 0, longitude: 0 }, 5).map((r) => r.id),
  ).toEqual(['near']);
  expect(nearby(rows, null, null)).toHaveLength(3);
});
