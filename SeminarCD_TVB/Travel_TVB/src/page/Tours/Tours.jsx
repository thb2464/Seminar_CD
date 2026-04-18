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
  },
};

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
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageCount: 1 });
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortValue, setSortValue] = useState('createdAt:desc');
  const [priceRange, setPriceRange] = useState([0, 50000000]);

  // Fetch tour categories dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const localeQuery = `locale=${currentLanguage.code}`;
        const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.TOUR_CATEGORIES}?${localeQuery}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
        const json = await response.json();
        const categoryList = (json.data || [])
          .filter(cat => cat.Category_Name)
          .map(cat => ({
            id: cat.id,
            name: cat.Category_Name,
            slug: cat.Category_Slug || cat.Category_Name.toLowerCase().replace(/\s+/g, '-'),
          }));
        setCategories(categoryList);
      } catch (err) {
        console.error('Failed to fetch tour categories:', err);
      }
    };

    fetchCategories();
  }, [currentLanguage]);

  const categoryTabs = [
    { key: 'all', label: TEXT.allCategories },
    ...categories.map(cat => ({ key: String(cat.id), slug: cat.slug, label: cat.name })),
  ];

  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      setError(null);

      const populateQuery = 'populate[Featured_Image]=true&populate[tour_category]=true&populate[Highlights]=true';
      const paginationQuery = `pagination[page]=${pagination.page}&pagination[pageSize]=${TOURS_PER_PAGE}`;
      const sortQuery = `sort=${sortValue}`;
      const localeQuery = `locale=${currentLanguage.code}`;

      let filterQuery = '';
      if (activeCategory !== 'all') {
        filterQuery += `&filters[tour_category][id][$eq]=${activeCategory}`;
      }
      if (searchTerm) {
        filterQuery += `&filters[Tour_Name][$containsi]=${encodeURIComponent(searchTerm)}`;
      }
      if (priceRange[0] > 0) {
        filterQuery += `&filters[Price][$gte]=${priceRange[0]}`;
      }
      if (priceRange[1] < 50000000) {
        filterQuery += `&filters[Price][$lte]=${priceRange[1]}`;
      }

      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}?${populateQuery}&${paginationQuery}&${sortQuery}&${localeQuery}${filterQuery}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
        const json = await response.json();

        let tourList = json.data || [];

        // Client-side filtering (fallback for when server ignores query params)
        if (activeCategory !== 'all') {
          const catId = parseInt(activeCategory);
          tourList = tourList.filter(t => t.tour_category?.id === catId);
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          tourList = tourList.filter(t => (t.Tour_Name || '').toLowerCase().includes(term));
        }
        // Price range filter
        tourList = tourList.filter(t => {
          const p = parseInt(t.Price) || 0;
          return p >= priceRange[0] && p <= priceRange[1];
        });

        // Client-side sorting (for mock data fallback)
        const [sortField, sortDir] = sortValue.split(':');
        tourList.sort((a, b) => {
          let valA = a[sortField];
          let valB = b[sortField];
          if (sortField === 'Price') { valA = parseInt(valA) || 0; valB = parseInt(valB) || 0; }
          if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = (valB || '').toLowerCase(); }
          if (valA < valB) return sortDir === 'asc' ? -1 : 1;
          if (valA > valB) return sortDir === 'asc' ? 1 : -1;
          return 0;
        });

        const transformedTours = tourList.map(tour => ({
          ...tour,
          featuredImageUrl: tour.Featured_Image?.url
            ? (tour.Featured_Image.url.startsWith('http') ? tour.Featured_Image.url : `${config.STRAPI_URL}${tour.Featured_Image.url}`)
            : 'https://picsum.photos/seed/tour/400/300',
          categoryName: tour.tour_category?.Category_Name || '',
        }));

        setTours(transformedTours);
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
  }, [activeCategory, searchTerm, pagination.page, sortValue, priceRange, currentLanguage]);

  const handleCategoryClick = (categorySlug) => {
    setActiveCategory(categorySlug);
    setPagination(prev => ({ ...prev, page: 1 }));
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
            {categoryTabs.map(tab => (
              <button
                key={tab.key}
                className={`tours-tab-btn ${activeCategory === tab.key ? 'active' : ''}`}
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
                <option value="Price:asc">{TEXT.sortPriceLow}</option>
                <option value="Price:desc">{TEXT.sortPriceHigh}</option>
                <option value="Rating:desc">{TEXT.sortRating}</option>
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
