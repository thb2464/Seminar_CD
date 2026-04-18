'use strict';

/**
 * VNPay helper utilities extracted from the booking controller.
 * These are pure functions with no side effects, making them highly testable.
 */

/**
 * VNPay's official sortObject — encodes keys AND values.
 * This is critical for HMAC SHA512 signature generation and verification.
 *
 * @param {Object} obj - The parameters to sort and encode
 * @returns {Object} Sorted object with encoded keys and values
 */
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

/**
 * Formats a Date object into VNPay's required date string format: YYYYMMDDHHmmss
 *
 * @param {Date} [date] - The date to format. Defaults to current date/time.
 * @returns {string} 14-character date string in YYYYMMDDHHmmss format
 */
function formatVnpDate(date) {
  const d = date || new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

module.exports = { sortObject, formatVnpDate };
