import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import hook
import config from '../../config/strapi';
import useCountUp from '../../hooks/useCountUp';
import './Statistic.css';

// StatCard sub-component (no changes needed)
const StatCard = ({ item }) => {
  const endValue = parseInt(item.value, 10);
  const suffix = item.value.replace(endValue, '').trim();
  const count = useCountUp(endValue, 2000);

  return (
    <div className={`stat-card ${item.className || ''}`}>
      <h2 className="stat-number">
        {count}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </h2>
      <div className="stat-text">
        <p>{item.line1}</p>
        <p>{item.line2}</p>
      </div>
    </div>
  );
};

const Statistic = () => {
  const { currentLanguage } = useLanguage(); // 2. Use hook
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from Strapi
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 4. Update API URL with locale
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.STATISTIC}?populate[StatisticSlide]=*&locale=${currentLanguage.code}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const transformedStats = data.data.StatisticSlide?.map((slide, index) => ({
          id: slide.id || index + 1,
          value: slide.value || '',
          line1: slide.line1 || '',
          line2: slide.line2 || '',
        })) || [];
        
        setStatsData(transformedStats);
      } catch (err) {
        console.error('Error fetching statistics data:', err);
        setError('Failed to load statistics content');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, [currentLanguage]); // 3. Add dependency

  // --- Render Logic (no changes needed) ---
  if (loading) {
    return (
      <div className="stats-section">
        <div className="stats-container"><div className="stats-loading"><div className="loading-spinner">Loading statistics...</div></div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-section">
        <div className="stats-container"><div className="stats-error"><div className="error-message">{error}</div></div></div>
      </div>
    );
  }

  if (statsData.length === 0) {
    return (
      <div className="stats-section">
        <div className="stats-container"><div className="stats-empty"><div className="empty-message">No statistics available</div></div></div>
      </div>
    );
  }

  return (
    <div className="stats-section">
      <div className="stats-container">
        {statsData.map((item) => (
          <StatCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Statistic;