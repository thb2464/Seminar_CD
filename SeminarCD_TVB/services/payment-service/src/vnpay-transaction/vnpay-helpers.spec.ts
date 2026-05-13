import { sortObject, formatVnpDate } from './vnpay-helpers';

describe('vnpay-helpers', () => {
  it('should sort object keys and encode values', () => {
    const obj = { c: '3', a: '1', b: '2 space' };
    const sorted = sortObject(obj);
    expect(Object.keys(sorted)).toEqual(['a', 'b', 'c']);
    expect(sorted['b']).toBe('2+space');
  });

  it('should format date correctly', () => {
    const d = new Date(2023, 0, 2, 14, 5, 6);
    expect(formatVnpDate(d)).toBe('20230102140506');
  });
  
  it('should default to current date', () => {
    expect(formatVnpDate()).toBeDefined();
  });
});
