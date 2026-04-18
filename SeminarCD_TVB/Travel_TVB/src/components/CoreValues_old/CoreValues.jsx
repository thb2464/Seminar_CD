import React, { useState, useEffect } from 'react';
import config from '../../config/strapi'; // Adjust the path if necessary
import './CoreValues.css';

const CoreValues = () => {
  // State for managing data, loading status, and errors
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from Strapi when the component mounts
  useEffect(() => {
    const fetchCoreValuesData = async () => {
      try {
        // Construct the API URL to populate all components and media fields
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.COREVALUES}?populate=*`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        if (!data) {
          throw new Error('No data found for the Core Values section.');
        }
        
        // Transform the Strapi data to match the structure the JSX expects
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
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Conditional rendering based on the loading and error states
  if (loading) {
    return <div className="core-values-section">Loading...</div>;
  }

  if (error) {
    return <div className="core-values-section error-message">{error}</div>;
  }

  if (!content) {
    return null; // Don't render anything if there's no data
  }

  // Render the component with the fetched data
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
              {/* Ensure image URL exists before rendering */}
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