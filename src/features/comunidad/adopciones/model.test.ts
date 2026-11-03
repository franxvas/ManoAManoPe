import { validateAdoption } from './model';

describe('adopciones', () => {
  const valid = { petName: 'Luna', ageText: '2 años', description: 'Es tranquila y se lleva bien con niños.', conditions: 'Hogar con patio', zone: 'La Peca', photos: 2 };

  it('acepta una ficha completa', () => {
    expect(() => validateAdoption(valid)).not.toThrow();
  });

  it('rechaza descripciones muy cortas', () => {
    expect(() => validateAdoption({ ...valid, description: 'Bonita' })).toThrow();
  });
});
