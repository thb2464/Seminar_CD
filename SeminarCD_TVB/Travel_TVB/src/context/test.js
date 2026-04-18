import { API_BASE_URL } from './config.js';

// URL for your Strapi instance
const STRAPI_URL = `${API_BASE_URL}`;

// URL for your Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbSjINZR5Rc3ckzlSAWFCXE5RXux6lpQERWGU6PYBwc6LKPve3n06sS84I8uGX_oZpBw/exec';

/**
 * This object holds all the translatable text for the partner contact form.
 * It's structured by language code ('en' for English, 'vi' for Vietnamese).
 */
const formDataContent = {
  en: {
    title: "TELL US MORE ABOUT YOU!",
    orgName: "Organization Name",
    website: "Website",
    country: "Base Country",
    yourName: "Your Name",
    email: "Email",
    jobTitle: "Job Title",
    phone: "Phone Number",
    howDidYouKnow: "How did you know about us?",
    options: {
      word_of_mouth: "Word of mouth",
      search_engine: "Search Engine",
      social_media: "Social Media",
      advertisement: "Advertisement",
      other: "Other"
    },
    contactMethodLegend: "Preferred Contact Method",
    contactPhone: "Phone",
    contactEmail: "Email",
    submitButton: "LEAVE US A MESSAGE"
  },
  vi: {
    title: "CHO CHÚNG TÔI BIẾT THÊM VỀ BẠN!",
    orgName: "Tên tổ chức",
    website: "Trang web",
    country: "Quốc gia",
    yourName: "Tên của bạn",
    email: "Email",
    jobTitle: "Chức danh công việc",
    phone: "Số điện thoại",
    howDidYouKnow: "Bạn biết đến chúng tôi bằng cách nào?",
    options: {
      word_of_mouth: "Giới thiệu",
      search_engine: "Công cụ tìm kiếm",
      social_media: "Mạng xã hội",
      advertisement: "Quảng cáo",
      other: "Khác"
    },
    contactMethodLegend: "Phương thức liên hệ ưa thích",
    contactPhone: "Điện thoại",
    contactEmail: "Email",
    submitButton: "GỬI LỜI NHẮN CHO CHÚNG TÔI"
  }
};

/**
 * Finds the necessary HTML elements and updates their text content
 * based on the selected language.
 * @param {string} locale - The language code, e.g., 'en' or 'vi'.
 */
function updateFormContent(locale) {
  // Default to English if the requested locale isn't found
  const data = formDataContent[locale] || formDataContent.en;

  // Update the main form title
  document.querySelector('.pn-form-title').textContent = data.title;

  // Update all input field labels
  document.querySelector('label[for="orgName"]').textContent = data.orgName;
  document.querySelector('label[for="website"]').textContent = data.website;
  document.querySelector('label[for="country"]').textContent = data.country;
  document.querySelector('label[for="yourName"]').textContent = data.yourName;
  document.querySelector('label[for="email"]').textContent = data.email;
  document.querySelector('label[for="jobTitle"]').textContent = data.jobTitle;
  document.querySelector('label[for="phone"]').textContent = data.phone;
  document.querySelector('label[for="howDidYouKnow"]').textContent = data.howDidYouKnow;
  
  // Update the text of the options in the dropdown menu
  const selectElement = document.getElementById('howDidYouKnow');
  if (selectElement) {
    for (const option of selectElement.options) {
      if (data.options[option.value]) {
        option.textContent = data.options[option.value];
      }
    }
  }

  // Update the fieldset legend and radio button labels
  document.querySelector('.pn-fieldset legend').textContent = data.contactMethodLegend;
  document.querySelector('label[for="contactPhone"]').textContent = data.contactPhone;
  document.querySelector('label[for="contactEmail"]').textContent = data.contactEmail;

  // Update the submit button's text
  document.querySelector('.pn-form-submit-row button[type="submit"]').textContent = data.submitButton;
}

// A simple utility to get the current language setting from localStorage.
const i18n = {
  getCurrentLocale() {
    return localStorage.getItem('vnquantum_locale') || 'en';
  }
};

// Listen for the 'localeChanged' event from the navbar script.
window.addEventListener('localeChanged', (event) => {
  if (event.detail && event.detail.locale) {
    updateFormContent(event.detail.locale);
  }
});


// Main logic that runs after the page has loaded
document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Set the initial language of the form ---
    const initialLocale = i18n.getCurrentLocale();
    updateFormContent(initialLocale);
    
    // --- 2. Set up form submission logic ---
    const form = document.querySelector('.pn-form form');
    const phoneInput = document.querySelector("#phone");
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    const iti = window.intlTelInput(phoneInput, {
        initialCountry: "vn",
        separateDialCode: true,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/23.1.0/js/utils.js",
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); 
         
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;

        const formData = new FormData(form);
        const data = {
            orgName: formData.get('orgName'),
            website: formData.get('website'),
            country: formData.get('country'),
            yourName: formData.get('yourName'),
            Email: formData.get('email'),
            jobTitle: formData.get('jobTitle'),
            phone: iti.getNumber(),
            howDidYouKnow: formData.get('howDidYouKnow'),
            contactMethod: formData.get('contactMethod'),
        };

        try {
            const responses = await Promise.all([
                // Request 1: Send data to Strapi
                fetch(`${STRAPI_URL}/api/c-form-submissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: data }),
                }),

                // Request 2: Send data to Google Sheets
                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(data),
                })
            ]);

            const allOk = responses.every(response => response.ok);

            if (allOk) {
                submitButton.textContent = 'Submitted Successfully! ✅';
                form.reset();
                setTimeout(() => {
                    // Reset the button text to the correct language
                    const currentLocale = i18n.getCurrentLocale();
                    submitButton.textContent = formDataContent[currentLocale].submitButton || formDataContent.en.submitButton;
                    submitButton.disabled = false;
                }, 3000);
            } else {
                throw new Error('One of the submissions failed.');
            }

        } catch (error) {
            console.error('An error occurred during submission:', error);
            submitButton.textContent = 'Submission Failed. Try Again.';
            submitButton.disabled = false;
        }
    });
});