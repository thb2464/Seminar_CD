import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './Journey.css';

const Journey = () => {
  const { currentLanguage } = useLanguage();
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const itemRefs = useRef([]);

  // --- 1. Add state to hold the calculated max width ---
  const [maxDateWidth, setMaxDateWidth] = useState(0);
  
  // --- 2. Create a ref array to hold the date DOM elements ---
  const dateRefs = useRef([]);

  useEffect(() => {
    const fetchJourneyData = async () => {
      try {
        setLoading(true);
        setError(null);
        const populateQuery = 'populate=*';
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.ABOUT_JOURNEY}?${populateQuery}&locale=${currentLanguage.code}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        if (!data) {
          throw new Error('No data found for the Journey section.');
        }

        const transformedData = {
          highlight: data.Highlight || '',
          title: data.Title || '',
          timelineEvents: data.TimelineEvents?.map(event => ({
            id: event.id,
            date: event.date || '',
            cardTitle: event.cardTitle || '',
            cardDescription: event.cardDescription || '',
          })) || [],
        };
        
        setJourneyData(transformedData);
      } catch (err) {
        console.error('Failed to fetch Journey data:', err);
        setError('Could not load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJourneyData();
  }, [currentLanguage]);

  // --- 3. Add an effect to calculate the max width after data loads ---
  useEffect(() => {
    if (!journeyData || journeyData.timelineEvents.length === 0) return;
    
    // Reset on data change to handle different languages
    setMaxDateWidth(0); 

    // We use a timeout to ensure the DOM has painted with the new content
    const timer = setTimeout(() => {
      let maxWidth = 0;
      const currentRefs = dateRefs.current.filter(ref => ref !== null);
    
      currentRefs.forEach(ref => {
        const width = ref.getBoundingClientRect().width;
        if (width > maxWidth) {
          maxWidth = width;
        }
      });
    
      if (maxWidth > 0) {
        setMaxDateWidth(maxWidth);
      }
    }, 100); // A small delay is sometimes needed for full render

    return () => clearTimeout(timer);
  }, [journeyData]);


  // --- Effect for Intersection Observer animations (No changes needed) ---
  useEffect(() => {
    if (!journeyData || journeyData.timelineEvents.length === 0) {
      return;
    }
    const STAGGER_DELAY = 150;
    const options = { threshold: 0.2, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
      intersectingEntries.forEach((entry, i) => {
        const index = parseInt(entry.target.dataset.index, 10);
        setTimeout(() => {
          setVisibleItems((prev) => new Set(prev).add(index));
        }, i * STAGGER_DELAY);
        observer.unobserve(entry.target);
      });
    }, options);
    const currentItemRefs = itemRefs.current.filter(ref => ref !== null);
    currentItemRefs.forEach((ref) => {
      observer.observe(ref);
    });
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [journeyData]);

  if (loading) return <section className="journey-section">Loading...</section>;
  if (error) return <section className="journey-section error-message">{error}</section>;
  if (!journeyData) return null;

  return (
    <section className="journey-section">
      <div className="journey-container">
        <span className="journey-highlight">{journeyData.highlight}</span>
        <h2 className="journey-title">{journeyData.title}</h2>
        <div className="journey-timeline">
          {journeyData.timelineEvents.map((event, index) => {
            const gradients = [
              'linear-gradient(90deg, #04284c, #000000)',
              'linear-gradient(90deg, #194470, #262222)',
              'linear-gradient(90deg, #37608a, #1b3c5d)',
              'linear-gradient(90deg, #6b9bd0, #44719f)',
            ];
            const dotColors = ['#04284c', '#194470', '#37608a', '#6b9bd0'];
            const gradient = gradients[index % gradients.length];
            const dotColor = dotColors[index % dotColors.length];

            return (
              <div 
                className={`timeline-item ${visibleItems.has(index) ? 'visible' : ''}`}
                key={event.id}
                ref={el => itemRefs.current[index] = el}
                data-index={index}
                style={{ transitionDelay: `${index * 0.2}s` }}
              >
                <div 
                  className="timeline-date" 
                  // --- 4. Attach the ref to the date element ---
                  ref={el => dateRefs.current[index] = el}
                  // --- 5. Apply the calculated min-width ---
                  style={{ minWidth: maxDateWidth > 0 ? `${maxDateWidth}px` : 'auto' }}
                >
                  {event.date.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="timeline-connector">
                  <div className="timeline-dot" style={{ borderColor: dotColor }}></div>
                  {index < journeyData.timelineEvents.length - 1 && (
                    <div className="timeline-line"></div>
               )}
                </div>
                
                <div className="timeline-card" style={{ background: gradient }}>
                  <h3>{event.cardTitle}</h3>
                  {event.cardDescription && <p>{event.cardDescription}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Journey;