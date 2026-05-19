import React from 'react';
import { Link } from 'react-router-dom';
import './TourCard.css';

const formatPrice = (price) => {
  if (!price) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(price)) + ' ₫';
};

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// TourCard reads the catalog-service camelCase shape directly. The legacy
// Strapi PascalCase fields (Tour_Name / Original_Price / Featured_Image / ...)
// were monolith-era and have been retired together with the Strangler Fig cut
// over to catalog-service.
const TourCard = ({ tour }) => {
  const hasDiscount =
    tour.originalPrice && parseInt(tour.originalPrice) > parseInt(tour.price);

  return (
    <Link to={`/tours/${tour.slug}`} className="tour-card">
      <div className="tour-card-image">
        <img src={tour.featuredImageUrl} alt={tour.tourName} loading="lazy" />
        {hasDiscount && <span className="tour-card-badge">SALE</span>}
        {tour.regionLabel && (
          <span className="tour-card-region">{tour.regionLabel}</span>
        )}
      </div>
      <div className="tour-card-content">
        <h3 className="tour-card-title">{tour.tourName}</h3>
        <p className="tour-card-description">{tour.shortDescription}</p>
        <div className="tour-card-info">
          <span className="tour-card-info-item">
            <ClockIcon />
            {tour.durationDays}N{tour.durationNights}D
          </span>
          <span className="tour-card-info-item">
            <LocationIcon />
            {tour.location}
          </span>
        </div>
        <div className="tour-card-footer">
          <div className="tour-card-rating">
            <StarIcon />
            <span>{tour.rating}</span>
            <span className="tour-card-reviews">({tour.reviewCount})</span>
          </div>
          <div className="tour-card-price">
            {hasDiscount && (
              <span className="tour-card-original-price">{formatPrice(tour.originalPrice)}</span>
            )}
            <span className="tour-card-current-price">{formatPrice(tour.price)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TourCard;
