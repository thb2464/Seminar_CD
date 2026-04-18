import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import the context hook
import config from '../../config/strapi';
import './CoreValues.css';

const CoreValues = () => {
  // 2. Get the current language from the context
  const { currentLanguage } = useLanguage();

  // State for managing data, loading status, and errors
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch data whenever 'currentLanguage' changes
  useEffect(() => {
    const fetchCoreValuesData = async () => {
      try {
        setLoading(true);
        setError(null);

        const populateQuery = 'populate=*';
        // 4. Add the 'locale' parameter to the API request URL
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.COREVALUES}?${populateQuery}&locale=${currentLanguage.code}`;
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        if (!data) {
          throw new Error('No data found for the Core Values section.');
        }
        
        // Transform the Strapi data (No changes needed here)
        const transformedData = {
          highlight_text: data.Highlight || '',
          title: data.Title || '',
          image: {
            url: data.Featured_Image ? `${config.STRAPI_URL}${data.Featured_Image.url}` : '',
            alternativeText: data.Featured_Image?.alternativeText || 'Core values feature image'
          },
          value_cards: data.StackedCard?.map(card => ({
            id: card.id,
            title: card.CardTitle || '',
            description: card.Descriptions || ''
          })) || [],
          cta_card: {
            id: data.Cta_button?.id || 1,
            title: data.CtaCardTitle || '',
            description: data.CtaCardDescriptions || '',
            button: {
              text: data.Cta_button?.Text || 'Learn More',
              link: data.Cta_button?.Url || '#'
            }
          }
        };
        
        setContent(transformedData);

      } catch (err) {
        console.error('Failed to fetch Core Values data:', err);
        setError('Could not load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoreValuesData();
  }, [currentLanguage]); // <-- Dependency array updated

  // --- JSX Rendering (No changes needed) ---
  if (loading) {
    return <div className="core-values-section">Loading...</div>;
  }

  if (error) {
    return <div className="core-values-section error-message">{error}</div>;
  }

  if (!content) {
    return null;
  }

  return (
    <div className="core-values-section">
      <div className="core-values-container">
        <div className="title-container">
          <span className="highlight-text">{content.highlight_text}</span>
          <h1>{content.title}</h1>
        </div>

        <div className="content-grid">
          <div className="left-column">
            <div className="sticky-image-wrapper">
              {content.image?.url && (
                <img
                  src={content.image.url}
                  alt={content.image.alternativeText}
                  className="feature-image"
                />
              )}
            </div>
          </div>

          <div className="right-column">
            <div className="cards-wrapper">
              {content.value_cards.map((card) => (
                <div key={card.id} className="value-card-sticky-container">
                  <div className="value-card">
                    <h3>{card.title}</h3>
                    <p className="card-description">{card.description}</p>
                  </div>
                </div>
              ))}

              <div className="cta-card">
                <h2>{content.cta_card.title}</h2>
                <p>{content.cta_card.description}</p>
                <a href={content.cta_card.button.link} className="cta-button">
                  {content.cta_card.button.text} →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreValues;