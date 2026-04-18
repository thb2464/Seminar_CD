import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';

/**
 * Renders a component wrapped in MemoryRouter + LanguageProvider.
 * NOTE: We do NOT wrap with AuthProvider here because most tests
 * mock useAuth directly to control auth state.
 */
export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Creates a mock Response-like object for mocking fetch.
 */
export function mockFetchResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    clone: function () {
      return { json: () => Promise.resolve(data) };
    },
  };
}

// Re-export everything from RTL for convenience
export * from '@testing-library/react';
