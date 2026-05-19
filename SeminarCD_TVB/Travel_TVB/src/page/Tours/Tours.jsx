import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import TourCard from '../../components/TourCard/TourCard';
import PriceRangeSlider from '../../components/PriceRangeSlider/PriceRangeSlider';
import AnimateOnScroll from '../../components/AnimateOnScroll/AnimateOnScroll';
import './Tours.css';

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Display labels for every locale we support. `regions` mirrors the catalog
// service's REGIONS enum (services/catalog-service/src/catalog/dto/tour-query.dto.ts).
const displayData = {
  vi: {
    pageTitle: 'Tour Du Lịch',
    pageSubtitle: 'Khám phá những hành trình tuyệt vời nhất Việt Nam.',
    allCategories: 'Tất cả',
    searchPlaceholder: 'Tìm tour..',
    sortLabel: 'Sắp xếp:',
    sortDefault: 'Mới nhất',
    sortPriceLow: 'Giá tăng dần',
    sortPriceHigh: 'Giá giảm dần',
    sortRating: 'Đánh giá cao',
    priceRange: 'Khoảng giá',
    loading: 'Đang tải tour...',
    noTours: 'Không tìm thấy tour nào.',
    error: 'Không thể tải tour.',
    prevButton: 'TRƯỚC',
    nextButton: 'TIẾP',
    regions: {
      MienBac: 'Miền Bắc',
      MienTrung: 'Miền Trung',
      MienNam: 'Miền Nam',
      TayNguyen: 'Tây Nguyên',
      NhieuVung: 'Nhiều Vùng',
    },
  },
  en: {
    pageTitle: 'Tours',
    pageSubtitle: 'Discover the most amazing journeys across Vietnam',
    allCategories: 'All',
    searchPlaceholder: 'Search tours...',
    sortLabel: 'Sort by:',
    sortDefault: 'Newest',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortRating: 'Highest Rated',
    loading: 'Loading tours...',
    noTours: 'No tours found.',
    error: 'Could not load tours.',
    prevButton: 'PREV',
    nextButton: 'NEXT',
    priceRange: 'Price Range',
    regions: {
      MienBac: 'Northern',
      MienTrung: 'Central',
      MienNam: 'Southern',
      TayNguyen: 'Central Highlands',
      NhieuVung: 'Multi-Region',
    },
  },
  zh: {
    pageTitle: '旅游线路',
    pageSubtitle: '探索越南最精彩的旅程',
    allCategories: '全部',
    searchPlaceholder: '搜索旅游...',
    sortLabel: '排序:',
    sortDefault: '最新',
    sortPriceLow: '价格从低到高',
    sortPriceHigh: '价格从高到低',
    sortRating: '评分最高',
    loading: '正在加载旅游...',
    noTours: '没有找到旅游。',
    error: '无法加载旅游。',
    prevButton: '上一页',
    nextButton: '下一页',
    priceRange: '价格范围',
    regions: {
      MienBac: '北部',
      MienTrung: '中部',
      MienNam: '南部',
      TayNguyen: '中部高地',
      NhieuVung: '多区域',
    },
  },
};

// Region codes are a fixed enum on the Tour entity — no reason to round-trip
// through a database table for the filter chips.
const REGION_CODES = ['MienBac', 'MienTrung', 'MienNam', 'TayNguyen', 'NhieuVung'];

const generatePaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items = [1];
  if (currentPage > 3) items.push('...');
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);
  for (let i = startPage; i <= endPage; i++) items.push(i);
  if (currentPage < totalPages - 2) items.push('...');
  items.push(totalPages);
  return items;
};

const TOURS_PER_PAGE = 9;

const Tours = () => {
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // activeRegion is 'all' or one of REGION_CODES.
  const [activeRegion, setActiveRegion] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pageCount: 1 });
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortValue, setSortValue] = useState('createdAt:desc');
  const [priceRange, setPriceRange] = useState([0, 50000000]);

  // Filter chips: "All" + one chip per region enum value, labelled in the
  // current locale. No DB round-trip required — REGION_CODES mirrors the
  // catalog-service enum.
  const regionTabs = [
    { key: 'all', label: TEXT.allCategories },
    ...REGION_CODES.map((code) => ({ key: code, label: TEXT.regions[code] || code })),
  ];

  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('locale', currentLanguage.code);
      params.set('sort', sortValue);
      params.set('pagination[page]', String(pagination.page));
      params.set('pagination[pageSize]', String(TOURS_PER_PAGE));
      if (activeRegion !== 'all') params.set('filters[region]', activeRegion);
      if (searchTerm) params.set('filters[search]', searchTerm);

      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}?${params.toString()}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
        const json = await response.json();
        let tourList = json.data || [];

        // Price filter is the only one the catalog-service doesn't accept yet,
        // so we still filter it client-side.
        tourList = tourList.filter((t) => {
          const p = parseInt(t.price) || 0;
          return p >= priceRange[0] && p <= priceRange[1];
        });

        // Image-URL resolver (kept inline to avoid drifting from TourDetail's copy).
        const resolveImg = (u) =>
          !u
            ? 'https://picsum.photos/seed/tour/400/300'
            : u.startsWith('http')
              ? u
              : u.startsWith('/uploads/')
                ? `${config.STRAPI_URL}${u}`
                : u;

        setTours(
          tourList.map((tour) => ({
            ...tour,
            featuredImageUrl: resolveImg(tour.featuredImageUrl),
            regionLabel: tour.region ? TEXT.regions[tour.region] || tour.region : '',
          })),
        );
        if (json.meta?.pagination) {
          setPagination(json.meta.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch tours:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [activeRegion, searchTerm, pagination.page, sortValue, priceRange, currentLanguage]);

  const handleCategoryClick = (regionKey) => {
    setActiveRegion(regionKey);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (e) => {
    setSortValue(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePriceChange = (values) => {
    setPriceRange(values);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pageCount) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const pageItems = generatePaginationItems(pagination.page, pagination.pageCount);

  return (
    <div className="tours-page">
      <div className="tours-hero">
        <AnimateOnScroll direction="fromBottom">
          <h1 className="tours-hero-title">{TEXT.pageTitle}</h1>
          <p className="tours-hero-subtitle">{TEXT.pageSubtitle}</p>
        </AnimateOnScroll>
      </div>

      <div className="tours-container">
        <div className="tours-controls">
          <div className="tours-tabs">
            {regionTabs.map((tab) => (
              <button
                key={tab.key}
                className={`tours-tab-btn ${activeRegion === tab.key ? 'active' : ''}`}
                onClick={() => handleCategoryClick(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="tours-controls-right">
            <PriceRangeSlider
              min={0}
              max={50000000}
              values={priceRange}
              onChange={handlePriceChange}
              label={TEXT.priceRange}
            />
            <form className="tours-search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder={TEXT.searchPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="tours-search-input"
              />
              <button type="submit" className="tours-search-btn"><SearchIcon /></button>
            </form>
            <div className="tours-sort">
              <label>{TEXT.sortLabel}</label>
              <select value={sortValue} onChange={handleSortChange}>
                <option value="createdAt:desc">{TEXT.sortDefault}</option>
                <option value="price:asc">{TEXT.sortPriceLow}</option>
                <option value="price:desc">{TEXT.sortPriceHigh}</option>
                <option value="rating:desc">{TEXT.sortRating}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="tours-content">
          {loading && <p className="tours-message">{TEXT.loading}</p>}
          {error && <p className="tours-message error">{TEXT.error}</p>}
          {!loading && !error && tours.length === 0 && <p className="tours-message">{TEXT.noTours}</p>}
          {!loading && !error && tours.length > 0 && (
            <div className="tours-grid">
              {tours.map(tour => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>

        {!loading && !error && pagination.pageCount > 1 && (
          <div className="tours-pagination">
            {pagination.page > 1 && (
              <button className="tours-page-btn prev" onClick={() => handlePageChange(pagination.page - 1)}>
                {TEXT.prevButton}
              </button>
            )}
            {pageItems.map((item, index) =>
              typeof item === 'number' ? (
                <button
                  key={index}
                  className={`tours-page-btn ${pagination.page === item ? 'active' : ''}`}
                  onClick={() => handlePageChange(item)}
                >
                  {item}
                </button>
              ) : (
                <span key={index} className="tours-page-ellipsis">{item}</span>
              )
            )}
            {pagination.page < pagination.pageCount && (
              <button className="tours-page-btn next" onClick={() => handlePageChange(pagination.page + 1)}>
                {TEXT.nextButton}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tours;
