import { parsePriceRange } from './money';
test('acepta importes y rangos en soles', () => {
  expect(parsePriceRange('S/ 140,50')).toEqual({ min: 140.5, max: null });
  expect(parsePriceRange('100–160')).toEqual({ min: 100, max: 160 });
});
test('rechaza precios negativos, rangos invertidos y texto ambiguo', () => {
  for (const text of ['-20', '160–100', '100 soles', 'NaN', '12.345'])
    expect(() => parsePriceRange(text)).toThrow();
});
