import { formatMoney, getListingAmount } from '@/utils/format';

describe('format utilities', () => {
  it('formats Peruvian soles and supports an agreed amount', () => {
    expect(formatMoney(1800)).toBe('S/ 1,800');
    expect(formatMoney()).toBe('A convenir');
  });

  it('uses price before budget', () => {
    expect(getListingAmount(120, 90)).toBe(120);
    expect(getListingAmount(undefined, 90)).toBe(90);
  });
});
