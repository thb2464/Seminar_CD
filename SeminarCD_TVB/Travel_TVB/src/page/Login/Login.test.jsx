import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/test-utils';
import Login from './Login';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => {
      // Filter out framer-motion specific props
      const { variants, initial, animate, whileHover, whileTap, ...domProps } = props;
      return <div ref={ref} {...domProps}>{children}</div>;
    }),
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useLanguage
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    currentLanguage: { code: 'en', name: 'English', flag: '🇺🇸' },
  })),
  LanguageProvider: ({ children }) => children,
}));

const { useAuth } = await import('../../context/AuthContext');

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

// Mock react-router-dom navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it('should render login form with email and password fields', () => {
    renderWithRouter(<Login />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email or username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    renderWithRouter(<Login />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Register now')).toHaveAttribute('href', '/register');
  });

  it('should call login() on form submit', async () => {
    mockLogin.mockResolvedValue({});
    const user = userEvent.setup();

    renderWithRouter(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your email or username'), 'testuser');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('should navigate to / on successful login', async () => {
    mockLogin.mockResolvedValue({});
    const user = userEvent.setup();

    renderWithRouter(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your email or username'), 'user');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();

    renderWithRouter(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your email or username'), 'bad');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'creds');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
