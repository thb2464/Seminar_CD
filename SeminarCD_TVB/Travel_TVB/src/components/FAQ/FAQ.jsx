import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import the context hook
import config from '../../config/strapi';
import './FAQ.css';

// Helper function to extract text from Strapi blocks format (No changes needed)
const extractTextFromBlocks = (blocks) => {
  if (!Array.isArray(blocks)) return '';
  
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        return block.children
          ?.filter(child => child.type === 'text')
          .map(child => child.text)
          .join('') || '';
      
      case 'list':
        const listItems = block.children?.map(listItem => {
          const itemText = listItem.children
            ?.filter(child => child.type === 'text')
            .map(child => child.text)
            .join('') || '';
          return block.format === 'unordered' ? `• ${itemText}` : `${itemText}`;
        }) || [];
        return listItems.join('\n');
      
      case 'heading':
        return block.children
          ?.filter(child => child.type === 'text')
          .map(child => child.text)
          .join('') || '';
      
      case 'quote':
        return block.children
          ?.filter(child => child.type === 'text')
          .map(child => child.text)
          .join('') || '';
      
      default:
        if (block.children && Array.isArray(block.children)) {
          return block.children
            .filter(child => child.type === 'text')
            .map(child => child.text)
            .join('');
        }
        return '';
    }
  }).filter(text => text.trim()).join('\n\n');
};

const FAQ = () => {
  // 2. Get the current language from the context
  const { currentLanguage } = useLanguage();

  const [faqData, setFaqData] = useState([]);
  const [mainTitle, setMainTitle] = useState('Những Câu Hỏi\nThường Gặp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  // 3. Fetch data whenever 'currentLanguage' changes
  useEffect(() => {
    const fetchFaqData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const populateQuery = 'populate=*';
        // 4. Add the 'locale' parameter to the API request URL
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.FAQ}?${populateQuery}&locale=${currentLanguage.code}`;

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data?.MainTitle && Array.isArray(data.data.MainTitle)) {
          const titleText = extractTextFromBlocks(data.data.MainTitle);
          if (titleText) {
            setMainTitle(titleText);
          }
        }
        
        const transformedFaq = data.data?.Question?.map((item, index) => {
          let answerText = '';
          if (item.Answer && Array.isArray(item.Answer)) {
            answerText = extractTextFromBlocks(item.Answer);
          }

          return {
            id: item.id || index + 1,
            question: item.Question || '',
            answer: answerText,
            order: index + 1
          };
        }) || [];
        
        setFaqData(transformedFaq);
        
      } catch (err) {
        console.error('Error fetching FAQ data:', err);
        setError('Failed to load FAQ content');
      } finally {
        setLoading(false);
      }
    };

    fetchFaqData();
  }, [currentLanguage]); // <-- Dependency array updated

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Loading state (No changes needed)
  if (loading) {
    return (
      <div className="faq-container">
        <div className="faq-wrapper">
          <h2 className="faq-main-title">Những Câu Hỏi<br />Thường Gặp</h2>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state (No changes needed)
  if (error && faqData.length === 0) {
    return (
      <div className="faq-container">
        <div className="faq-wrapper">
          <h2 className="faq-main-title">Những Câu Hỏi<br />Thường Gặp</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  // --- JSX Rendering (No changes needed) ---
  return (
    <div className="faq-container">
      <div className="faq-wrapper">
        <h2 className="faq-main-title">
          {mainTitle.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < mainTitle.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </h2>
        
        <div className="faq-list">
          {faqData.map((item, index) => (
            <div key={item.id} className={`faq-item ${activeIndex === index ? 'open' : ''}`}>
              <button
                className="faq-header"
                onClick={() => toggleAccordion(index)}
                aria-expanded={activeIndex === index}
                aria-controls={`answer-${item.id}`}
              >
                <h3 className="faq-title">{item.question}</h3>
                <div className="faq-toggle">
                  {activeIndex === index ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="11" width="12" height="2" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="11" width="12" height="2" fill="currentColor"/>
                      <rect x="11" y="6" width="2" height="12" fill="currentColor"/>
                    </svg>
                  )}
                </div>
              </button>
              
              <div 
                id={`answer-${item.id}`}
                role="region"
                className="faq-answer"
                aria-hidden={activeIndex !== index}
              >
                <div className="answer-content">
                  <div className="answer-wrapper">
                    {item.answer.split('\n').map((paragraph, pIndex) => (
                      paragraph.trim() ? <p key={pIndex}>{paragraph}</p> : <br key={pIndex} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;