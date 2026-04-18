import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import hook
import config from '../../config/strapi';
import './HeroSlider.css';

const HeroSlider = () => {
  const { currentLanguage } = useLanguage(); // 2. Use hook
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideData, setSlideData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size (no changes needed)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch data from Strapi
  useEffect(() => {
    const fetchSlideData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 4. Update API URL with locale
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.HERO_SLIDER}?populate[Slide][populate]=backgroundImage&locale=${currentLanguage.code}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const transformedSlides = data.data.Slide?.map((slide, index) => ({
          id: slide.id || index + 1,
          backgroundImage: slide.backgroundImage?.url 
            ? `${config.STRAPI_URL}${slide.backgroundImage.url}`
            : '',
          title: slide.Title || '',
          navTextLine1: slide.navTextLine1 || '',
          navTextLine2: slide.navTextLine2 || '',
          buttonText: slide.buttonText || 'Learn More',
          buttonLink: slide.buttonPath || '#',
        })) || [];
        
        setSlideData(transformedSlides);
      } catch (err) {
        console.error('Error fetching slide data:', err);
        setError('Failed to load slider content');
      } finally {
        setLoading(false);
      }
    };

    fetchSlideData();
  }, [currentLanguage]); // 3. Add dependency

  // Effect for the auto-sliding timer (no changes needed)
  useEffect(() => {
    if (slideData.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % slideData.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [activeIndex, slideData.length]);

  // --- Handlers and Render Logic (no changes needed) ---
  const goToNextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % slideData.length);
  };

  const goToPrevSlide = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? slideData.length - 1 : prevIndex - 1
    );
  };

  const handleNavClick = (index) => {
    if (!isMobile) {
      setActiveIndex(index);
    }
  };

  const handleLeftSideClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      goToPrevSlide();
    }
  };

  const handleRightSideClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      goToNextSlide();
    }
  };

  const handleContentClick = (e) => {
    if (isMobile) {
      const isButton = e.target.closest('.hero-cta-button, .hero-cta-link');
      if (!isButton) {
        e.preventDefault();
      }
    }
  };

  if (loading) {
    return (
      <div className="hero-container hero-loading">
        <div className="hero-overlay"></div>
        <div className="hero-content"><div className="loading-spinner">Loading...</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hero-container hero-error">
        <div className="hero-overlay"></div>
        <div className="hero-content"><div className="error-message">{error}</div></div>
      </div>
    );
  }

  if (slideData.length === 0) {
    return (
      <div className="hero-container hero-empty">
        <div className="hero-overlay"></div>
        <div className="hero-content"><div className="empty-message">No slides available</div></div>
      </div>
    );
  }

  const currentSlide = slideData[activeIndex];

  return (
    <div
      className="hero-container"
      style={{ backgroundImage: `url(${currentSlide.backgroundImage})` }}
      key={currentSlide.id}
      onClick={handleContentClick}
    >
      <div className="hero-overlay"></div>
      
      {isMobile && <div className="hero-nav-left" onClick={handleLeftSideClick} role="button" aria-label="Previous slide" />}
      {isMobile && <div className="hero-nav-right" onClick={handleRightSideClick} role="button" aria-label="Next slide" />}

      <div className="hero-content">
        <h1 className="hero-title">{currentSlide.title}</h1>
        <a href={currentSlide.buttonLink} className="hero-cta-link">
          <button className="hero-cta-button">
            {currentSlide.buttonText}
            <div className="btn-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </button>
        </a>
      </div>

      <div className="hero-nav">
        {slideData.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-nav-item ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleNavClick(index)}
            style={{ cursor: isMobile ? 'default' : 'pointer' }}
          >
            <div className="progress-bar"></div>
            <p>{slide.navTextLine1}<br />{slide.navTextLine2}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;