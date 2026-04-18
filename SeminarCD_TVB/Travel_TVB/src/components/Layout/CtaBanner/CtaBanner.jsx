import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext'; // Adjust path if needed
import config from '../../../config/strapi'; // Adjust path if needed
import './CtaBanner.css';

const CtaBanner = () => {
  // 1. State management for data, loading, and errors
  const [ctaData, setCtaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Get the current language from your context
  const { currentLanguage } = useLanguage();

  // 3. Fetch data from Strapi when the component mounts or language changes
  useEffect(() => {
    const fetchCtaData = async () => {
      // Reset states for a new fetch
      setLoading(true);
      setError(null);

      // Check if currentLanguage is available
      if (!currentLanguage) {
        setError('Language context is not available.');
        setLoading(false);
        return;
      }
      
      try {
        // Construct the API URL with population and localization
        const populateQuery = 'populate=*';
        const localeQuery = `locale=${currentLanguage.code}`;
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.LAYOUT_CTABANNER}?${populateQuery}&${localeQuery}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json = await response.json();
        
        // Strapi v5 single types return data directly, not in an array
        if (json.data) {
          // 4. Map the API response to a simpler state object
          const transformedData = {
            highlight: json.data.Cta_Text,
            buttonText: json.data.Cta_Banner_Button?.Text,
            buttonUrl: json.data.Cta_Banner_Button?.Url,
          };
          setCtaData(transformedData);
        } else {
          throw new Error('No data found in the API response.');
        }

      } catch (err) {
        console.error("Failed to fetch CTA banner data:", err);
        setError("Could not load content.");
      } finally {
        setLoading(false);
      }
    };

    fetchCtaData();
  }, [currentLanguage]); // Dependency array ensures this runs when language changes

  // 5. Render a loading state
  if (loading) {
    return (
      <section className="cta-banner-container">
        <h2 className="cta-highlight">Loading...</h2>
        <div className="hero-cta-link">
          <button className="hero-cta-button" disabled>
            Loading...
          </button>
        </div>
      </section>
    );
  }

  // 6. Render an error state
  if (error || !ctaData) {
    return (
      <section className="cta-banner-container">
        <h2 className="cta-highlight">Bạn Cần Tư Vấn Chuyên Môn?</h2>
        <Link to="/contact" className="hero-cta-link">
          <button className="hero-cta-button">
            Đăng kí tư vấn ngay
             <div className="btn-arrow">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                 <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
             </div>
          </button>
       </Link>
      </section>
    );
  }

  // 7. Render the component with data from the API
  return (
    <section className="cta-banner-container">
      <h2 className="cta-highlight">{ctaData.highlight}</h2>
      <Link to={ctaData.buttonUrl || '/contact'} className="hero-cta-link">
        <button className="hero-cta-button">
          {ctaData.buttonText}
          <div className="btn-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path 
                d="M5 12H19M19 12L12 5M19 12L12 19" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </Link>
    </section>
  );
};

export default CtaBanner;