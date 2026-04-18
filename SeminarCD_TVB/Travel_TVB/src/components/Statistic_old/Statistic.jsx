import React, { useState, useEffect } from 'react';
import config from '../../config/strapi'; // Adjust path based on your folder structure
import useCountUp from '../../hooks/useCountUp';
import './Statistic.css';

// A sub-component for individual cards to keep the code clean
const StatCard = ({ item }) => {
  // Extract the numerical part for the animation
  const endValue = parseInt(item.value, 10);
  // Extract the non-numerical part (the "suffix")
  const suffix = item.value.replace(endValue, '').trim();
  
  // Use the count-up hook
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

const Statistic_old = () => {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from Strapi
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${config.STRAPI_URL}${config.API_ENDPOINTS.STATISTIC}?populate[StatisticSlide]=*`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform Strapi data to match your component's expected format
        const transformedStats = data.data.StatisticSlide?.map((slide, index) => ({
          id: slide.id || index + 1,
          value: slide.value || '',
          line1: slide.line1 || '',
          line2: slide.line2 || '',
        })) || [];
        
        setStatsData(transformedStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics data:', err);
        setError('Failed to load statistics content');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="stats-section">
        <div className="stats-container">
          <div className="stats-loading">
            <div className="loading-spinner">Loading statistics...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="stats-section">
        <div className="stats-container">
          <div className="stats-error">
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // No stats available
  if (statsData.length === 0) {
    return (
      <div className="stats-section">
        <div className="stats-container">
          <div className="stats-empty">
            <div className="empty-message">No statistics available</div>
          </div>
        </div>
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

export default Statistic_old;