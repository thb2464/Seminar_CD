// src/components/NewsHeader/NewsHeader.jsx

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './NewsHeader.css';

const getStrapiUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${config.STRAPI_URL}${path}`;
};

const NewsHeader = () => {
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

  // Effect for fetching the component's main content from Strapi
  useEffect(() => {
    const fetchHeaderData = async () => {
      setLoading(true);
      setError(null);

      const populateQuery = [
        'populate[Featured_New][populate][Featured_Image]=true',
        'populate[Featured_New][populate][author][populate][AuthorAvatar]=true',
        'populate[Social_Link][populate][Social_Logo]=true'
      ].join('&');
      
      const localeQuery = `locale=${currentLanguage.code}`;
      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.NEWS_HERO}?${populateQuery}&${localeQuery}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
        
        const json = await response.json();
        if (!json.data) throw new Error('News hero data not found.');

        setHeaderData(json.data);

      } catch (err) {
        console.error("Failed to fetch NewsHeader data from Strapi:", err);
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
      const submissionApiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.NEWSLETTER_SUBMISSION.replace('/:id', '')}`;
      
      const response = await fetch(submissionApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { UsersEmail: email }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Submission failed.');
      }

      setSubmissionStatus('success');
      setSubmissionMessage(translations.success[currentLanguage.code]);
      setEmail('');

    } catch (err) {
      console.error("Newsletter submission failed:", err);
      setSubmissionStatus('error');
      setSubmissionMessage(translations.error[currentLanguage.code]);
    }
  };
  
  // --- 4. Render loading and error states ---
  if (loading) {
    return <div className="header-wrapper"><h2>Loading News...</h2></div>;
  }

  if (error || !headerData) {
    return <div className="header-wrapper"><h2>Error Loading Content</h2><p>{error || 'The header content could not be found.'}</p></div>;
  }
  
  const { 
    News_MainTitle, 
    News_subTitle, 
    NewsletterLabel, 
    followUsText, 
    Featured_New: featuredPost,
    Social_Link
  } = headerData;

  const featuredPostImageUrl = getStrapiUrl(featuredPost?.Featured_Image?.url);
  const authorAvatarUrl = getStrapiUrl(featuredPost?.author?.AuthorAvatar?.url);
  const publishedDate = featuredPost?.publishedAt 
    ? new Date(featuredPost.publishedAt).toLocaleDateString(currentLanguage.code === 'vi' ? 'vi-VN' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : 'Date not available';
    
  const currentPlaceholder = translations.placeholder[currentLanguage.code] || 'Email';
  const buttonText = submissionStatus === 'submitting' 
    ? translations.submitting[currentLanguage.code]
    : translations.subscribeButton[currentLanguage.code];

  return (
    <div className="header-wrapper">
      <div className="post-header">
        <div className="news-header-left">
          <h1 className="news-main-title">{News_MainTitle}</h1>
          <p className="news-subtitle">{News_subTitle}</p>
          
          <div className="news-newsletter-section">
            <label htmlFor="email-input">{NewsletterLabel}</label>
            {/* --- 5. Updated form with submission logic --- */}
            <form className="news-newsletter-form" onSubmit={handleSubmit}>
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
               <p className={`news-submission-message ${submissionStatus}`}>
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

        {featuredPost && (
          <div className="news-header-right">
            <a href={`/news/${featuredPost.slug}`} className="featured-card">
              <div className="featured-card-image">
                <img src={featuredPostImageUrl || 'https://picsum.photos/800/450'} alt={featuredPost.PostTitle} />
              </div>
              <div className="featured-card-content">
                <h3 className="featured-card-title">{featuredPost.PostTitle}</h3>
                <div className="featured-card-meta">
                  {/* --- TASK 1: Hide author block --- */}
                  <div className="featured-card-author" style={{ display: 'none' }}>
                    <img src={authorAvatarUrl || 'https://picsum.photos/100/100'} alt={featuredPost.author?.DisplayName} className="featured-card-author-avatar" />
                    <span>{featuredPost.author?.DisplayName || 'Unknown Author'}</span>
                  </div>
                  <div className="featured-card-time">
                    <span>{publishedDate}</span>
                    <div className="reading-time">
                      <span></span>
                      <span>{featuredPost.Time_To_Read}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsHeader;