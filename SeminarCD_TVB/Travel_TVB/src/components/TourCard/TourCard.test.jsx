import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/test-utils';
import TourCard from './TourCard';

const mockTour = {
  id: 1,
  slug: 'ha-long-bay',
  Tour_Name: 'Ha Long Bay Adventure',
  Short_Description: 'Explore the stunning karst landscapes',
  Duration_Days: 3,
  Duration_Nights: 2,
  Location: 'Ha Long, Quang Ninh',
  Rating: 4.8,
  Review_Count: 120,
  Price: '5000000',
  Original_Price: null,
  featuredImageUrl: 'https://example.com/halong.jpg',
  categoryName: 'Adventure',
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

    it('should render category name when available', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.getByText('Adventure')).toBeInTheDocument();
    });

    it('should link to /tours/{slug}', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/tours/ha-long-bay');
    });
  });

  describe('discount detection', () => {
    it('should show SALE badge when Original_Price > Price', () => {
      const discountTour = { ...mockTour, Original_Price: '7000000' };
      renderWithRouter(<TourCard tour={discountTour} />);
      expect(screen.getByText('SALE')).toBeInTheDocument();
    });

    it('should NOT show SALE badge when no Original_Price', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      expect(screen.queryByText('SALE')).not.toBeInTheDocument();
    });

    it('should NOT show SALE badge when Original_Price <= Price', () => {
      const noDiscountTour = { ...mockTour, Original_Price: '5000000' };
      renderWithRouter(<TourCard tour={noDiscountTour} />);
      expect(screen.queryByText('SALE')).not.toBeInTheDocument();
    });

    it('should show original price struck through when discounted', () => {
      const discountTour = { ...mockTour, Original_Price: '7000000' };
      renderWithRouter(<TourCard tour={discountTour} />);
      expect(screen.getByText('7.000.000 ₫')).toBeInTheDocument();
    });
  });

  describe('category badge', () => {
    it('should display category name on the card image', () => {
      renderWithRouter(<TourCard tour={mockTour} />);
      const badge = document.querySelector('.tour-card-region');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('Adventure');
    });

    it('should not render category badge when categoryName is empty', () => {
      const noCategoryTour = { ...mockTour, categoryName: '' };
      renderWithRouter(<TourCard tour={noCategoryTour} />);
      const badge = document.querySelector('.tour-card-region');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('formatPrice edge cases', () => {
    it('should handle empty Price gracefully', () => {
      const noPriceTour = { ...mockTour, Price: null };
      renderWithRouter(<TourCard tour={noPriceTour} />);
      // formatPrice returns '' for falsy values
      // The price span should be empty
      const priceEl = document.querySelector('.tour-card-current-price');
      expect(priceEl).toBeInTheDocument();
    });
  });
});
