import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import the context hook
import config from '../../config/strapi';
import './Portfolio.css';

const Portfolio = () => {
  // 2. Get the current language from the context
  const { currentLanguage } = useLanguage();

  const [activeYear, setActiveYear] = useState(null);
  const [portfolioData, setPortfolioData] = useState({});
  const [partnersData, setPartnersData] = useState([]);
  const [portfolioInfo, setPortfolioInfo] = useState({
    subtitle: '',
    title: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarousel, setIsCarousel] = useState(false);
  const carouselRef = useRef(null);
  const [animationClass, setAnimationClass] = useState('fade-in');

  // Helper function to safely construct image URLs (No changes needed)
  const getImageUrl = (imageData) => {
    if (!imageData) {
      return null;
    }

    let imageUrl = null;
    
    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else if (imageData.data?.url) {
      imageUrl = imageData.data.url;
    } else if (imageData.data?.attributes?.url) {
      imageUrl = imageData.data.attributes.url;
    } else if (Array.isArray(imageData) && imageData.length > 0) {
      const firstImage = imageData[0];
      if (firstImage?.url) {
        imageUrl = firstImage.url;
      } else if (firstImage?.data?.url) {
        imageUrl = firstImage.data.url;
      } else if (firstImage?.data?.attributes?.url) {
        imageUrl = firstImage.data.attributes.url;
      }
    }

    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('/')) {
      return `${config.STRAPI_URL}${imageUrl}`;
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${config.STRAPI_URL}/${imageUrl}`;
  };

  // Check screen size and set carousel mode (No changes needed)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsCarousel(window.innerWidth <= 1150);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-slide functionality (No changes needed)
  useEffect(() => {
    if (!isCarousel || partnersData.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const itemsPerSlide = window.innerWidth <= 768 ? 2 : 3;
        const maxSlides = Math.ceil(partnersData.length / itemsPerSlide);
        return (prev + 1) % maxSlides;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isCarousel, partnersData.length]);

  // 3. Fetch data whenever 'currentLanguage' changes
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError(null);

        const populateQuery = 'populate[Year][populate][0]=Image&populate[Partner][populate][0]=PartnerLogo';
        // 4. Add the 'locale' parameter to the API request URL
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.PORTFOLIO}?${populateQuery}&locale=${currentLanguage.code}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const response_data = await response.json();
        const data = response_data.data;
        
        if (!data) {
          throw new Error('No data received from API');
        }

        // Extract portfolio info
        setPortfolioInfo({
          subtitle: data.Portfolio_Subtitle || 'Portfolio',
          title: data.Portfolia_Title || 'Dự Án Tiêu Biểu'
        });

        // Transform Year components data
        const yearData = {};
        const availableYears = [];
        
        if (data.Year && Array.isArray(data.Year)) {
          data.Year.forEach((yearItem, index) => {
            const year = yearItem.Year;
            
            if (!year) {
              return;
            }

            availableYears.push(year);
            
            const imageUrl = getImageUrl(yearItem.Image);
            
            const project = {
              id: yearItem.id || `project-${index}`,
              title: yearItem.Title || 'Untitled Project',
              description: yearItem.Description || '',
              image: imageUrl || 'https://picsum.photos/600/400?random=' + index,
              hasValidImage: !!imageUrl
            };
            
            if (!yearData[year]) {
              yearData[year] = [];
            }
            yearData[year].push(project);
          });
        }

        // Transform Partner components data
        const transformedPartners = [];
        if (data.Partner && Array.isArray(data.Partner)) {
          data.Partner.forEach((partner, index) => {
            const logoUrl = getImageUrl(partner.PartnerLogo);
            
            transformedPartners.push({
              id: partner.id || `partner-${index}`,
              name: partner.PartnerName || 'Unknown Partner',
              logo: logoUrl || '/api/placeholder/120/60',
              description: partner.Description || '',
              hasValidLogo: !!logoUrl
            });
          });
        }
        
        setPortfolioData(yearData);
        setPartnersData(transformedPartners);
        
        // Set initial active year
        if (availableYears.length > 0) {
          const sortedYears = availableYears.sort((a, b) => b - a);
          setActiveYear(sortedYears[0]);
        }
        
      } catch (err) {
        console.error('Portfolio fetch error:', err);
        setError(`Failed to load portfolio: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [currentLanguage]); // <-- Dependency array updated to re-fetch on language change

  // New handler for tab clicks to manage animations (No changes needed)
  const handleTabClick = (year) => {
    if (year === activeYear) {
      return;
    }

    setAnimationClass('fade-out');

    setTimeout(() => {
      setActiveYear(year);
      setAnimationClass('fade-in');
    }, 300);
  };

  // Helper function to render blocks content (No changes needed)
  const renderBlocksContent = (blocks) => {
    if (!blocks) return '';
    
    if (typeof blocks === 'string') {
      return blocks;
    }
    
    if (Array.isArray(blocks)) {
      return blocks.map((block, index) => {
        if (!block || !block.type) {
          return '';
        }

        const getBlockText = (children) => {
          if (!Array.isArray(children)) return '';
          return children.map(child => child?.text || '').join('');
        };

        switch (block.type) {
          case 'paragraph':
            const paragraphText = getBlockText(block.children);
            return `<p key="${index}">${paragraphText}</p>`;
            
          case 'list':
            const listItems = block.children?.map((item, itemIndex) => {
              if (item.type === 'list-item') {
                const itemText = getBlockText(item.children);
                return `<li key="${itemIndex}">${itemText}</li>`;
              }
              return '';
            }).filter(Boolean).join('') || '';
            
            return block.format === 'ordered' 
              ? `<ol key="${index}">${listItems}</ol>`
              : `<ul key="${index}">${listItems}</ul>`;
              
          case 'heading':
            const level = Math.min(Math.max(block.level || 3, 1), 6);
            const headingText = getBlockText(block.children);
            return `<h${level} key="${index}">${headingText}</h${level}>`;
            
          default:
            const defaultText = getBlockText(block.children);
            return defaultText ? `<p key="${index}">${defaultText}</p>` : '';
        }
      }).filter(Boolean).join('');
    }
    
    return '';
  };

  // Handle image load errors (No changes needed)
  const handleImageError = (e, type = 'project') => {
    if (type === 'project') {
      e.target.src = 'https://picsum.photos/600/400?random=' + Date.now();
    } else {
      e.target.src = '/api/placeholder/120/60';
    }
  };

  // Render partners section based on screen size (No changes needed)
  const renderPartnersSection = () => {
    if (partnersData.length === 0) return null;

    if (!isCarousel) {
      return (
        <div className="portfolio-partners">
          <div className="partners-grid">
            {partnersData.map((partner) => (
              <div key={partner.id} className="partner-logo">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  title={partner.description}
                  onError={(e) => handleImageError(e, 'partner')}
                />
                {!partner.hasValidLogo && (
                  <div className="logo-placeholder-warning">
                    No logo available
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    const itemsPerSlide = window.innerWidth <= 768 ? 2 : 3;
    const maxSlides = Math.ceil(partnersData.length / itemsPerSlide);
    
    return (
      <div className="portfolio-partners">
        <div className="partners-carousel-container">
          <div 
            className="partners-carousel"
            ref={carouselRef}
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              transition: 'transform 0.5s ease-in-out'
            }}
          >
            {Array.from({ length: maxSlides }, (_, slideIndex) => (
              <div key={slideIndex} className="carousel-slide">
                {partnersData
                  .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                  .map((partner) => (
                    <div key={partner.id} className="partner-logo">
                      <img 
                        src={partner.logo} 
                        alt={partner.name} 
                        title={partner.description}
                        onError={(e) => handleImageError(e, 'partner')}
                      />
                      {!partner.hasValidLogo && (
                        <div className="logo-placeholder-warning">
                          No logo available
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
          <div className="carousel-indicators">
            {Array.from({ length: maxSlides }, (_, index) => (
              <div
                key={index}
                className={`indicator ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- JSX Rendering (No significant changes, only logic above is updated) ---
  if (loading) {
    return (
      <div className="portfolio-container portfolio-loading">
        <div className="loading-spinner">Loading Portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-container portfolio-error">
        <div className="error-message">
          <h3>Error Loading Portfolio</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableYears = Object.keys(portfolioData).sort((a, b) => b - a);
  const currentYearProjects = portfolioData[activeYear] || [];

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <span className="portfolio-subtitle">{portfolioInfo.subtitle}</span>
        <h2 className="portfolio-title">{portfolioInfo.title}</h2>
      </div>

      <div className="portfolio-under">
        {availableYears.length > 0 && (
          <div className="portfolio-tabs">
            {availableYears.map((year) => (
              <button
                key={year}
                className={`portfolio-tab ${activeYear === year ? 'active' : ''}`}
                onClick={() => handleTabClick(year)}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        <div className={`portfolio-content ${animationClass}`}>
          {availableYears.length === 0 ? (
            <div className="no-projects">
              <p>Không có dự án nào</p>
            </div>
          ) : currentYearProjects.length === 0 ? (
            <div className="no-projects">
              <p>Không có dự án nào cho năm {activeYear}</p>
            </div>
          ) : (
            <div className="projects-grid">
              {currentYearProjects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-image">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      onError={(e) => handleImageError(e, 'project')}
                    />
                    {!project.hasValidImage && (
                      <div className="image-placeholder-warning">
                        No image available
                      </div>
                    )}
                  </div>
                  <div className="project-info">
                    <h3 className="project-title">{project.title}</h3>
                    <div 
                      className="project-description" 
                      dangerouslySetInnerHTML={{ 
                        __html: renderBlocksContent(project.description)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {renderPartnersSection()}
      </div>
    </div>
  );
};

export default Portfolio;