import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import the context hook
import config from '../../config/strapi';
import { Link } from 'react-router-dom';
import './InsuranceType.css';

// --- SVG Icons (No changes needed here) ---
const icons = {
  responsibility: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  ),
  specialty: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
  ),
  property: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v13H3V8"></path><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>
    </svg>
  ),
  technical: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  people: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  marine: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  )
};

// --- Helper function (No changes needed here) ---
const getPlainTextFromBlocks = (blocks) => {
  if (!blocks) return '';
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      return block.children.map(child => child.text).join('');
    }
    return '';
  }).join('\n');
};

const InsuranceType = () => {
  // 2. Get the current language from the context
  const { currentLanguage } = useLanguage();
  
  const [insuranceData, setInsuranceData] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch data whenever 'currentLanguage' changes
  useEffect(() => {
    const fetchInsuranceData = async () => {
      // Reset state for re-fetches (e.g., on language change)
      setLoading(true);
      setError(null);
      
      try {
        const populateQuery = 'populate[tabs][populate][content][populate][FeaturedImage]=true&populate[tabs][populate][content][populate][items]=true';
        // 4. Add the 'locale' parameter to the API request URL
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.SERVICE_INSURANCETYPE}?${populateQuery}&locale=${currentLanguage.code}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const json = await response.json();
        const data = json.data;

        if (!data) {
          throw new Error('No data found for the Insurance Type section.');
        }

        const transformedData = {
          mainTitle: data.InsuranceType_mainTitle || '',
          tabs: data.tabs?.map(tab => ({
            id: tab.id,
            tabTitle: tab.tabTitle || '',
            icon: icons[tab.icon] || null,
            content: {
              featuredImage: tab.content?.FeaturedImage ? `${config.STRAPI_URL}${tab.content.FeaturedImage.url}` : '',
              heading: tab.content?.Heading || '',
              description: getPlainTextFromBlocks(tab.content?.descriptions),
              includesTitle: tab.content?.includesTitle || '',
              items: tab.content?.items?.map(item => item.bulletText) || [],
              ctaText: tab.content?.ctaText || '',
            }
          })) || []
        };
        
        setInsuranceData(transformedData);
        if (transformedData.tabs.length > 0) {
          setActiveTab(transformedData.tabs[0].id);
        }

      } catch (err)
 {
        console.error("Failed to fetch Insurance Type data:", err);
        setError("Could not load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsuranceData();
  }, [currentLanguage]); // <-- Dependency array updated

  if (loading) {
    return <section className="insurance-section"><div>Loading...</div></section>;
  }

  if (error) {
    return <section className="insurance-section"><div className="error-message">{error}</div></section>;
  }

  if (!insuranceData) {
    return null;
  }

  const activeTabData = insuranceData.tabs.find((tab) => tab.id === activeTab);

  return (
    <section className="insurance-section">
      <div className="container">
        <h2 className="section-title">{insuranceData.mainTitle}</h2>

        <div className="insurance-tabs">
          {insuranceData.tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-title">{tab.tabTitle}</span>
            </button>
          ))}
        </div>

        {activeTabData && (
          <div key={activeTab} className="insurance-content">
            <div className="content-image-column">
              <img
                src={activeTabData.content.featuredImage}
                alt={activeTabData.content.heading}
                className="featured-image"
              />
            </div>
            <div className="content-text-column">
              <h3>{activeTabData.content.heading}</h3>
              <p className="description">{activeTabData.content.description}</p>
              <h4>{activeTabData.content.includesTitle}</h4>
              <ul className="includes-list">
                {activeTabData.content.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <Link to="/contact" className="IT-cta-button">
                {activeTabData.content.ctaText}
                <span className="arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InsuranceType;