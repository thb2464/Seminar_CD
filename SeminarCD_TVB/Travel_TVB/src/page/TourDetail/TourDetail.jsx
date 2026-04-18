import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import BookingForm from '../../components/BookingForm/BookingForm';
import './TourDetail.css';

const transportLabels = {
  vi: { XeKhach: 'Xe khách', MayBay: 'Máy bay', Tau: 'Tàu', XeMay: 'Xe máy', KetHop: 'Kết hợp' },
  en: { XeKhach: 'Coach Bus', MayBay: 'Airplane', Tau: 'Train/Boat', XeMay: 'Motorbike', KetHop: 'Combined' },
  zh: { XeKhach: '大巴', MayBay: '飞机', Tau: '火车/船', XeMay: '摩托车', KetHop: '综合' },
};

const displayData = {
  vi: {
    highlights: 'Điểm nổi bật',
    description: 'Mô tả tour',
    itinerary: 'Lịch trình',
    gallery: 'Hình ảnh',
    duration: 'Thời gian',
    days: 'ngày',
    nights: 'đêm',
    departure: 'Khởi hành từ',
    transport: 'Phương tiện',
    maxParticipants: 'Số người tối đa',
    people: 'người',
    rating: 'Đánh giá',
    reviews: 'đánh giá',
    bookNow: 'Đặt Tour Ngay',
    contactUs: 'Liên Hệ Tư Vấn',
    backToTours: 'Quay lại danh sách tour',
    loading: 'Đang tải thông tin tour...',
    notFound: 'Không tìm thấy tour.',
    fromPrice: 'Giá từ',
  },
  en: {
    highlights: 'Highlights',
    description: 'Tour Description',
    itinerary: 'Itinerary',
    gallery: 'Gallery',
    duration: 'Duration',
    days: 'days',
    nights: 'nights',
    departure: 'Departure from',
    transport: 'Transport',
    maxParticipants: 'Max participants',
    people: 'people',
    rating: 'Rating',
    reviews: 'reviews',
    bookNow: 'Book Now',
    contactUs: 'Contact Us',
    backToTours: 'Back to tours',
    loading: 'Loading tour details...',
    notFound: 'Tour not found.',
    fromPrice: 'From',
  },
  zh: {
    highlights: '亮点',
    description: '旅游描述',
    itinerary: '行程',
    gallery: '图片',
    duration: '时长',
    days: '天',
    nights: '晚',
    departure: '出发地',
    transport: '交通',
    maxParticipants: '最多参与人数',
    people: '人',
    rating: '评分',
    reviews: '评论',
    bookNow: '立即预订',
    contactUs: '联系我们',
    backToTours: '返回旅游列表',
    loading: '正在加载旅游详情...',
    notFound: '未找到旅游。',
    fromPrice: '价格从',
  },
};

const formatPrice = (price) => {
  if (!price) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(price)) + ' ₫';
};

const renderContent = (blocks) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block, index) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index}>
            {block.children?.map((child, childIndex) => {
              let text = child.text || '';
              if (child.bold) text = <strong key={childIndex}>{text}</strong>;
              else if (child.italic) text = <em key={childIndex}>{text}</em>;
              else if (child.underline) text = <u key={childIndex}>{text}</u>;
              else text = <span key={childIndex}>{text}</span>;
              return text;
            })}
          </p>
        );
      case 'heading':
        const HeadingTag = `h${block.level || 2}`;
        return (
          <HeadingTag key={index}>
            {block.children?.map((child, childIndex) => (
              <span key={childIndex}>{child.text || ''}</span>
            ))}
          </HeadingTag>
        );
      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag key={index}>
            {block.children?.map((item, itemIndex) => (
              <li key={itemIndex}>
                {item.children?.map((child, childIndex) => (
                  <span key={childIndex}>{child.text || ''}</span>
                ))}
              </li>
            ))}
          </ListTag>
        );
      case 'image':
        return (
          <img
            key={index}
            src={block.image?.url?.startsWith('http') ? block.image.url : `${config.STRAPI_URL}${block.image?.url}`}
            alt={block.image?.alternativeText || 'Tour image'}
            className="content-image"
          />
        );
      default:
        return null;
    }
  });
};

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const TourDetail = () => {
  const { slug } = useParams();
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;
  const langCode = currentLanguage.code;
  const transports = transportLabels[langCode] || transportLabels.en;

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      setLoading(true);
      setError(null);

      const populateQuery = 'populate=*';
      const filterQuery = `filters[slug][$eq]=${slug}`;
      const localeQuery = `locale=${currentLanguage.code}`;

      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}?${populateQuery}&${filterQuery}&${localeQuery}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
        const json = await response.json();

        const tourData = json.data?.[0];
        if (!tourData) {
          setError('Tour not found');
          return;
        }

        // Process image URLs
        const processedDescription = (tourData.Description || []).map(block => {
          if (block.type === 'image' && block.image?.url) {
            const url = block.image.url;
            if (url.startsWith('http')) return block;
            return { ...block, image: { ...block.image, url: `${config.STRAPI_URL}${url}` } };
          }
          return block;
        });

        const processedItinerary = (tourData.Itinerary || []).map(block => {
          if (block.type === 'image' && block.image?.url) {
            const url = block.image.url;
            if (url.startsWith('http')) return block;
            return { ...block, image: { ...block.image, url: `${config.STRAPI_URL}${url}` } };
          }
          return block;
        });

        setTour({
          ...tourData,
          Description: processedDescription,
          Itinerary: processedItinerary,
          featuredImageUrl: tourData.Featured_Image?.url
            ? (tourData.Featured_Image.url.startsWith('http')
              ? tourData.Featured_Image.url
              : `${config.STRAPI_URL}${tourData.Featured_Image.url}`)
            : 'https://picsum.photos/seed/tour/1200/500',
          galleryImages: (tourData.Gallery || []).map(img => ({
            url: img.url.startsWith('http') ? img.url : `${config.STRAPI_URL}${img.url}`,
            alt: img.alternativeText || tourData.Tour_Name,
          })),
          categoryName: tourData.tour_category?.Category_Name || '',
        });
      } catch (err) {
        console.error('Failed to fetch tour:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [slug, currentLanguage]);

  if (loading) {
    return <div className="tour-detail-loading"><p>{TEXT.loading}</p></div>;
  }

  if (error || !tour) {
    return (
      <div className="tour-detail-loading">
        <p>{TEXT.notFound}</p>
        <Link to="/tours" className="tour-back-link">{TEXT.backToTours}</Link>
      </div>
    );
  }

  const hasDiscount = tour.Original_Price && parseInt(tour.Original_Price) > parseInt(tour.Price);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      <div className="tour-detail-page">
        {/* Hero */}
        <div className="tour-detail-hero" style={{ backgroundImage: `url(${tour.featuredImageUrl})` }}>
          <div className="tour-detail-hero-overlay">
            <Link to="/tours" className="tour-back-link-hero">{TEXT.backToTours}</Link>
            <div className="tour-detail-hero-content">
              {tour.categoryName && <span className="tour-detail-category">{tour.categoryName}</span>}
              <h1 className="tour-detail-title">{tour.Tour_Name}</h1>
              <div className="tour-detail-hero-meta">
                <span>{tour.Duration_Days}{TEXT.days} {tour.Duration_Nights}{TEXT.nights}</span>
                <span>{tour.Location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="tour-detail-container">
          <div className="tour-detail-main">
            {/* Highlights */}
            {tour.Highlights && tour.Highlights.length > 0 && (
              <section className="tour-detail-section">
                <h2>{TEXT.highlights}</h2>
                <div className="tour-highlights-list">
                  {tour.Highlights.map((h, i) => (
                    <div key={i} className="tour-highlight-item">
                      <CheckIcon />
                      <span>{h.Highlight_Text}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description */}
            {tour.Description && tour.Description.length > 0 && (
              <section className="tour-detail-section">
                <h2>{TEXT.description}</h2>
                <div className="rich-text-content">
                  {renderContent(tour.Description)}
                </div>
              </section>
            )}

            {/* Itinerary */}
            {tour.Itinerary && tour.Itinerary.length > 0 && (
              <section className="tour-detail-section">
                <h2>{TEXT.itinerary}</h2>
                <div className="rich-text-content tour-itinerary">
                  {renderContent(tour.Itinerary)}
                </div>
              </section>
            )}

            {/* Gallery */}
            {tour.galleryImages && tour.galleryImages.length > 0 && (
              <section className="tour-detail-section">
                <h2>{TEXT.gallery}</h2>
                <div className="tour-gallery-grid">
                  {tour.galleryImages.map((img, i) => (
                    <div key={i} className="tour-gallery-item">
                      <img src={img.url} alt={img.alt} loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="tour-detail-sidebar">
            <div className="tour-sidebar-card">
              {/* Price */}
              <div className="tour-sidebar-price">
                {hasDiscount && (
                  <span className="tour-sidebar-original-price">{formatPrice(tour.Original_Price)}</span>
                )}
                <span className="tour-sidebar-current-price">{formatPrice(tour.Price)}</span>
                <span className="tour-sidebar-per-person">/ {langCode === 'vi' ? 'người' : langCode === 'zh' ? '人' : 'person'}</span>
              </div>

              {/* Info rows */}
              <div className="tour-sidebar-info">
                <div className="tour-sidebar-row">
                  <span className="tour-sidebar-label">{TEXT.duration}</span>
                  <span className="tour-sidebar-value">{tour.Duration_Days} {TEXT.days} {tour.Duration_Nights} {TEXT.nights}</span>
                </div>
                {tour.Departure_Location && (
                  <div className="tour-sidebar-row">
                    <span className="tour-sidebar-label">{TEXT.departure}</span>
                    <span className="tour-sidebar-value">{tour.Departure_Location}</span>
                  </div>
                )}
                {tour.Transport_Type && (
                  <div className="tour-sidebar-row">
                    <span className="tour-sidebar-label">{TEXT.transport}</span>
                    <span className="tour-sidebar-value">{transports[tour.Transport_Type] || tour.Transport_Type}</span>
                  </div>
                )}
                {tour.Max_Participants && (
                  <div className="tour-sidebar-row">
                    <span className="tour-sidebar-label">{TEXT.maxParticipants}</span>
                    <span className="tour-sidebar-value">{tour.Max_Participants} {TEXT.people}</span>
                  </div>
                )}
                {tour.Rating && (
                  <div className="tour-sidebar-row">
                    <span className="tour-sidebar-label">{TEXT.rating}</span>
                    <span className="tour-sidebar-value tour-sidebar-rating">
                      <StarIcon /> {tour.Rating} ({tour.Review_Count} {TEXT.reviews})
                    </span>
                  </div>
                )}
              </div>

              {/* Booking Form */}
              <BookingForm tour={tour} />
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );
};

export default TourDetail;
