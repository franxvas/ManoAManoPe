import { spreadPositions } from './map-spread';

describe('burbujas del mapa', () => {
  it('deja igual una publicación sola y separa las que comparten punto', () => {
    const positions = spreadPositions([
      { id: 'a', latitude: -5.6, longitude: -78.5 },
      { id: 'b', latitude: -5.7, longitude: -78.6 },
      { id: 'c', latitude: -5.7, longitude: -78.6 },
    ]);
    expect(positions.get('a')).toEqual({ latitude: -5.6, longitude: -78.5 });
    expect(positions.get('b')).not.toEqual(positions.get('c'));
  });
});
