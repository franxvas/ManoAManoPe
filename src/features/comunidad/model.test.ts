import { validateAdoption, validateDonation } from './model';

describe('donaciones', () => {
  const valid = { title: 'Mesa de madera', zone: 'Centro', pickupTerms: 'Sábado por la mañana', quantity: '1', photos: 1 };

  it('acepta una donación completa', () => {
    expect(() => validateDonation(valid)).not.toThrow();
  });

  it('pide cantidad válida y al menos una foto', () => {
    expect(() => validateDonation({ ...valid, quantity: '0' })).toThrow();
    expect(() => validateDonation({ ...valid, quantity: '1.5' })).toThrow();
    expect(() => validateDonation({ ...valid, photos: 0 })).toThrow();
  });
});

describe('adopciones', () => {
  const valid = { petName: 'Luna', ageText: '2 años', description: 'Es tranquila y se lleva bien con niños.', conditions: 'Hogar con patio', zone: 'La Peca', photos: 2 };

  it('acepta una ficha completa', () => {
    expect(() => validateAdoption(valid)).not.toThrow();
  });

  it('rechaza descripciones muy cortas', () => {
    expect(() => validateAdoption({ ...valid, description: 'Bonita' })).toThrow();
  });
});
