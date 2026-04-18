import '@testing-library/jest-dom';

// Reset storages between tests
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.location for redirect tests
const locationMock = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  origin: 'http://localhost:5173',
  pathname: '/',
  search: '',
  hash: '',
};
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true,
});

// Reset location.href between tests
beforeEach(() => {
  window.location.href = '';
  window.location.assign.mockClear?.();
  window.location.replace.mockClear?.();
});

// Mock requestAnimationFrame / cancelAnimationFrame for useCountUp
let rafId = 0;
window.requestAnimationFrame = (cb) => {
  rafId += 1;
  const id = rafId;
  setTimeout(() => cb(performance.now()), 0);
  return id;
};
window.cancelAnimationFrame = (id) => clearTimeout(id);

// Suppress console.log/console.error noise in tests (keep warnings)
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
