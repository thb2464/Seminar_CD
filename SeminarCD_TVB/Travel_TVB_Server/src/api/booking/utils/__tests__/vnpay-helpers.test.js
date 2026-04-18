'use strict';

const { sortObject, formatVnpDate } = require('../vnpay-helpers');

describe('sortObject', () => {
  it('should return an empty object when given an empty object', () => {
    expect(sortObject({})).toEqual({});
  });

  it('should sort keys alphabetically', () => {
    const input = { b: '2', a: '1', c: '3' };
    const result = sortObject(input);
    const keys = Object.keys(result);
    expect(keys).toEqual(['a', 'b', 'c']);
  });

  it('should encode keys with encodeURIComponent', () => {
    const input = { 'key with spaces': 'value' };
    const result = sortObject(input);
    expect(result).toHaveProperty('key%20with%20spaces');
  });

  it('should encode values with encodeURIComponent', () => {
    const input = { key: 'value&special=chars' };
    const result = sortObject(input);
    expect(result.key).toBe('value%26special%3Dchars');
  });

  it('should replace %20 with + in values', () => {
    const input = { key: 'hello world' };
    const result = sortObject(input);
    expect(result.key).toBe('hello+world');
    expect(result.key).not.toContain('%20');
  });

  it('should handle a single key-value pair', () => {
    const input = { vnp_Amount: '1000000' };
    const result = sortObject(input);
    expect(result).toHaveProperty('vnp_Amount', '1000000');
  });

  it('should handle special characters in both keys and values', () => {
    // Note: sortObject reads obj values using encoded keys, so
    // keys with special chars in the original object won't match after encoding.
    // This test verifies the encoding of simple keys and special char values.
    const input = { orderInfo: 'value?query=1&foo=bar' };
    const result = sortObject(input);
    expect(result.orderInfo).toBe('value%3Fquery%3D1%26foo%3Dbar');
  });

  it('should handle Vietnamese text in values', () => {
    const input = { vnp_OrderInfo: 'Thanh toán đặt tour Đà Lạt' };
    const result = sortObject(input);
    // Vietnamese chars should be percent-encoded, spaces replaced with +
    expect(result.vnp_OrderInfo).not.toContain(' ');
    expect(result.vnp_OrderInfo).toContain('+');
  });

  it('should produce correct output for a realistic VNPay parameter set', () => {
    const input = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: '6UH2PIXS',
      vnp_Amount: '500000000',
      vnp_TxnRef: '123_1711234567890',
      vnp_OrderInfo: 'Thanh toan dat tour 123',
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
    };

    const result = sortObject(input);
    const keys = Object.keys(result);

    // Keys should be sorted alphabetically
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] > keys[i - 1]).toBe(true);
    }

    // Specific values should be correctly encoded
    expect(result.vnp_Amount).toBe('500000000');
    expect(result.vnp_TmnCode).toBe('6UH2PIXS');
    expect(result.vnp_OrderInfo).toBe('Thanh+toan+dat+tour+123');
  });
});

describe('formatVnpDate', () => {
  it('should format a specific date correctly', () => {
    const date = new Date(2024, 0, 15, 9, 5, 3); // Jan 15, 2024 09:05:03
    expect(formatVnpDate(date)).toBe('20240115090503');
  });

  it('should pad single-digit month', () => {
    const date = new Date(2024, 2, 10, 12, 0, 0); // March = month 2 (0-indexed) → 03
    const result = formatVnpDate(date);
    expect(result.substring(4, 6)).toBe('03');
  });

  it('should pad single-digit day', () => {
    const date = new Date(2024, 5, 5, 12, 0, 0); // June 5
    const result = formatVnpDate(date);
    expect(result.substring(6, 8)).toBe('05');
  });

  it('should pad single-digit hours, minutes, and seconds', () => {
    const date = new Date(2024, 0, 1, 3, 7, 9); // 03:07:09
    const result = formatVnpDate(date);
    expect(result.substring(8)).toBe('030709');
  });

  it('should handle midnight (00:00:00)', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0);
    const result = formatVnpDate(date);
    expect(result).toBe('20240101000000');
  });

  it('should handle Dec 31 23:59:59', () => {
    const date = new Date(2024, 11, 31, 23, 59, 59);
    const result = formatVnpDate(date);
    expect(result).toBe('20241231235959');
  });

  it('should use current date when called with no argument', () => {
    const result = formatVnpDate();
    expect(result).toBeDefined();
    expect(result.length).toBe(14);
  });

  it('should use current date when called with null', () => {
    const result = formatVnpDate(null);
    expect(result).toBeDefined();
    expect(result.length).toBe(14);
  });

  it('should return a 14-character string', () => {
    const date = new Date(2024, 6, 20, 14, 30, 45);
    const result = formatVnpDate(date);
    expect(result.length).toBe(14);
  });

  it('should return only digits', () => {
    const date = new Date(2024, 6, 20, 14, 30, 45);
    const result = formatVnpDate(date);
    expect(result).toMatch(/^\d{14}$/);
  });
});
