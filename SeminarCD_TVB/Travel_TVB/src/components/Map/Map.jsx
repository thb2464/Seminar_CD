import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import the context hook
import config from '../../config/strapi';
import './Map.css';
import { FaBuilding, FaPhoneAlt, FaEnvelope, FaClock } from 'react-icons/fa';

const iconMap = {
  Building: FaBuilding,
  Phone: FaPhoneAlt,
  Envelope: FaEnvelope,
  Clock: FaClock,
};

const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1317.1418571820243!2d106.69581269271532!3d10.78319663819488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f368888f5fd%3A0x426ccc2df7b8b6f1!2zNDEtNDMgVHLhuqduIENhbyBWw6JuLCBQaMaw4budbmcgNiwgUXXhuq1uIDMsIEjhu5MgQ2jDrSBNaW5oIDYwMDAwMCwgVmnhu4d0IE5hbQ!5e1!3m2!1svi!2s!4v1757182717352!5m2!1svi!2s";

const Map = () => {
  // 2. Get the current language from the context
  const { currentLanguage } = useLanguage();

  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch data whenever 'currentLanguage' changes
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        const populateQuery = 'populate=ContactInfo';
        // 4. Add the 'locale' parameter to the API request URL
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.CONTACT_MAP}?${populateQuery}&locale=${currentLanguage.code}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        if (!data) {
          throw new Error('No data found for the Map section.');
        }

        const transformedData = {
          title: data.Map_title || '',
          contactInfo: data.ContactInfo?.map(item => ({
            id: item.id,
            Icon: iconMap[item.Icon] || FaBuilding,
            title: item.Title || '',
            details: item.Details || ''
          })) || [],
          mapEmbedUrl: mapEmbedUrl
        };

        setMapData(transformedData);

      } catch (err) {
        console.error("Failed to fetch Map data:", err);
        setError("Could not load map content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [currentLanguage]); // <-- Dependency array updated

  if (loading) {
    return <section className="map-section"><div>Loading Map...</div></section>;
  }

  if (error) {
    return <section className="map-section"><div className="error-message">{error}</div></section>;
  }

  if (!mapData) {
    return null;
  }

  return (
    <section className="map-section">
      <div className="map-container">
        <div className="map-google">
          <iframe
            src={mapData.mapEmbedUrl}
            width="100%"
            height="480"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Integer Office Location"
          ></iframe>
        </div>

        <div className="map-info">
          <h2>{mapData.title}</h2>
          <div className="info-list">
            {mapData.contactInfo.map(({ id, Icon, title, details }) => (
              <div className="info-item" key={id}>
                <div className="info-icon">
                  <Icon />
                </div>
                <div className="info-text">
                  <p className="info-title">{title}</p>
                  <p className="info-details">
                    {details.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Map;