import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './Form.css';

const Form = () => {
  const { currentLanguage } = useLanguage();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // --- 1. ADD: State variables for the submission process ---
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [submissionError, setSubmissionError] = useState(null);

  const initialFormValues = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    interest: '',
    message: '',
  };

  const [formValues, setFormValues] = useState(initialFormValues);
  const [productType, setProductType] = useState('');

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const populateQuery = 'populate[Label]=*&populate[Form_slide][populate]=*&populate[options]=*';
        // Ensure your config file has this endpoint
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.CONTACT_FORM}?${populateQuery}&locale=${currentLanguage.code}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const json = await response.json();
        const data = json.data;

        if (!data) throw new Error('No data found for the Contact Form section.');
        
        const keyMaps = {
          vi: {
            "Tên Quý Khách": "firstName", "Họ": "lastName", "Số điện thoại": "phone", "Email": "email", "Tên Công Ty": "company", "Sản Phẩm Bảo Hiểm Quan Tâm": "interest", "Loại hình sản phẩm": "productType", "Lời Nhắn cho Integer": "message"
          },
          en: {
            "First Name": "firstName", "Last Name": "lastName", "Phone Number": "phone", "Email": "email", "Company Name": "company", "Insurance Product of Interest": "interest", "Product Type": "productType", "Message for Integer": "message"
          },
          zh: {
            "名字": "firstName", "姓": "lastName", "电话号码": "phone", "电子邮件": "email", "公司名称": "company", "感兴趣的保险产品": "interest", "产品类型": "productType", "给Integer的留言": "message"
          }
        };

        const keyMap = keyMaps[currentLanguage.code] || keyMaps.vi;
        
        const labels = {};
        const placeholders = {};
        
        data.Label?.forEach(item => {
          const key = keyMap[item.Label_name];
          if (key) {
            labels[key] = item.Label_name;
            placeholders[key] = item.Placeholder;
          }
        });

        const transformedData = {
          title: data.Form_title,
          description: data.Form_description,
          labels,
          placeholders,
          interestOptions: data.options?.map(option => option.Options) || [],
          productTypes: [data.TaiBaoHiemText, data.BaoHiemGocText],
          buttonText: data.Form_submitText,
          sliderTitle: data.Form_sliderTitle,
          sliderSlides: data.Form_slide?.map(slide => ({
            id: slide.id,
            image: `${config.STRAPI_URL}${slide.Form_slide_image.url}`,
            title: slide.Form_slide_title,
            year: slide.Form_slide_year,
            value: slide.Fomr_slide_value,
          })),
          // ADD: Success messages for the form
          successMessage: data.Success_message || 'Thank you!',
          successSubtext: data.Success_subtext || 'Your message has been sent successfully.'
        };

        setContent(transformedData);
        if (transformedData.productTypes.length > 1) {
          setProductType(transformedData.productTypes[1]);
        }

      } catch (err) {
        console.error("Failed to fetch Form data:", err);
        setError("Could not load form content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [currentLanguage]);

  useEffect(() => {
    if (!content || !content.sliderSlides || content.sliderSlides.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      setActiveIndex(prevIndex => (prevIndex + 1) % content.sliderSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [content]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  // --- 2. UPDATE: The handleSubmit function to send data to Strapi ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('submitting');
    setSubmissionError(null);

    // Map React state (camelCase) to Strapi schema fields (PascalCase)
    const payload = {
      Firstname: formValues.firstName,
      Lastname: formValues.lastName,
      Email: formValues.email,
      Phone: formValues.phone,
      Company: formValues.company,
      Interest: formValues.interest,
      productType: productType,
      Message: formValues.message,
    };

    try {
      const response = await fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.FORM_SUBMISSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Strapi expects the data to be nested under a "data" key
        body: JSON.stringify({ data: payload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Server error: ${response.status}`);
      }
      
      // On success
      setSubmissionStatus('success');
      setFormValues(initialFormValues); // Reset form fields

    } catch (err) {
      console.error("Submission failed:", err);
      setSubmissionError(err.message || 'An unknown error occurred. Please try again.');
      setSubmissionStatus('error');
    }
  };

  if (loading) return <section className="contact-section"><div>Loading Form...</div></section>;
  if (error) return <section className="contact-section"><div className="error-message">{error}</div></section>;
  if (!content) return null;

  const currentSlide = content.sliderSlides[activeIndex];

  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="form-column">
          <h2 className="form-title">{content.title}</h2>
          <p className="form-description">{content.description}</p>
          
          {/* --- 3. UPDATE: Conditionally render form, success, or error message --- */}
          {submissionStatus === 'success' ? (
            <div className="form-success-message">
              <h3>{content.successMessage}</h3>
              <p>{content.successSubtext}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">{content.labels.firstName}</label>
                  <input type="text" id="firstName" name="firstName" placeholder={content.placeholders.firstName} value={formValues.firstName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">{content.labels.lastName}</label>
                  <input type="text" id="lastName" name="lastName" placeholder={content.placeholders.lastName} value={formValues.lastName} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">{content.labels.email}</label>
                <input type="email" id="email" name="email" placeholder={content.placeholders.email} value={formValues.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">{content.labels.phone}</label>
                <input type="tel" id="phone" name="phone" placeholder={content.placeholders.phone} value={formValues.phone} onChange={handleInputChange} pattern="^\+?[\d\s\-\(\)]{7,20}$" title="Please enter a valid phone number" required />
              </div>
              <div className="form-group">
                <label htmlFor="company">{content.labels.company}</label>
                <input type="text" id="company" name="company" placeholder={content.placeholders.company} value={formValues.company} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="interest">{content.labels.interest}</label>
                <select id="interest" name="interest" value={formValues.interest} onChange={handleInputChange} required>
                  <option value="" disabled>{content.placeholders.interest}</option>
                  {content.interestOptions && content.interestOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                  <label>{content.labels.productType}</label>
                  <div className="radio-group">
                  <div 
                      className="radio-slider"
                      style={{ transform: productType === content.productTypes[0] ? 'translateX(0%)' : 'translateX(100%)' }}
                  ></div>
                  {content.productTypes.map(type => (
                      <button type="button" key={type} className={`radio-option ${productType === type ? 'active' : ''}`} onClick={() => setProductType(type)}>
                      {type}
                      </button>
                  ))}
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="message">{content.labels.message}</label>
                  <div className="textarea-wrapper">
                  <textarea id="message" name="message" placeholder={content.placeholders.message} rows="4" value={formValues.message} onChange={handleInputChange}></textarea>
                  <div className="expand-icon"></div>
                  </div>
              </div>

              {submissionStatus === 'error' && (
                <div className="form-submission-error">{submissionError}</div>
              )}
              
              <button type="submit" className="submit-btn" disabled={submissionStatus === 'submitting'}>
                <span>
                  {submissionStatus === 'submitting' ? 'Submitting...' : content.buttonText}
                </span>
                <div className="btn-arrow-icon"></div>
              </button>
            </form>
          )}
        </div>

        {currentSlide && (
          <div className="slider-column" style={{ backgroundImage: `url(${currentSlide.image})` }} key={currentSlide.id}>
            {/* ... slider content */}
          </div>
        )}
      </div>
    </section>
  );
};

export default Form;