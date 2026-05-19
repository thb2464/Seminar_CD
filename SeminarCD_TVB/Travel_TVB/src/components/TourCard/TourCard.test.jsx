import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/test-utils';
import TourCard from './TourCard';

const mockTour = {
  id: 1,
  slug: 'ha-long-bay',
  tourName: 'Ha Long Bay Adventure',
  shortDescription: 'Explore the stunning karst landscapes',
  durationDays: 3,
  durationNights: 2,
  location: 'Ha Long, Quang Ninh',
  rating: 4.8,
  reviewCount: 120,
  price: '5000000',
  originalPrice: null,
  featuredImageUrl: 'https://example.com/halong.jpg',
  regionLabel: 'Northern',
};

describe('TourCard', () => {
  describe('rendering', () => {
    it('should render tour name', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('Ha Long Bay Adventure')).toBeInTheDocument();
    });

    it('should render location', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('Ha Long, Quang Ninh')).toBeInTheDocument();
    });

    it('should render duration in NxDy format', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('3N2D')).toBeInTheDocument();
    });

    it('should render formatted price', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('5.000.000 ₫')).toBeInTheDocument();
    });

    it('should render rating', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('should render review count', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('(120)')).toBeInTheDocument();
    });

    it('should render region label badge when provided', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('Northern')).toBeInTheDocument();
    });

    it('should link to /tours/{slug}', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/tours/ha-long-bay');
    });
  });

  describe('discount detection', () => {
    it('should show SALE badge when originalPrice > price', () => {
      const discountTour = { ...mockTour, originalPrice: '7000000' };
      renderWithRouter(<TourCard tour={discountTour} />);
      expect(screen.getByText('SALE')).toBeInTheDocument();
    });

    it('should NOT show SALE badge when no originalPrice', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.queryByText('SALE')).not.toBeInTheDocument();
    });

    it('should NOT show SALE badge when originalPrice <= price', () => {
      const noDiscountTour = { ...mockTour, originalPrice: '5000000' };
      renderWithRouter(<TourCard tour={noDiscountTour} />);
      expect(screen.queryByText('SALE')).not.toBeInTheDocument();
    });

    it('should show original price struck through when discounted', () => {
      const discountTour = { ...mockTour, originalPrice: '7000000' };
      renderWithRouter(<TourCard tour={discountTour} />);
      expect(screen.getByText('7.000.000 ₫')).toBeInTheDocument();
    });
  });

  describe('region badge', () => {
    it('should display the region label on the card image', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      const badge = document.querySelector('.tour-card-region');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('Northern');
    });

    it('should not render the region badge when regionLabel is empty', () => {
      const noRegionTour = { ...mockTour, regionLabel: '' };
      renderWithRouter(<TourCard tour={noRegionTour} />);
      const badge = document.querySelector('.tour-card-region');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('formatPrice edge cases', () => {
    it('should handle empty price gracefully', () => {
      const noPriceTour = { ...mockTour, price: null };
      renderWithRouter(<TourCard tour={noPriceTour} />);
      // formatPrice returns '' for falsy values
      const priceEl = document.querySelector('.tour-card-current-price');
      expect(priceEl).toBeInTheDocument();
    });
  });
});
