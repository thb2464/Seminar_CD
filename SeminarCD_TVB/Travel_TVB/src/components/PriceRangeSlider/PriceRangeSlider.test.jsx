import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PriceRangeSlider from './PriceRangeSlider';

describe('PriceRangeSlider', () => {
  const defaultProps = {
    min: 0,
    max: 50000000,
    values: [0, 50000000],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onChange.mockClear();
  });

  // --- formatPrice (tested via rendered output) ---

  describe('formatPrice display', () => {
    it('should display values in M format for millions', () => {
      render(<PriceRangeSlider {...defaultProps} values={[5000000, 10000000]} />);
      expect(screen.getByText('5M ₫')).toBeInTheDocument();
      expect(screen.getByText('10M ₫')).toBeInTheDocument();
    });

    it('should display values in K format for thousands', () => {
      render(<PriceRangeSlider {...defaultProps} values={[500000, 900000]} />);
      expect(screen.getByText('500K ₫')).toBeInTheDocument();
      expect(screen.getByText('900K ₫')).toBeInTheDocument();
    });

    it('should display 1M not 1.0M', () => {
      render(<PriceRangeSlider {...defaultProps} values={[1000000, 50000000]} />);
      expect(screen.getByText('1M ₫')).toBeInTheDocument();
    });

    it('should display 1.5M for 1500000', () => {
      render(<PriceRangeSlider {...defaultProps} values={[1500000, 50000000]} />);
      expect(screen.getByText('1.5M ₫')).toBeInTheDocument();
    });

    it('should display "0 ₫" for zero', () => {
      render(<PriceRangeSlider {...defaultProps} values={[0, 50000000]} />);
      expect(screen.getByText('0 ₫')).toBeInTheDocument();
    });
  });

  // --- Component rendering ---

  describe('rendering', () => {
    it('should render the label', () => {
      render(<PriceRangeSlider {...defaultProps} label="Price Range" />);
      expect(screen.getByText('Price Range')).toBeInTheDocument();
    });

    it('should render with default label when none provided', () => {
      render(<PriceRangeSlider min={0} max={100} values={[0, 100]} onChange={vi.fn()} />);
      expect(screen.getByText('Price Range')).toBeInTheDocument();
    });

    it('should render two range inputs', () => {
      const { container } = render(<PriceRangeSlider {...defaultProps} />);
      const inputs = container.querySelectorAll('input[type="range"]');
      expect(inputs.length).toBe(2);
    });
  });

  // --- Slider constraints ---

  describe('slider constraints', () => {
    it('should enforce minimum gap of 500K on min slider', () => {
      render(<PriceRangeSlider {...defaultProps} values={[0, 1000000]} />);
      const sliders = screen.getAllByRole('slider');
      // Try to set min to 600000 which would make gap < 500K from max of 1000000
      fireEvent.change(sliders[0], { target: { value: '600000' } });
      // onChange should be called with value capped at maxVal - 500000 = 500000
      expect(defaultProps.onChange).toHaveBeenCalledWith([500000, 1000000]);
    });

    it('should enforce minimum gap of 500K on max slider', () => {
      render(<PriceRangeSlider {...defaultProps} values={[5000000, 50000000]} />);
      const sliders = screen.getAllByRole('slider');
      // Try to set max to 5200000 which would make gap < 500K from min of 5000000
      fireEvent.change(sliders[1], { target: { value: '5200000' } });
      // onChange should be called with value capped at minVal + 500000 = 5500000
      expect(defaultProps.onChange).toHaveBeenCalledWith([5000000, 5500000]);
    });

    it('should allow valid min change', () => {
      render(<PriceRangeSlider {...defaultProps} values={[0, 50000000]} />);
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '10000000' } });
      expect(defaultProps.onChange).toHaveBeenCalledWith([10000000, 50000000]);
    });

    it('should allow valid max change', () => {
      render(<PriceRangeSlider {...defaultProps} values={[0, 50000000]} />);
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[1], { target: { value: '30000000' } });
      expect(defaultProps.onChange).toHaveBeenCalledWith([0, 30000000]);
    });
  });
});
