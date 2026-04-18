import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext'; // Adjust path if needed
import config from '../../../config/strapi'; // Adjust path if needed
import './Newsletter.css';

// --- 1. Localized text for placeholders and messages ---
const localizedTexts = {
  placeholders: {
    vi: 'Nhập email của bạn',
    en: 'Nhập email của bạn',
    zh: '输入您的电子邮件',
  },
  submitting: {
    vi: 'Đang gửi...',
    en: 'Đang gửi...',
    zh: '提交中...',
  },
  successMessages: {
    vi: 'Cảm ơn bạn đã đăng ký!',
    en: 'Cảm ơn bạn đã đăng ký!',
    zh: '感谢您的订阅！',
  },
  errorMessages: {
    vi: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    en: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    zh: '发生错误。请再试一次。',
  },
};

// SVG icon for the button (no changes needed)
const SendIcon = () => (
  <svg
    className="newsletter-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const Newsletter = () => {
  const { currentLanguage } = useLanguage();

  // --- 2. State management for content, form, and submission status ---
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [submissionMessage, setSubmissionMessage] = useState('');

  // --- 3. Fetch component content from Strapi ---
  useEffect(() => {
    const fetchContent = async () => {
      if (!currentLanguage) return;

      setLoading(true);
      try {
        const localeQuery = `locale=${currentLanguage.code}`;
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.LAYOUT_NEWSLETTER}?${localeQuery}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const json = await response.json();
        if (json.data) {
          setContent({
            title: json.data.Newsletter_banner_Text,
            buttonText: json.data.Newsletter_button_text,
          });
        } else {
          throw new Error("No content data found in API response.");
        }
      } catch (err) {
        console.error("Failed to fetch newsletter content:", err);
        setError("Could not load content.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [currentLanguage]);

  // --- 4. Handle form submission to Strapi ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmissionStatus('submitting');
    setSubmissionMessage('');

    const payload = {
      UsersEmail: email,
    };

    try {
      // NOTE: For a POST request to a collection, you don't need the ':id'
      const submissionApiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.NEWSLETTER_SUBMISSION.replace('/:id', '')}`;

      const response = await fetch(submissionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Strapi v4+ expects data to be nested in a "data" object
        body: JSON.stringify({ data: payload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Submission failed.');
      }

      setSubmissionStatus('success');
      setSubmissionMessage(localizedTexts.successMessages[currentLanguage.code]);
      setEmail(''); // Clear the input field on success

    } catch (err) {
      console.error('Newsletter submission error:', err);
      setSubmissionStatus('error');
      setSubmissionMessage(localizedTexts.errorMessages[currentLanguage.code]);
    }
  };

  // --- 5. Determine current localized text ---
  const placeholderText = localizedTexts.placeholders[currentLanguage.code] || localizedTexts.placeholders.vi;
  const submittingText = localizedTexts.submitting[currentLanguage.code] || localizedTexts.submitting.vi;

  // --- 6. Render loading or error states ---
  if (loading) {
    return <section className="newsletter-section"><div className="newsletter-container">Loading...</div></section>;
  }

  if (error) {
    return (
      <section className="newsletter-section">
        <div className="newsletter-container">
          <h2 className="newsletter-title">Đăng ký để nhận tư vấn từ chuyên gia</h2>
          <form className="newsletter-form">
            <input type="email" className="newsletter-input" placeholder="Email" disabled />
            <button type="button" className="newsletter-button" disabled>Đăng ký <SendIcon /></button>
          </form>
        </div>
      </section>
    );
  }

  // --- 7. Render the dynamic component ---
  return (
    <section className="newsletter-section">
      <div className="newsletter-container">
        <h2 className="newsletter-title">{content?.title}</h2>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="newsletter-input"
            placeholder={placeholderText}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required // Makes the field required
            disabled={submissionStatus === 'submitting'}
          />
          <button
            type="submit"
            className="newsletter-button"
            disabled={submissionStatus === 'submitting'}
          >
            {submissionStatus === 'submitting' ? submittingText : content?.buttonText}
            <SendIcon />
          </button>
        </form>
        {submissionMessage && (
          <p className={`newsletter-message ${submissionStatus}`}>
            {submissionMessage}
          </p>
        )}
      </div>
    </section>
  );
};

export default Newsletter;