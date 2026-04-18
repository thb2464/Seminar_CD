import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/test-utils';
import BookingForm from './BookingForm';

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
const { useLanguage } = await import('../../context/LanguageContext');

const mockTour = {
  id: 1,
  Price: '5000000',
  Child_Price: '3000000',
};

const mockUser = {
  full_name: 'Nguyen Van A',
  email: 'test@example.com',
  phone: '0901234567',
};

const authenticatedState = {
  user: mockUser,
  token: 'test-jwt-token',
  isAuthenticated: true,
  loading: false,
};

const unauthenticatedState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

describe('BookingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLanguage.mockReturnValue({
      currentLanguage: { code: 'en', name: 'English', flag: '🇺🇸' },
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Unauthenticated state ---

  describe('when not authenticated', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(unauthenticatedState);
    });

    it('should show login prompt', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      expect(screen.getByText('Login to book this tour')).toBeInTheDocument();
    });

    it('should show login button linking to /login', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      const loginLink = screen.getByText('Login');
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should NOT render the booking form', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      expect(screen.queryByText('Book This Tour')).not.toBeInTheDocument();
    });
  });

  // --- Authenticated state ---

  describe('when authenticated', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(authenticatedState);
    });

    it('should render the booking form title', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      expect(screen.getByText('Book This Tour')).toBeInTheDocument();
    });

    it('should pre-fill contact fields from user data', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      expect(screen.getByDisplayValue('Nguyen Van A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0901234567')).toBeInTheDocument();
    });

    it('should display adult and child price per person', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      // Both adult price and total show 5.000.000 ₫, so use getAllByText
      const priceElements = screen.getAllByText('5.000.000 ₫');
      expect(priceElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('3.000.000 ₫')).toBeInTheDocument();
    });

    it('should show child section when tour has Child_Price', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('should NOT show child section when tour has no Child_Price', () => {
      const noChildPriceTour = { id: 1, Price: '5000000' };
      renderWithRouter(<BookingForm tour={noChildPriceTour} />);
      expect(screen.queryByText('Children')).not.toBeInTheDocument();
    });

    it('should show initial total as 1 adult × price', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      // 1 adult × 5,000,000 = 5,000,000
      const totalEl = document.querySelector('.booking-total-price');
      expect(totalEl).toHaveTextContent('5.000.000 ₫');
    });

    it('should disable submit button when no date is selected', () => {
      renderWithRouter(<BookingForm tour={mockTour} />);
      const submitBtn = screen.getByRole('button', { name: 'Pay with VNPay' });
      expect(submitBtn).toBeDisabled();
    });
  });

  // --- Total price calculation ---

  describe('total price calculation', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(authenticatedState);
    });

    it('should calculate total for adults + children', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BookingForm tour={mockTour} />);

      // Click the "+" button for children (second stepper group's "+" button)
      const plusButtons = screen.getAllByRole('button', { name: '+' });
      // plusButtons[0] = adult +, plusButtons[1] = child +
      await user.click(plusButtons[1]); // childCount = 1
      await user.click(plusButtons[1]); // childCount = 2

      // Total: 1 × 5,000,000 + 2 × 3,000,000 = 11,000,000
      const totalEl = document.querySelector('.booking-total-price');
      expect(totalEl).toHaveTextContent('11.000.000 ₫');
    });

    it('should not go below 1 adult', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BookingForm tour={mockTour} />);

      const minusButtons = screen.getAllByRole('button', { name: '-' });
      await user.click(minusButtons[0]); // try to decrease adult below 1

      // Adults should remain at 1
      const steppers = document.querySelectorAll('.booking-stepper span');
      expect(steppers[0]).toHaveTextContent('1');
    });

    it('should not go below 0 children', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BookingForm tour={mockTour} />);

      const minusButtons = screen.getAllByRole('button', { name: '-' });
      await user.click(minusButtons[1]); // try to decrease child below 0

      const steppers = document.querySelectorAll('.booking-stepper span');
      expect(steppers[1]).toHaveTextContent('0');
    });
  });

  // --- Form submission ---

  describe('form submission', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(authenticatedState);
    });

    it('should call booking API then payment API on submit', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/bookings/availability')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { remaining: 100, isSoldOut: false } }),
          });
        }
        if (typeof url === 'string' && url.includes('/api/bookings/create-payment-url')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ paymentUrl: 'https://vnpay.test/pay' }),
          });
        }
        if (typeof url === 'string' && url.includes('/api/bookings')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { id: 42 } }),
          });
        }
        return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
      });

      renderWithRouter(<BookingForm tour={mockTour} />);

      // Set travel date by directly changing the input value
      const dateEl = document.querySelector('input[type="date"]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(dateEl, '2026-12-25');
      dateEl.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: /Pay with VNPay/i });
        expect(submitBtn).not.toBeDisabled();
      });

      const submitBtn = screen.getByRole('button', { name: /Pay with VNPay/i });
      await user.click(submitBtn);

      await waitFor(() => {
        const calls = global.fetch.mock.calls;
        expect(calls.some(c => typeof c[0] === 'string' && c[0].includes('/api/bookings/create-payment-url'))).toBe(true);
      });

      // Verify the booking POST call (exclude availability and create-payment-url)
      const bookingCall = global.fetch.mock.calls.find(call =>
        typeof call[0] === 'string'
        && call[0].includes('/api/bookings')
        && !call[0].includes('availability')
        && !call[0].includes('create-payment')
      );
      expect(bookingCall).toBeDefined();
      expect(bookingCall[1].method).toBe('POST');
      expect(bookingCall[1].headers.Authorization).toBe('Bearer test-jwt-token');
    });

    it('should show error message on booking failure', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/bookings/availability')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { remaining: 100, isSoldOut: false } }),
          });
        }
        if (typeof url === 'string' && url.includes('/api/bookings')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: { message: 'Not enough spots' } }),
          });
        }
        return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
      });

      renderWithRouter(<BookingForm tour={mockTour} />);

      // Set date directly via DOM
      const dateEl = document.querySelector('input[type="date"]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(dateEl, '2026-12-25');
      dateEl.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: /Pay with VNPay/i });
        expect(submitBtn).not.toBeDisabled();
      });

      const submitBtn = screen.getByRole('button', { name: /Pay with VNPay/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Not enough spots')).toBeInTheDocument();
      });
    });
  });

  // --- formatPrice ---

  describe('formatPrice display', () => {
    beforeEach(() => {
      useAuth.mockReturnValue(authenticatedState);
    });

    it('should show "0 ₫" for zero price', () => {
      const zeroPriceTour = { id: 1, Price: '0' };
      renderWithRouter(<BookingForm tour={zeroPriceTour} />);
      // Total should show 0 ₫
      const totalEl = document.querySelector('.booking-total-price');
      expect(totalEl).toHaveTextContent('0 ₫');
    });
  });
});
