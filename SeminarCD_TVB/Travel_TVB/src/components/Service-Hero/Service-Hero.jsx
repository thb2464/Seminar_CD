import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import the context hook
import config from '../../config/strapi';
import './Service-Hero.css';

const { STRAPI_URL, API_ENDPOINTS: { SERVICE_HERO } } = config;

const ServiceHero = () => {
  // 2. Get the current language from the context
  const { currentLanguage } = useLanguage();

  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch data whenever 'currentLanguage' changes
  useEffect(() => {
    const fetchServiceHeroData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 4. Add the 'locale' parameter to the API request URL
        const apiUrl = `${STRAPI_URL}${SERVICE_HERO}?populate[Cta_button]=*&locale=${currentLanguage.code}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const response_data = await response.json();
        const data = response_data.data;
        
        if (!data) {
          throw new Error('No data received from API for the selected language');
        }

        setHeroData(data);
        
      } catch (err) {
        console.error('Service Hero fetch error:', err);
        setError(`Failed to load hero content: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceHeroData();
  }, [currentLanguage]); // <-- Dependency array updated

  // No changes are needed for the functions below this line
  // They will work correctly with the newly fetched localized data.

  const renderBlocksContent = (blocks) => {
    if (!blocks) return '';
    
    if (typeof blocks === 'string') {
      return blocks;
    }
    
    if (Array.isArray(blocks)) {
      return blocks.map((block, index) => {
        if (!block || !block.type) {
          return '';
        }

        const getBlockText = (children) => {
          if (!Array.isArray(children)) return '';
          return children.map(child => child?.text || '').join('');
        };

        switch (block.type) {
          case 'paragraph':
            const paragraphText = getBlockText(block.children);
            return `<p key="${index}">${paragraphText}</p>`;
            
          case 'list':
            const listItems = block.children?.map((item, itemIndex) => {
              if (item.type === 'list-item') {
                const itemText = getBlockText(item.children);
                return `<li key="${itemIndex}">${itemText}</li>`;
              }
              return '';
            }).filter(Boolean).join('') || '';
            
            return block.format === 'ordered' 
              ? `<ol key="${index}">${listItems}</ol>`
              : `<ul key="${index}">${listItems}</ul>`;
              
          case 'heading':
            const level = Math.min(Math.max(block.level || 3, 1), 6);
            const headingText = getBlockText(block.children);
            return `<h${level} key="${index}">${headingText}</h${level}>`;
            
          default:
            const defaultText = getBlockText(block.children);
            return defaultText ? `<p key="${index}">${defaultText}</p>` : '';
        }
      }).filter(Boolean).join('');
    }
    
    return '';
  };

  const handleCTAClick = () => {
    if (heroData?.Cta_button?.Url) {
      window.location.href = heroData.Cta_button.Url;
    }
  };

  if (loading) {
    return (
      <div className="aboutus-hero-container aboutus-hero-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aboutus-hero-container aboutus-hero-error">
        <div className="error-message">
          <h3>Error Loading Content</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!heroData) {
    return (
      <div className="aboutus-hero-container">
        <div className="aboutus-hero-content">
          <p>No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aboutus-hero-container">
      <div className="aboutus-hero-content">
        <h1 className="aboutus-hero-title">
          {heroData.Title || 'Default Title'}
          <br />
          <span className="aboutus-hero-highlight">
            {heroData.Highlight || ''}
          </span>
        </h1>
        
        <div className="aboutus-hero-description">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: renderBlocksContent(heroData.Subtitle)
            }}
          />
        </div>
        
        {heroData.Cta_button && (
          <button
            className="aboutus-hero-cta-button"
            onClick={handleCTAClick}
            aria-label={heroData.Cta_button.Text || 'Learn More'}
          >
            <span className="aboutus-cta-text">
              {heroData.Cta_button.Text || 'Learn More'}
            </span>
            <svg
              className="aboutus-cta-arrow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceHero;