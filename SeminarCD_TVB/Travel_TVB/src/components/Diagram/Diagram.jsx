import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './Diagram.css';

// Import icons
import messageIcon from './icons/message-circle.svg'
import weightICon from './icons/weight.svg'
import clockArrow from './icons/clock-arrow-up.svg'
import lightbulbIcon from './icons/lightbulb.svg'
import helmetIcon from './icons/helmet-construction-svgrepo-com.svg';
import secondaryConnector from './icons/secondary-connector.svg';
import factoryIcon from './icons/factory.svg';
import mainConnector from './icons/connector.svg';
import chartLineIcon from './icons/chart-line.svg';
import logoIcon from './icons/logo.svg';
import vectorIcon from './icons/Vector-1.svg';
import umbrellaIcon from './icons/umbrella.svg';


const Ripple = ({ ripples }) => (
    <>
        {ripples.map((ripple) => (
            <span
                key={ripple.id}
                className="ripple"
                style={{
                    top: ripple.y,
                    left: ripple.x,
                    width: ripple.size,
                    height: ripple.size,
                }}
            />
        ))}
    </>
);

// --- 1. Refactored InsuranceDiagram to receive props ---
const InsuranceDiagram = ({ content }) => {
    // This component no longer fetches data or manages translations.
    // It receives all its text content from its parent.
    if (!content) {
        return null; // Don't render if content is not available
    }

    return (
        <div className="new-diagram-container">
            <div className="left-section">
                <div className="text-block-wrapper with-padding">
                    <div className="text-block" id="block-a">
                        <div className="logo-block">
                            <img src={weightICon} style={{ width: '75%', height: '75%', objectFit: 'contain' }} alt="Weight icon" />
                        </div>
                        <span>{content.comparePlans}</span>
                    </div>
                </div>

                <div className="secondary-connector-wrapper">
                    <img src={secondaryConnector} alt="connector" className="connector-svg" id="conn-a-b" />
                </div>

                <div className="text-block-wrapper">
                    <div className="text-block" id="block-b">
                        <div className="logo-block">
                            <img src={messageIcon} style={{ width: '75%', height: '75%', objectFit: 'contain' }} alt="Message icon" />
                        </div>
                        <span>{content.expertAdvice}</span>
                    </div>
                </div>

                <div className="secondary-connector-wrapper">
                    <img src={secondaryConnector} alt="connector" className="connector-svg flipped" id="conn-b-dnb" />
                </div>

                <div className="doanh-nghiep-block" id="doanh-nghiep">
                    <div className="icon-circle" style={{ width: '15%', height: '15%', padding: '8px' }}>
                        <img src={factoryIcon} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(100%)' }} alt="Factory icon" />
                    </div>
                    <div className="doanh-nghiep-title">{content.business}</div>
                </div>

                <div className="secondary-connector-wrapper">
                    <img src={secondaryConnector} alt="connector" className="connector-svg" id="conn-dnb-c" />
                </div>

                <div className="text-block-wrapper">
                    <div className="text-block" id="block-c">
                        <div className="logo-block">
                            <img src={clockArrow} style={{ width: '75%', height: '75%', objectFit: 'contain' }} alt="Clock arrow icon" />
                        </div>
                        <span>{content.saveTime}</span>
                    </div>
                </div>

                <div className="secondary-connector-wrapper">
                    <img src={secondaryConnector} alt="connector" className="connector-svg flipped" id="conn-c-d" />
                </div>

                <div className="text-block-wrapper">
                    <div className="text-block" id="block-d">
                        <div className="logo-block">
                            <img src={lightbulbIcon} style={{ width: '75%', height: '75%', objectFit: 'contain' }} alt="Lightbulb icon" />
                        </div>
                        <span>{content.complexSolutions}</span>
                    </div>
                </div>
            </div>

            <div className="main-connector-wrapper">
                <img src={mainConnector} alt="connector" className="main-connector" id="main-conn-1" />
            </div>

            <div className="center-section">
                <div className="center-block" id="center-top">
                    <div className="center-icon">
                        <img src={chartLineIcon} alt="statistic rising up icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(100%)' }} />
                    </div>
                    <div className="center-text">{content.maximizeBenefits}</div>
                </div>

                <div className="secondary-connector-wrapper">
                    <img src={secondaryConnector} alt="connector" className="connector-svg" id="conn-mgb-top" />
                </div>

                <div className="moi-gioi-block" id="moi-gioi">
                    <div className="moi-gioi-header">
                        <img src={logoIcon} alt="logo" className="moi-gioi-icon" style={{ width: '20%', height: '20%', padding: '8px', backgroundColor: 'white' }} />
                    </div>
                    <div className="moi-gioi-title">{content.insuranceBroker}</div>
                    <ul className="moi-gioi-list">
                        <li>{content.riskAnalysis}</li>
                        <li>{content.negotiation}</li>
                        <li>{content.contractSupport}</li>
                        <li>{content.claimsHandling}</li>
                    </ul>
                </div>

                <div className="secondary-connector-wrapper">
                    <img src={secondaryConnector} alt="connector" className="connector-svg flipped" id="conn-mgb-bottom" />
                </div>

                <div className="center-block" id="center-bottom">
                    <div className="center-icon">
                        <img src={vectorIcon} alt="shield icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(100%)' }} />
                    </div>
                    <span className="center-text">{content.rightProduct}</span>
                </div>
            </div>

            <div className="main-connector-wrapper">
                <img src={mainConnector} alt="connector" className="main-connector flipped" id="main-conn-2" />
            </div>

            <div className="right-section">
                <div className="ben-cung-cap-block" id="ben-cung-cap">
                    <div className="icon-circle" style={{ padding: '8px' }}>
                        <img src={umbrellaIcon} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(100%)' }} alt="Umbrella icon" />
                    </div>
                    <div className="ben-cung-cap-title" dangerouslySetInnerHTML={{ __html: content.insuranceProvider?.replace(' ', '<br />') }} />
                </div>
            </div>
        </div>
    );
};


const Diagram = () => {
    const { currentLanguage } = useLanguage();
    const [diagramData, setDiagramData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [ripples, setRipples] = useState([]);

    useEffect(() => {
        const fetchDiagramData = async () => {
            setLoading(true); // Set loading true on each fetch
            try {
                const localeQuery = `locale=${currentLanguage.code}`;
                const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.DIAGRAM}?populate=*&${localeQuery}`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json();
                const data = json.data;
                if (!data) {
                    throw new Error('No data found for the diagram section.');
                }
                
                // --- 2. Expanded transformedData to include all fields from the API ---
                // Note: No .attributes wrapper for Strapi v5
                const transformedData = {
                    badge: data.Badge || '',
                    title: data.Title || '',
                    description: data.Descriptions || '',
                    button: {
                        text: data.Cta_button?.Text || 'Learn More',
                        url: data.Cta_button?.Url || '#',
                    },
                    // Fields for the InsuranceDiagram component
                    comparePlans: data.comparePlans || '',
                    expertAdvice: data.expertAdvice || '',
                    business: data.business || '',
                    saveTime: data.saveTime || '',
                    complexSolutions: data.complexSolutions || '',
                    maximizeBenefits: data.maximizeBenefits || '',
                    insuranceBroker: data.insuranceBroker || '',
                    riskAnalysis: data.riskAnalysis || '',
                    negotiation: data.negotiation || '',
                    contractSupport: data.contractSupport || '',
                    claimsHandling: data.claimsHandling || '',
                    rightProduct: data.rightProduct || '',
                    insuranceProvider: data.insuranceProvider || '',
                };
                setDiagramData(transformedData);
            } catch (err) {
                console.error('Failed to fetch diagram data:', err);
                setError('Could not load content. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchDiagramData();
    }, [currentLanguage]);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleButtonClick = (e) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const id = Date.now();
        setRipples(prev => [...prev, { id, size, x, y }]);
        setTimeout(() => setRipples(current => current.filter(r => r.id !== id)), 600);
    };

    if (loading) {
        return <div className="diagram-wrapper">Loading...</div>;
    }

    if (error) {
        return <div className="diagram-wrapper error-message">{error}</div>;
    }

    if (!diagramData) {
        return null;
    }
    
    return (
        <div className="diagram-wrapper">
            <div className={`main-wrapper ${isVisible ? 'fade-in' : ''}`}>
                <div className="hero-section">
                    <div className="features-badge">{diagramData.badge}</div>
                    <h1 dangerouslySetInnerHTML={{ __html: diagramData.title }} />
                    <p>{diagramData.description}</p>
                    <a href={diagramData.button.url} className="cta-link" target="_blank" rel="noopener noreferrer">
                        <button className="vietnamese-btn" onClick={handleButtonClick}>
                            <span className="btn-text">{diagramData.button.text}</span>
                            <div className="btn-arrow">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <Ripple ripples={ripples} />
                        </button>
                    </a>
                </div>

                {/* --- 3. Pass the fetched data down to the child component --- */}
                <InsuranceDiagram content={diagramData} />
            </div>
        </div>
    );
};

export default Diagram;