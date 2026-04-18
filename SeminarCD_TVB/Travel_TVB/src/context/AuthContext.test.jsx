import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Helper component to read auth context values
function AuthConsumer() {
  const { user, token, loading, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="token">{token || 'null'}</span>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Initial state ---

  describe('initial state', () => {
    it('should have user=null when no token in localStorage', async () => {
      global.fetch.mockResolvedValue({ ok: false });
      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should have isAuthenticated=false when no token', async () => {
      global.fetch.mockResolvedValue({ ok: false });
      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  // --- verifyToken on mount ---

  describe('verifyToken on mount', () => {
    it('should fetch /api/users/me with Bearer token from localStorage', async () => {
      localStorage.setItem('jwt_token', 'existing-token-123');
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, username: 'testuser', email: 'test@test.com' }),
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/me'),
          expect.objectContaining({
            headers: { Authorization: 'Bearer existing-token-123' },
          })
        );
      });
    });

    it('should set user when response is ok', async () => {
      localStorage.setItem('jwt_token', 'valid-token');
      const userData = { id: 1, username: 'testuser', email: 'test@test.com' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(userData),
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('"testuser"');
    });

    it('should clear token and user when response is 401', async () => {
      localStorage.setItem('jwt_token', 'expired-token');
      global.fetch.mockResolvedValue({ ok: false, status: 401 });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('should clear token and user on network error', async () => {
      localStorage.setItem('jwt_token', 'some-token');
      global.fetch.mockRejectedValue(new Error('Network error'));

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });
  });

  // --- login() ---

  describe('login()', () => {
    it('should call /api/auth/local with POST and correct body', async () => {
      // No token in localStorage → verifyToken returns early without fetch
      // Mock 1: login POST call
      // Mock 2: verifyToken re-fires after setToken
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ jwt: 'new-jwt', user: { id: 1, username: 'user1' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1, username: 'user1' }),
        });

      let loginFn;
      function LoginTrigger() {
        const auth = useAuth();
        loginFn = auth.login;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginTrigger />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(loginFn).toBeDefined());

      await act(async () => {
        await loginFn('user@test.com', 'password123');
      });

      const loginCall = global.fetch.mock.calls.find(call =>
        call[0].includes('/api/auth/local') && !call[0].includes('register') && !call[0].includes('users/me')
      );
      expect(loginCall).toBeDefined();
      expect(loginCall[1].method).toBe('POST');

      const body = JSON.parse(loginCall[1].body);
      expect(body.identifier).toBe('user@test.com');
      expect(body.password).toBe('password123');
    });

    it('should store JWT in localStorage on success', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ jwt: 'login-jwt-token', user: { id: 1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        });

      let loginFn;
      function LoginTrigger() {
        loginFn = useAuth().login;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider><LoginTrigger /></AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(loginFn).toBeDefined());
      await act(async () => { await loginFn('user', 'pass'); });

      expect(localStorage.getItem('jwt_token')).toBe('login-jwt-token');
    });

    it('should throw error on login failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Invalid credentials' } }),
        });

      let loginFn;
      function LoginTrigger() {
        loginFn = useAuth().login;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider><LoginTrigger /></AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(loginFn).toBeDefined());
      await expect(act(() => loginFn('bad', 'creds'))).rejects.toThrow('Invalid credentials');
    });
  });

  // --- register() ---

  describe('register()', () => {
    it('should call /api/auth/local/register with POST body', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ jwt: 'reg-jwt', user: { id: 2 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 2 }),
        });

      let registerFn;
      function RegTrigger() {
        registerFn = useAuth().register;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider><RegTrigger /></AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(registerFn).toBeDefined());
      await act(async () => {
        await registerFn({ username: 'newuser', email: 'new@test.com', password: 'pass123', full_name: 'New User', phone: '123' });
      });

      const regCall = global.fetch.mock.calls.find(call => call[0].includes('/register'));
      expect(regCall).toBeDefined();

      const body = JSON.parse(regCall[1].body);
      expect(body.username).toBe('newuser');
      expect(body.email).toBe('new@test.com');
      expect(body.full_name).toBe('New User');
    });

    it('should throw error on registration failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Email already taken' } }),
        });

      let registerFn;
      function RegTrigger() {
        registerFn = useAuth().register;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider><RegTrigger /></AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(registerFn).toBeDefined());
      await expect(act(() => registerFn({ username: 'u', email: 'e', password: 'p' }))).rejects.toThrow('Email already taken');
    });
  });

  // --- logout() ---

  describe('logout()', () => {
    it('should remove jwt_token from localStorage and clear user', async () => {
      localStorage.setItem('jwt_token', 'token-to-remove');
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, username: 'user' }),
      });

      let logoutFn;
      function LogoutTrigger() {
        const auth = useAuth();
        logoutFn = auth.logout;
        return (
          <span data-testid="auth">{String(auth.isAuthenticated)}</span>
        );
      }

      render(
        <MemoryRouter>
          <AuthProvider><LogoutTrigger /></AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth')).toHaveTextContent('true');
      });

      act(() => { logoutFn(); });

      expect(localStorage.getItem('jwt_token')).toBeNull();
      expect(screen.getByTestId('auth')).toHaveTextContent('false');
    });
  });
});
