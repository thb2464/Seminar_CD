import React from 'react';
import './FeatureSection.css';

/**
 * A repeatable component for displaying a service feature with an image and text.
 * The image position can be alternated between left and right.
 *
 * @param {object} props - The component props.
 * @param {string} props.heading - The title of the feature.
 * @param {string} props.description - The description of the feature.
 * @param {object} props.ctaButton - The call-to-action button details.
 * @param {string} props.imageUrl - The URL for the feature image.
 * @param {'left' | 'right'} props.imagePosition - The position of the image relative to the text.
 */
const FeatureSection = ({ heading, description, ctaButton, imageUrl, imagePosition }) => {
    // This determines the layout class based on the imagePosition prop.
    const containerClass = `feature-section-container ${imagePosition === 'left' ? 'image-left' : 'image-right'}`;

    return (
        <section className={containerClass}>
            <div className="feature-section-image">
                <img src={imageUrl} alt={heading} />
            </div>
            <div className="feature-section-content">
                <h2>{heading}</h2>
                <p>{description}</p>
                <a href={ctaButton.link} className="cta-button">
                    {ctaButton.text} &rarr;
                </a>
            </div>
        </section>
    );
};

export default FeatureSection;