// src/components/CommunityHeader/CommunityHeader.jsx

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './CommunityHeader.css';

// Helper to construct full URLs for Strapi assets
const getStrapiUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${config.STRAPI_URL}${path}`;
};

const CommunityHeader = () => {
  const { currentLanguage } = useLanguage();
  
  // State for fetching header content
  const [headerData, setHeaderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. State for handling form submission ---
  const [email, setEmail] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [submissionMessage, setSubmissionMessage] = useState('');

  // --- 2. Centralized translations for UI text ---
  const translations = {
    subscribeButton: { vi: 'Đăng kí', en: 'Subscribe', zh: '订阅' },
    placeholder: { vi: 'Nhập email của bạn', en: 'Enter your email', zh: '输入您的电子邮件' },
    submitting: { vi: 'Đang gửi...', en: 'Submitting...', zh: '提交中...' },
    success: { vi: 'Cảm ơn bạn đã đăng ký!', en: 'Thank you for subscribing!', zh: '感谢您的订阅！' },
    error: { vi: 'Đã xảy ra lỗi. Vui lòng thử lại.', en: 'An error occurred. Please try again.', zh: '发生错误。请再试一次。' }
  };

  // Effect for fetching the component's main content
  useEffect(() => {
    const fetchHeaderData = async () => {
      setLoading(true);
      setError(null);

      const populateQuery = [
        'populate[Community_FeaturedImage]=true',
        'populate[Social_Link][populate][Social_Logo]=true'
      ].join('&');
      
      const localeQuery = `locale=${currentLanguage.code}`;
      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.COMMUNITY_HERO}?${populateQuery}&${localeQuery}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
        
        const json = await response.json();
        if (!json.data) throw new Error('Community hero data not found.');

        setHeaderData(json.data);

      } catch (err) {
        console.error("Failed to fetch CommunityHeader data from Strapi:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeaderData();
  }, [currentLanguage]);

  // --- 3. Function to handle form submission ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmissionStatus('submitting');
    setSubmissionMessage('');

    try {
      // Endpoint for creating a new submission (removes /:id)
      const submissionApiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.NEWSLETTER_SUBMISSION.replace('/:id', '')}`;
      
      const response = await fetch(submissionApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { UsersEmail: email } // Strapi v5 payload format
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Submission failed.');
      }

      setSubmissionStatus('success');
      setSubmissionMessage(translations.success[currentLanguage.code]);
      setEmail(''); // Clear input on success

    } catch (err) {
      console.error("Newsletter submission failed:", err);
      setSubmissionStatus('error');
      setSubmissionMessage(translations.error[currentLanguage.code]);
    }
  };

  // --- 4. Render loading and error states ---
  if (loading) {
    return <div className="header-wrapper"><h2>Loading Content...</h2></div>;
  }

  if (error || !headerData) {
    return <div className="header-wrapper"><h2>Error Loading Content</h2><p>{error || 'The header content could not be found.'}</p></div>;
  }
  
  const { 
    Community_MainTitle, 
    Community_SubTitle, 
    Community_NewsletterText, 
    followUsText, 
    Social_Link,
    Community_FeaturedImage
  } = headerData;

  const featuredImageUrl = getStrapiUrl(Community_FeaturedImage?.url);
  const currentPlaceholder = translations.placeholder[currentLanguage.code] || 'Email';
  const buttonText = submissionStatus === 'submitting' 
    ? translations.submitting[currentLanguage.code]
    : translations.subscribeButton[currentLanguage.code];

  return (
    <div className="header-wrapper">
      <div className="community-post-header">
        <div className="community-header-left">
          <h1 className="community-main-title">{Community_MainTitle}</h1>
          <p className="community-subtitle">{Community_SubTitle}</p>
          
          <div className="community-newsletter-section">
            <label htmlFor="email-input">{Community_NewsletterText}</label>
            {/* --- 5. Updated form with submission logic and state binding --- */}
            <form className="community-newsletter-form" onSubmit={handleSubmit}>
              <input 
                id="email-input" 
                type="email" 
                placeholder={currentPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submissionStatus === 'submitting'}
              />
              <button type="submit" disabled={submissionStatus === 'submitting'}>
                {buttonText || 'Subscribe'}
                <span className="arrow">
                  <svg className="newsletter-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </span>
              </button>
            </form>
            {/* --- 6. Feedback message for the user --- */}
            {submissionMessage && (
              <p className={`community-submission-message ${submissionStatus}`}>
                {submissionMessage}
              </p>
            )}
          </div>
          
          <div className="social-follow">
            <span>{followUsText}</span>
            <div className="social-icons">
              {Social_Link && Social_Link.map((link) => {
                const logoUrl = getStrapiUrl(link.Social_Logo?.url);
                if (!link.Url || !logoUrl) return null;

                return (
                  <a key={link.id} href={link.Url} aria-label={link.Social_Link_Name} target="_blank" rel="noopener noreferrer">
                    <img src={logoUrl} alt={link.Social_Link_Name} className="social-icon-svg" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {featuredImageUrl && (
          <div className="community-header-right">
            <div className="community-featured-card">
              <div className="community-featured-card-image">
                <img src={featuredImageUrl} alt={Community_MainTitle || 'Community Feature'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHeader;