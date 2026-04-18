import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/test-utils';
import Register from './Register';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => {
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

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ register: mockRegister });
  });

  it('should render all form fields', () => {
    renderWithRouter(<Register />);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password (min 6 characters)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
  });

  it('should render link to login page', () => {
    renderWithRouter(<Register />);
    expect(screen.getByText('Login')).toHaveAttribute('href', '/login');
  });

  it('should show password mismatch error', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Register />);

    await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test User');
    await user.type(screen.getByPlaceholderText('Choose a username'), 'testuser');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Enter password (min 6 characters)'), 'password1');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password2');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Passwords do not match!')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should call register() with form data on successful submit', async () => {
    mockRegister.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithRouter(<Register />);

    await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test User');
    await user.type(screen.getByPlaceholderText('Choose a username'), 'testuser');
    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Enter your phone number'), '0901234567');
    await user.type(screen.getByPlaceholderText('Enter password (min 6 characters)'), 'password123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        full_name: 'Test User',
        phone: '0901234567',
      });
    });
  });

  it('should navigate to / on successful registration', async () => {
    mockRegister.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithRouter(<Register />);

    await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test');
    await user.type(screen.getByPlaceholderText('Choose a username'), 'test');
    await user.type(screen.getByPlaceholderText('Enter your email'), 't@t.com');
    await user.type(screen.getByPlaceholderText('Enter password (min 6 characters)'), 'pass123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display API error message on failure', async () => {
    mockRegister.mockRejectedValue(new Error('Email already taken'));
    const user = userEvent.setup();
    renderWithRouter(<Register />);

    await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test');
    await user.type(screen.getByPlaceholderText('Choose a username'), 'test');
    await user.type(screen.getByPlaceholderText('Enter your email'), 't@t.com');
    await user.type(screen.getByPlaceholderText('Enter password (min 6 characters)'), 'pass123');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Email already taken')).toBeInTheDocument();
    });
  });
});
