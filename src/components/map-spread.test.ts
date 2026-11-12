import { groupByPlace, spreadPositions } from './map-spread';

describe('burbujas del mapa', () => {
  const items = [
    { id: 'martillo', ownerId: 'ferreteria', latitude: -5.638, longitude: -78.537 },
    { id: 'clavos', ownerId: 'ferreteria', latitude: -5.638, longitude: -78.537 },
    { id: 'pan', ownerId: 'panaderia', latitude: -5.638, longitude: -78.537 },
  ];

  it('junta los productos de un negocio en una sola burbuja', () => {
    const places = groupByPlace(items);
    expect(places).toHaveLength(2);
    expect(places[0]!.listings.map((item) => item.id)).toEqual(['martillo', 'clavos']);
  });

  it('separa dos negocios distintos que están en el mismo punto', () => {
    const positions = spreadPositions(groupByPlace(items));
    const [a, b] = [...positions.values()];
    expect(a).not.toEqual(b);
  });
});
