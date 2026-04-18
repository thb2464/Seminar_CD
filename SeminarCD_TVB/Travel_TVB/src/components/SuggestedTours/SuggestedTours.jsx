// src/components/SuggestedTours/SuggestedTours.jsx

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import TourCard from '../TourCard/TourCard';
import AnimateOnScroll from '../AnimateOnScroll/AnimateOnScroll';
import './SuggestedTours.css';

const displayData = {
  vi: {
    sectionTitle: 'Tour G\u1ee3i \u00dd',
    sectionSubtitle: 'Kh\u00e1m ph\u00e1 nh\u1eefng tour du l\u1ecbch h\u1ea5p d\u1eabn nh\u1ea5t d\u00e0nh cho b\u1ea1n',
    viewAll: 'Xem t\u1ea5t c\u1ea3 tour \u2192',
  },
  en: {
    sectionTitle: 'Suggested Tours',
    sectionSubtitle: 'Discover the most exciting tours just for you',
    viewAll: 'View all tours \u2192',
  },
  zh: {
    sectionTitle: '\u63a8\u8350\u65c5\u6e38',
    sectionSubtitle: '\u4e3a\u60a8\u53d1\u73b0\u6700\u7cbe\u5f69\u7684\u65c5\u6e38\u7ebf\u8def',
    viewAll: '\u67e5\u770b\u6240\u6709\u65c5\u6e38 \u2192',
  },
};

const SuggestedTours = () => {
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestedTours = async () => {
      setLoading(true);
      setError(null);

      const populateQuery = 'populate[Featured_Image]=true&populate[tour_category]=true';
      const paginationQuery = 'pagination[pageSize]=3';
      const sortQuery = 'sort=Rating:desc';
      const localeQuery = `locale=${currentLanguage.code}`;

      try {
        // First try: featured tours, highest-rated
        const featuredUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}?${populateQuery}&${paginationQuery}&${sortQuery}&filters[Is_Featured][$eq]=true&${localeQuery}`;
        const response = await fetch(featuredUrl);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const json = await response.json();
        let tourList = json.data || [];

        // Fallback: if fewer than 3 featured tours, fetch top-rated without filter
        if (tourList.length < 3) {
          const fallbackUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}?${populateQuery}&${paginationQuery}&${sortQuery}&${localeQuery}`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackJson = await fallbackResponse.json();
            tourList = fallbackJson.data || [];
          }
        }

        // Transform tour data (same pattern as Tours.jsx)
        const transformedTours = tourList.slice(0, 3).map(tour => ({
          ...tour,
          featuredImageUrl: tour.Featured_Image?.url
            ? (tour.Featured_Image.url.startsWith('http')
                ? tour.Featured_Image.url
                : `${config.STRAPI_URL}${tour.Featured_Image.url}`)
            : 'https://picsum.photos/seed/tour/400/300',
          categoryName: tour.tour_category?.Category_Name || '',
        }));

        setTours(transformedTours);
      } catch (err) {
        console.error('Failed to fetch suggested tours:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedTours();
  }, [currentLanguage]);

  // Loading: show skeleton placeholders
  if (loading) {
    return (
      <section className="suggested-tours-section">
        <div className="suggested-tours-header">
          <h2 className="suggested-tours-title">{TEXT.sectionTitle}</h2>
        </div>
        <div className="suggested-tours-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="suggested-tours-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-content">
                <div className="skeleton-line wide" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error or empty: silently hide (supplementary section)
  if (error || tours.length === 0) {
    return null;
  }

  return (
    <section className="suggested-tours-section">
      <AnimateOnScroll direction="fromBottom">
        <div className="suggested-tours-header">
          <h2 className="suggested-tours-title">{TEXT.sectionTitle}</h2>
          <p className="suggested-tours-subtitle">{TEXT.sectionSubtitle}</p>
        </div>
      </AnimateOnScroll>

      <div className="suggested-tours-grid">
        {tours.map((tour, index) => (
          <AnimateOnScroll key={tour.id || index} direction="fromBottom" delay={0.1 * (index + 1)}>
            <TourCard tour={tour} />
          </AnimateOnScroll>
        ))}
      </div>

      <div className="suggested-tours-footer">
        <a href="/tours" className="suggested-tours-view-all">
          {TEXT.viewAll}
        </a>
      </div>
    </section>
  );
};

export default SuggestedTours;
