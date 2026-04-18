// src/components/Footer/Footer.jsx

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext'; // Make sure this path is correct
import config from '../../../config/strapi'; // Make sure this path is correct
import './Footer.css';
import logo from './logo.png';

const Footer = () => {
    // 1. State for managing data, loading status, and errors
    const [footerContent, setFooterContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentLanguage } = useLanguage();

    // 2. Keep the quote data hardcoded as requested
    const quoteData = {
        part1: '',
        part2: '',
        part3: '',
        part4: '',
    };

    // 3. Fetch footer data from Strapi when the component mounts or language changes
    useEffect(() => {
        const fetchFooterData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Populate all component fields for the footer
                const populateQuery = 'populate=*';
                // Construct the API URL with the correct locale
                const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.LAYOUT_FOOTER}?${populateQuery}&locale=${currentLanguage.code}`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }

                const jsonResponse = await response.json();
                if (!jsonResponse.data) {
                    throw new Error('No data was found in the API response.');
                }

                // For Strapi v5, data is directly in `jsonResponse.data`
                setFooterContent(jsonResponse.data);

            } catch (e) {
                console.error("Failed to fetch footer data:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFooterData();
    }, [currentLanguage]); // Re-fetch data when the language changes

    // 4. Handle Loading State
    if (loading) {
        return <footer className="site-footer"><div className="footer-container">Loading Footer...</div></footer>;
    }

    // 5. Handle Error State
    if (error) {
        return <footer className="site-footer"><div className="footer-container">Error loading footer: {error}</div></footer>;
    }

    // Render nothing if content is not available
    if (!footerContent) {
        return null;
    }

    // 6. Format the address string as per requirements (replace '.' with a newline)
    const formattedAddress = footerContent.Footer_Address?.replace(/\./g, '\n') || '';

    return (
        <footer className="site-footer">
            <div className="footer-container">
                {/* Upper Part of the Footer */}
                <div className="footer-upper">
                    {/* Column 1: Logo and Hardcoded Quote */}
                    <div className="footer-col-main">
                        <img src={logo} alt="Integer Logo" className="footer-logo" />
                        <p className="footer-quote">
                            <span className="quote-highlight">{quoteData.part1}</span>
                            {quoteData.part2}
                            <span className="quote-highlight">{quoteData.part3}</span>
                            {quoteData.part4}
                        </p>
                    </div>

                    {/* Column 2: Về chúng tôi (Menu 1 from Strapi) */}
                    <div className="footer-col">
                        <h4 className="footer-title">{footerContent.Menu1_Title}</h4>
                        <ul className="footer-links">
                            {footerContent.Footer_Menu1_Item?.map((link, index) => (
                                <li key={index}>
                                    <a href={link.path}>{link.text}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Góc chuyên gia (Menu 2 from Strapi) */}
                    <div className="footer-col">
                        <h4 className="footer-title">{footerContent.Menu2_Title}</h4>
                        <ul className="footer-links">
                            {footerContent.Footer_Menu2_Item?.map((link, index) => (
                                <li key={index}>
                                    <a href={link.path}>{link.text}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Liên hệ (Contact from Strapi) */}
                    <div className="footer-col">
                        <h4 className="footer-title">{footerContent.Contact_Title}</h4>
                        <div className="footer-info">
                            {footerContent.Contact_Item?.map((item, index) => (
                                <p key={index}>
                                    <span className="info-label">{item.label}</span>
                                    {/* Check if the value contains newlines for special formatting */}
                                    {item.value.includes('\n') ? (
                                        <React.Fragment>
                                            <br />
                                            {item.value.split('\n').map((line, i) => (
                                                <React.Fragment key={i}>
                                                    {line}
                                                    <br />
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ) : (
                                        ` ${item.value}`
                                    )}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Column 5: Địa chỉ (Address from Strapi) */}
                    <div className="footer-col">
                        <h4 className="footer-title">{footerContent.Footer_Address_Title}</h4>
                        <div className="footer-info">
                            <p>
                                {formattedAddress.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        <br />
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="footer-divider" />

                {/* Lower Part of the Footer */}
                <div className="footer-lower">
                    <p className="footer-copyright">{footerContent.Copyright}</p>

                    {/* --- ✅ ADD THIS LINE --- */}
                    <a href="https://youtu.be/dQw4w9WgXcQ?si=Oxyx6vUNJuh_WXzE" className="footer-lamweb">Designed By Team TVB</a>

                    <div className="footer-legal-links">
                        {footerContent.Terms_and_Services?.map((link, index) => (
                            <a key={index} href={link.path}>
                                {link.text}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;