import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import hook
import config from '../../config/strapi';
import './Commitment.css';

const MESSAGES = {
  LOADING: 'Loading...',
  ERROR: 'Failed to load content. Please try again later.',
  NO_DATA: 'Content is not available at this moment.',
};
const FALLBACK_IMAGE = 'https://picsum.photos/800/600';

const useCommitmentData = () => {
  const { currentLanguage } = useLanguage(); // 2. Use hook
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const transformData = (apiData) => {
      // (This function remains unchanged)
      const imageUrl = apiData.Image?.url;
      return {
        preTitle: apiData.PreTitle || '',
        title: apiData.Title || '',
        description: (apiData.Descriptions || []).map(block =>
          (block.children || []).map(child => child.text).join('')
        ),
        buttonText: apiData.buttonText || '',
        buttonPath: apiData.buttonPath || '#',
        image: {
          src: imageUrl ? `${config.STRAPI_URL}${imageUrl}` : FALLBACK_IMAGE,
          alt: apiData.Image?.alternativeText || apiData.Title || 'Commitment section image',
        },
      };
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 4. Update API URL with locale
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.COMMITMENT}?populate=Image&locale=${currentLanguage.code}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result = await response.json();
        if (!result.data) throw new Error('No commitment data found in API response.');

        setData(transformData(result.data));
      } catch (err) {
        console.error('Error fetching commitment data:', err);
        setError(MESSAGES.ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentLanguage]); // 3. Add dependency

  return { data, loading, error };
};

// --- Helper function and Presentational Component (no changes needed) ---
const isExternalLink = (url) => {
  if (!url || url === '#') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

const CommitmentView = ({ data }) => {
  // ... (no changes in this component)
  return (
    <section className="commitment-section">
      <div className="commitment-container">
        <div className="commitment-content">
          <span className="commitment-pre-title">{data.preTitle}</span>
          <h2 className="commitment-title">{data.title}</h2>
          {data.description.map((paragraph, index) => (
            <p key={index} className="commitment-description">{paragraph}</p>
          ))}
          {data.buttonPath && data.buttonPath !== '#' ? (
            <a
              href={data.buttonPath}
              className="commitment-button"
              target={isExternalLink(data.buttonPath) ? '_blank' : '_self'}
              rel={isExternalLink(data.buttonPath) ? 'noopener noreferrer' : undefined}
            >
              {data.buttonText}
              <div className="btn-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </a>
          ) : (
            <button className="commitment-button" disabled>{data.buttonText}<span className="arrow-icon">→</span></button>
          )}
        </div>
        <div className="commitment-image-wrapper">
          <img src={data.image.src} alt={data.image.alt} />
        </div>
      </div>
    </section>
  );
};

// --- Main Container Component (no changes needed) ---
const Commitment = () => {
  const { data, loading, error } = useCommitmentData();

  if (loading) {
    return <section className="commitment-section commitment-status-wrapper"><p>{MESSAGES.LOADING}</p></section>;
  }
  if (error) {
    return <section className="commitment-section commitment-status-wrapper error"><p>{error}</p></section>;
  }
  if (!data) {
    return <section className="commitment-section commitment-status-wrapper"><p>{MESSAGES.NO_DATA}</p></section>;
  }
  return <CommitmentView data={data} />;
};

export default Commitment;