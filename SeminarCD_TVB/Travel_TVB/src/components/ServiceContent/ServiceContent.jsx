import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // 1. Import hook
import FeatureSection from '../FeatureSection/FeatureSection';
import config from '../../config/strapi';
import './ServiceContent.css';

const getPlainTextFromBlocks = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) return '';
    return blocks
        .map(block => {
            if (block.type === 'paragraph' && block.children) {
                return block.children.map(child => child.text).join('');
            }
            return '';
        })
        .join('\n');
};

const ServiceContent = ({ slug }) => {
    // 2. Get current language from context
    const { currentLanguage } = useLanguage(); 

    const [serviceData, setServiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchServiceData = async () => {
            setLoading(true);
            setError(null);

            try {
                const populateQuery = [
                    'populate[Main_Service_Button]=true',
                    'populate[main_Service_Featured_Image]=true',
                    'populate[Partners][populate]=PartnerLogo',
                    'populate[Feature][populate]=*'
                ].join('&');

                const filterQuery = `filters[slug][$eq]=${slug}`;
                // 3. Add locale to the API call to fetch the correct language version
                const localeQuery = `locale=${currentLanguage.code}`; 
                const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.INDIVIDUAL_SERVICES}?${filterQuery}&${populateQuery}&${localeQuery}`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`API error! Status: ${response.status}`);
                }

                const json = await response.json();
                const strapiData = json.data[0];

                if (!strapiData) {
                    throw new Error('Service data not found for the selected language. Please check the slug.');
                }

                const transformedData = {
                    mainTitle: strapiData.Service_main_Title,
                    mainDescription: strapiData.Service_main_description,
                    ctaButton: {
                        text: strapiData.Main_Service_Button?.Text || 'Learn More',
                        link: strapiData.Main_Service_Button?.Url || '/',
                    },
                    mainServiceFeaturedImage: strapiData.main_Service_Featured_Image?.url
                        ? `${config.STRAPI_URL}${strapiData.main_Service_Featured_Image.url}`
                        : 'https://picsum.photos/450/250',
                    partnerHighlightText: strapiData.Partner_Highlight_Text,
                    partners: (strapiData.Partners || []).map(partner => ({
                        PartnerName: partner.PartnerName,
                        PartnerLogo: partner.PartnerLogo?.url
                            ? `${config.STRAPI_URL}${partner.PartnerLogo.url}`
                            : '',
                    })),
                    features: (strapiData.Feature || []).map(feature => ({
                        id: feature.id,
                        heading: feature.Heading,
                        description: getPlainTextFromBlocks(feature.descriptions),
                        ctaButton: {
                            text: feature.feature_ctaButton?.Text || 'Details',
                            link: feature.feature_ctaButton?.Url || '/',
                        },
                        imageUrl: feature.Feature_Featured_Image?.url
                            ? `${config.STRAPI_URL}${feature.Feature_Featured_Image.url}`
                            : 'https://picsum.photos/800/600',
                        imagePosition: feature.imagePosition,
                    })),
                };

                setServiceData(transformedData);

            } catch (err) {
                console.error("Failed to fetch service data from Strapi:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchServiceData();
    // 4. Re-run effect if slug or language changes
    }, [slug, currentLanguage]); 

    if (loading) {
        return <div className="service-content-wrapper"><h2>Loading Service...</h2></div>;
    }

    if (error || !serviceData) {
        return (
            <div className="service-not-found">
                <h2>Service Not Found</h2>
                <p>{error || "Please check the URL and try again."}</p>
            </div>
        );
    }

    return (
        <div className="service-content-wrapper">
            <div className="service-hero-container">
                <header className="service-hero">
                    <div className="service-hero-content">
                        <h1>{serviceData.mainTitle}</h1>
                        <p>{serviceData.mainDescription}</p>
                        <a href={serviceData.ctaButton.link} className="cta-button">
                            {serviceData.ctaButton.text} &rarr;
                        </a>
                    </div>
                    <div className="service-hero-image">
                        <div className="hero-image-placeholder">
                            <img src={serviceData.mainServiceFeaturedImage} alt={serviceData.mainTitle} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} />
                        </div>
                    </div>
                </header>
            </div>

            <section className="service-partners">
                <h4>{serviceData.partnerHighlightText}</h4>
                <div className="partner-logos">
                    {serviceData.partners.map((partner, index) => (
                        partner.PartnerLogo && <img key={index} src={partner.PartnerLogo} alt={partner.PartnerName} />
                    ))}
                </div>
            </section>

            <main className="service-features-list">
                {serviceData.features.map((feature) => (
                    <FeatureSection
                        key={feature.id}
                        heading={feature.heading}
                        description={feature.description}
                        ctaButton={feature.ctaButton}
                        imageUrl={feature.imageUrl}
                        imagePosition={feature.imagePosition}
                    />
                ))}
            </main>
        </div>
    );
};

export default ServiceContent;