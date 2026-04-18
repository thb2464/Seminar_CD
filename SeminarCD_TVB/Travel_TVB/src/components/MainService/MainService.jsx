import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import hook
import './MainService.css';
import config from '../../config/strapi'; 

// 2. Create a dictionary for the title
const titles = {
  vi: "Dịch Vụ Chính",
  en: "Main Services",
  zh: "主要服务"
};

const MainService = () => {
  // 3. Get current language from context
  const { currentLanguage } = useLanguage(); 

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const servicesPerPage = 3;

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(0); // Reset to first page on language change
      
      const populateQuery = 'populate[main_Service_Featured_Image]=true';
      // 4. Add locale to the API call to filter services by language
      const localeQuery = `locale=${currentLanguage.code}`;
      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.INDIVIDUAL_SERVICES}?${populateQuery}&${localeQuery}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error! Status: ${response.status}`);
        }
        const json = await response.json();
        
        const transformedServices = json.data.map(item => ({
          id: item.id,
          slug: item.slug,
          title: item.Simplified_Title,
          description: item.Simplified_description,
          imageUrl: item.main_Service_Featured_Image?.url
            ? `${config.STRAPI_URL}${item.main_Service_Featured_Image.url}`
            : 'https://via.placeholder.com/400x300?text=No+Image',
        }));

        setServices(transformedServices);
      } catch (err) {
        console.error("Failed to fetch services from Strapi:", err);
        setError("Could not load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  // 5. Re-run effect when language changes
  }, [currentLanguage]); 

  const pageCount = Math.ceil(services.length / servicesPerPage);
  const currentServices = services.slice(
    currentPage * servicesPerPage,
    (currentPage + 1) * servicesPerPage
  );

  const handleDotClick = (index) => {
    setCurrentPage(index);
  };

  if (loading) {
    return <div className="main-service-container"><h2>Loading Services...</h2></div>;
  }

  if (error) {
    return <div className="main-service-container"><p className="error-message">{error}</p></div>;
  }

  // 6. Use the translated title
  const mainTitle = titles[currentLanguage.code] || titles.vi;

  return (
    <section className="main-service-container">
      <h2 className="main-service-title">{mainTitle}</h2>

      <div className="main-service-cards-grid">
        {currentServices.map(service => (
          <Link to={`/service/${service.slug}`} key={service.id} className="main-service-card" style={{ backgroundImage: `url(${service.imageUrl})` }}>
            <div className="main-service-card-overlay"></div>
            <div className="main-service-card-content">
              <div className="main-service-card-text">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <div className="main-service-card-arrow-wrapper">
                <span className="main-service-card-arrow">&rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="pagination-dots">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              className={`dot ${currentPage === index ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MainService;