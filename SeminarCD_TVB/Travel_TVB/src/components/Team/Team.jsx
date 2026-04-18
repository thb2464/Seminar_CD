import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './Team.css';
import placeholderImage from './placeholder.png';

const Team = () => {
  const { currentLanguage } = useLanguage();

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // CHANGED: Added 'Director' to the populate query
        const populateQuery = 'populate[Leader][populate]=*&populate[Expert][populate]=*&populate[Director][populate]=*';
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.ABOUT_TEAM}?${populateQuery}&locale=${currentLanguage.code}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        if (!data) {
          throw new Error('No data found for the Team section.');
        }

        // CHANGED: Added transformation for Director data
        const transformedData = {
          highlight: data.Team_highlight || '',
          title: data.Team_title || '',
          subtitle: data.Team_leader_subtible || '',
          directorSubtitle: data.Director_Subtitle || '', // ADDED
          expertSubtitle: data.Team_expert_subtitle || '',
          managementEmployees: data.Leader?.map(leader => ({
            id: leader.id,
            name: leader.Leader_name || '',
            position: leader.Leader_postition || '',
            email: leader.Leader_email || '',
            image: leader.Leader_image?.url ? `${config.STRAPI_URL}${leader.Leader_image.url}` : placeholderImage,
            description: leader.Leader_descriptions || ''
          })) || [],
          // ADDED: Director employees array
          directorEmployees: data.Director?.map(director => ({
            id: director.id,
            name: director.Director_Name || '',
            position: director.Director_Position || '',
            email: director.Director_Email || '',
            image: director.Director_Image?.url ? `${config.STRAPI_URL}${director.Director_Image.url}` : placeholderImage,
            description: director.Director_Descriptions || ''
          })) || [],
          expertEmployees: data.Expert?.map(expert => ({
            id: expert.id,
            name: expert.Expert_name || '',
            position: expert.Expert_position || '',
            email: expert.Expert_email || '',
            image: expert.Expert_image?.url ? `${config.STRAPI_URL}${expert.Expert_image.url}` : placeholderImage,
            description: expert.Expert_descriptions || ''
          })) || [],
        };
        
        setTeamData(transformedData);

      } catch (err) {
        console.error('Failed to fetch Team data:', err);
        setError('Could not load team content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [currentLanguage]);

  if (loading) {
    return <section className="team-section">Loading...</section>;
  }

  if (error) {
    return <section className="team-section error-message">{error}</section>;
  }

  if (!teamData) {
    return null;
  }

  return (
    <section className="team-section">
      <div className="team-container">
        <span className="team-highlight">{teamData.highlight}</span>
        
        <h2 className="team-title">{teamData.title}</h2>
        
        <p className="team-subtitle">{teamData.subtitle}</p>
        
        <div className="team-grid">
          {teamData.managementEmployees.map((employee) => (
            <div className="team-card" key={employee.id}>
              <div className="employee-image-container">
                <img 
                  src={employee.image} 
                  alt={employee.name} 
                  className="employee-image"
                />
                <div className="employee-description-overlay">
                  <p className="employee-description">{employee.description}</p>
                </div>
              </div>
              <div className="employee-info">
                <h3 className="employee-name">{employee.name}</h3>
                <p className="employee-position">{employee.position}</p>
                <div className="employee-contact">
                  <svg className="email-icon" viewBox="-5 -7 34 34" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span className="employee-email">{employee.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- ADDED: Board of Directors Section --- */}
        <div className="expert-section"> {/* Reusing 'expert-section' for styling */}
          <p className="team-subtitle expert-subtitle">{teamData.directorSubtitle}</p>
          
          <div className="team-grid">
            {teamData.directorEmployees.map((employee) => (
              <div className="team-card" key={employee.id}>
                <div className="employee-image-container">
                  <img 
                    src={employee.image} 
                    alt={employee.name} 
                    className="employee-image"
                  />
                  <div className="employee-description-overlay">
                    <p className="employee-description">{employee.description}</p>
                  </div>
                </div>
                <div className="employee-info">
                  <h3 className="employee-name">{employee.name}</h3>
                  <p className="employee-position">{employee.position}</p>
                  <div className="employee-contact">
                    <svg className="email-icon" viewBox="-5 -7 34 34" fill="none" stroke="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span className="employee-email">{employee.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* --- END: Board of Directors Section --- */}

        <div className="expert-section">
          <p className="team-subtitle expert-subtitle">{teamData.expertSubtitle}</p>
          
          <div className="team-grid">
            {teamData.expertEmployees.map((employee) => (
              <div className="team-card" key={employee.id}>
                <div className="employee-image-container">
                  <img 
                    src={employee.image} 
                    alt={employee.name} 
                    className="employee-image"
                  />
                  <div className="employee-description-overlay">
                    <p className="employee-description">{employee.description}</p>
                  </div>
                </div>
                <div className="employee-info">
                  <h3 className="employee-name">{employee.name}</h3>
                  <p className="employee-position">{employee.position}</p>
                  <div className="employee-contact">
                    <svg className="email-icon" viewBox="-5 -7 34 34" fill="none" stroke="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span className="employee-email">{employee.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;