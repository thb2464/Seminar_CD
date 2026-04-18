// src/components/NewsPostArchive/NewsPostArchive.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './NewsPostArchive.css';
import newspaperIconUrl from '../../assets/newspaper-news-svgrepo-com.svg';
import FallBackImage from './PostBackUp.png';

// --- Helper Icon Components ---
const ClockIcon = () => (
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
 </svg>
);

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);


// --- Static Display Data for i18n (Unchanged) ---
const displayData = {
  vi: {
    title: 'Bài Viết',
    collectiveTab: 'Tin tổng hợp',
    integerTab: 'Tin TVB',
    marketTab: 'Thị trường du lịch',
    globalTab: 'Quốc tế',
    vietnameseTab: 'Trong nước',
    searchPlaceholder: 'Tìm kiếm bài viết...',
    prevButton: 'TRƯỚC',
    nextButton: 'TIẾP',
    loading: 'Đang tải bài viết...',
    error: 'Không thể tải bài viết.',
    noPosts: 'Không có bài viết nào được tìm thấy.',
    published: 'Xuất bản ngày',
    readingTimeSuffix: 'phút đọc'
  },
  en: {
    title: 'Articles',
    collectiveTab: 'General News',
    integerTab: 'TVB News',
    marketTab: 'Travel Market',
    globalTab: 'International',
    vietnameseTab: 'Domestic',
    searchPlaceholder: 'Search for articles...',
    prevButton: 'PREV',
    nextButton: 'NEXT',
    loading: 'Loading posts...',
    error: 'Could not load posts.',
    noPosts: 'No posts found.',
    published: 'Published',
    readingTimeSuffix: 'min read'
  },
  zh: {
    title: '文章',
    collectiveTab: '综合新闻',
    integerTab: 'TVB新闻',
    marketTab: '旅游市场',
    globalTab: '国际',
    vietnameseTab: '国内',
    searchPlaceholder: '搜索文章...',
    prevButton: '以前的',
    nextButton: '下一个',
    loading: '正在加载帖子...',
    error: '无法加载帖子。',
    noPosts: '没有找到帖子。',
    published: '已发表',
    readingTimeSuffix: '分钟阅读'
  }
};

// --- Helper function for advanced pagination ---
const generatePaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items = [];
    
    items.push(1);

    if (currentPage > 3) {
        items.push('...');
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
        items.push(i);
    }
    
    if (currentPage < totalPages - 2) {
        items.push('...');
    }
    
    items.push(totalPages);
    
    return items;
};


const NewsPostArchive = () => {
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.vi;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('integer');
  const [activeChildTab, setActiveChildTab] = useState('QuocTe');
  const [pagination, setPagination] = useState({ page: 1, pageCount: 1 });
  
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const POSTS_PER_PAGE = 9;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      const populateQuery = 'populate[Featured_Image]=true&populate[author][populate][AuthorAvatar]=true&populate[post_category]=true';
      const paginationQuery = `pagination[page]=${pagination.page}&pagination[pageSize]=${POSTS_PER_PAGE}`;
      
      // --- UPDATED: Sort by createdAt ---
      const sortQuery = 'sort=createdAt:desc';
      const localeQuery = `locale=${currentLanguage.code}`;
      
      let filterQuery = '';
      const filters = [];

      // 1. Main Tab Filter
      if (activeTab === 'integer') {
          filters.push(`filters[PostType][$eq]=Integer`);
      } else if (activeTab === 'thiTruong') {
          filters.push(`filters[PostType][$eq]=ThiTruong`);
          
          // 2. Child Tab Filter (only if main tab is thiTruong)
          if (activeChildTab === 'quocTe') {
              filters.push(`filters[TinThiTruong_Type][$eq]=QuocTe`);
          } else if (activeChildTab === 'trongNuoc') {
              filters.push(`filters[TinThiTruong_Type][$eq]=TrongNuoc`);
          }
      } else if (activeTab === 'tongHop') {
          filters.push(`filters[PostType][$eq]=TongHop`);
      }

      // 3. Search Filter
      if (searchTerm) {
          filters.push(`filters[$or][0][PostTitle][$containsi]=${encodeURIComponent(searchTerm)}&filters[$or][1][post_category][Category_Name][$containsi]=${encodeURIComponent(searchTerm)}`);
      }

      // 4. Combine all filters
      if (filters.length > 0) {
          filterQuery = `&${filters.join('&')}`;
      }

      const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.SINGLE_POST}?${populateQuery}&${paginationQuery}&${sortQuery}&${localeQuery}${filterQuery}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error! Status: ${response.status}`);
        }
        const json = await response.json();
        
        const transformedPosts = (json.data || []).map(post => ({
          id: post.id,
          slug: post.slug,
          title: post.PostTitle,
          category: post.post_category?.Category_Name || 'Uncategorized',
          author: {
            name: post.author?.DisplayName || 'Unknown Author',
            avatarUrl: post.author?.AuthorAvatar?.url
              ? `${config.STRAPI_URL}${post.author.AuthorAvatar.url}`
              : `https://i.pravatar.cc/40?u=${post.author?.id || 'default'}`,
          },
          // --- UPDATED: Use createdAt ---
          publishedDate: new Date(post.createdAt).toLocaleDateString(currentLanguage.code === 'vi' ? 'vi-VN' : 'en-US'),
          featuredImageUrl: post.Featured_Image?.url
            ? `${config.STRAPI_URL}${post.Featured_Image.url}`
            : FallBackImage,
          readingTime: post.Time_To_Read || `4 ${TEXT.readingTimeSuffix}`,
        }));

        setPosts(transformedPosts);
        if (json.meta && json.meta.pagination) {
          setPagination(json.meta.pagination);
        }

      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab, activeChildTab, pagination.page, searchTerm, currentLanguage]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
    if (tab === 'thiTruong') {
        setActiveChildTab('quocTe');
    }
  };

  const handleChildTabClick = (childTab) => {
    setActiveChildTab(childTab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pageCount) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const handleSearchSubmit = (e) => {
      e.preventDefault();
      setSearchTerm(inputValue);
      setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const pageItems = generatePaginationItems(pagination.page, pagination.pageCount);

  return (
  <div className="npa-wrapper">
    <div className="npa-container">
      <header className="npa-header">
        <div className="npa-header-top">
          <div className="npa-header-title">
            <img src={newspaperIconUrl} alt="Articles Icon" className="npa-header-icon" />
            <h1>{TEXT.title}</h1>
          </div>
          <div className="npa-tabs">
            <button className={`npa-tab-btn ${activeTab === 'integer' ? 'active' : ''}`} onClick={() => handleTabClick('integer')}>
              {TEXT.integerTab}
            </button>
            <button className={`npa-tab-btn ${activeTab === 'tongHop' ? 'active' : ''}`} onClick={() => handleTabClick('tongHop')}>
              {TEXT.collectiveTab}
            </button>
          </div>
          <form className="npa-search-form" onSubmit={handleSearchSubmit}>
            <input type="text" placeholder={TEXT.searchPlaceholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="npa-search-input" />
            <button type="submit" className="npa-search-btn"> <SearchIcon /> </button>
          </form>
        </div>
        
      </header>

      <main className="npa-content">
        {loading && <p className="npa-message">{TEXT.loading}</p>}
        {error && <p className="npa-message error">{TEXT.error}</p>}
        {!loading && !error && posts.length === 0 && <p className="npa-message">{TEXT.noPosts}</p>}
        {!loading && !error && posts.length > 0 && (
          <div className="npa-grid">
            {posts.map(post => (
              <a href={`/news/${post.slug}`} key={post.id} className="npa-card">
                <div className="npa-card-image"> <img src={post.featuredImageUrl} alt={post.title} /> </div>
                <div className="npa-card-content">
                  <span className="npa-card-category">{post.category}</span>
                  <h3 className="npa-card-title">{post.title}</h3>
                  <div className="npa-card-meta">
                        <div className="npa-card-author-date">
                            <div className="npa-card-author" style={{ display: 'none' }}>
                                <img src={post.author.avatarUrl} alt={post.author.name} className="npa-card-author-avatar" />
                                <span>{post.author.name}</span>
                            </div>
                            <span className="npa-card-date">{TEXT.published} {post.publishedDate}</span>
                       </div>
                    <div className="npa-reading-time"> <ClockIcon /> <span>{post.readingTime}</span> </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {!loading && !error && pagination.pageCount > 1 && (
        <footer className="npa-pagination">
          {pagination.page > 1 && (
               <button className="npa-page-btn prev" onClick={() => handlePageChange(pagination.page - 1)}>
                 {TEXT.prevButton}
            </button>
          )}

          {pageItems.map((item, index) => 
            typeof item === 'number' ? (
              <button
                key={index}
                className={`npa-page-btn ${pagination.page === item ? 'active' : ''}`}
                onClick={() => handlePageChange(item)}
              >
                {item}
              </button>
            ) : (
              <span key={index} className="npa-page-ellipsis">
                {item}
              </span>
            )
          )}

          {pagination.page < pagination.pageCount && (
            <button className="npa-page-btn next" onClick={() => handlePageChange(pagination.page + 1)}>
              {TEXT.nextButton}
            </button>
          )}
        </footer>
      )}
    </div>
  </div>
  );
};

export default NewsPostArchive;