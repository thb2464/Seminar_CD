// src/components/SmallPostArchive/SmallPostArchive.jsx

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './SmallPostArchive.css';
import newspaperIconUrl from '../../assets/newspaper-news-svgrepo-com.svg';
import FallBackImage from './PostBackUp.png';

// --- Helper Icon Component ---
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

// --- MODIFICATION START: Renamed 'featuredTab' to 'popularTab' and updated text (Unchanged) ---
const displayData = {
  vi: {
    title: 'Bài Viết',
    latestTab: 'Mới Nhất',
    popularTab: 'Phổ Biến',
    prevButton: 'TRƯỚC',
    nextButton: 'TIẾP',
    loading: 'Đang tải bài viết...',
    error: 'Không thể tải bài viết.',
    noPosts: 'Không có bài viết nào.',
    published: 'Đăng ngày',
  },
  en: {
    title: 'Articles',
    latestTab: 'Latest',
    popularTab: 'Popular',
    prevButton: 'PREV',
    nextButton: 'NEXT',
    loading: 'Loading posts...',
    error: 'Could not load posts.',
    noPosts: 'No posts found.',
    published: 'Published',
  },
  zh: {
    title: '文章',
    latestTab: '最新',
    popularTab: '热门',
    prevButton: '以前的',
    nextButton: '下一个',
    loading: '正在加载...',
    error: '无法加载帖子。',
    noPosts: '没有找到帖子。',
    published: '已发表',
  },
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

// --- Helper to transform Strapi post data into a consistent format ---
const transformPost = (post, langCode) => ({
    slug: post.slug,
    title: post.PostTitle,
    category: post.post_category?.Category_Name || 'Uncategorized',
    author: {
      name: post.author?.DisplayName || 'Unknown Author',
      avatarUrl: post.author?.AuthorAvatar?.url
        ? `${config.STRAPI_URL}${post.author.AuthorAvatar.url}`
        : 'https://i.pravatar.cc/40',
    },
    // --- UPDATED: Use createdAt ---
    publishedDate: new Date(post.createdAt).toLocaleDateString(langCode === 'vi' ? 'vi-VN' : 'en-US'),
    featuredImageUrl: post.Featured_Image?.url
      ? `${config.STRAPI_URL}${post.Featured_Image.url}`
      : FallBackImage,
    readingTime: post.Time_To_Read || (langCode === 'vi' ? '4 phút đọc' : '4 min read'),
});


const SmallPostArchive = () => {
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.vi;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [pagination, setPagination] = useState({ page: 1, pageCount: 1 });

  const POSTS_PER_PAGE = 6;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      const localeQuery = `locale=${currentLanguage.code}`;

      try {
        if (activeTab === 'popular') {
          // --- Path for "Popular" Tab: Fetch from single type and paginate on client ---
          const populateQuery = 'populate[popular_posts][populate]=*';
          
          const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.LAYOUT_POPULAR_POSTS}?${populateQuery}&${localeQuery}`;

          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
          const json = await response.json();
          
          const allPopularPosts = json.data?.popular_posts || [];
          
          const totalPages = Math.ceil(allPopularPosts.length / POSTS_PER_PAGE);
          const currentPage = Math.min(pagination.page > totalPages ? 1 : pagination.page, totalPages) || 1;

          const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
          const paginatedData = allPopularPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

          setPosts(paginatedData.map(post => transformPost(post, currentLanguage.code)));
          setPagination({ page: currentPage, pageCount: totalPages });

        } else {
          // --- Path for "Latest" Tab ---
          const populateQuery = 'populate[Featured_Image]=true&populate[author][populate][AuthorAvatar]=true&populate[post_category]=true';
          const paginationQuery = `pagination[page]=${pagination.page}&pagination[pageSize]=${POSTS_PER_PAGE}`;
          
          // --- UPDATED: Sort by createdAt ---
          const sortQuery = 'sort=createdAt:desc';
          
          const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.SINGLE_POST}?${populateQuery}&${paginationQuery}&${sortQuery}&${localeQuery}`;

          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
          const json = await response.json();

          setPosts((json.data || []).map(post => transformPost(post, currentLanguage.code)));
          if (json.meta && json.meta.pagination) {
            setPagination(json.meta.pagination);
          }
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab, pagination.page, currentLanguage]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 })); 
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pageCount) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const pageItems = generatePaginationItems(pagination.page, pagination.pageCount);

  return (
    <div className="small-post-archive-container">
      <header className="spa-header">
        <div className="spa-header-title">
          <img src={newspaperIconUrl} alt="Articles Icon" className="spa-header-icon" />
          <h2>{TEXT.title}</h2>
        </div>
        <div className="spa-tabs">
          <button
            className={`spa-tab-btn ${activeTab === 'latest' ? 'active' : ''}`}
            onClick={() => handleTabClick('latest')}
          >
            {TEXT.latestTab}
          </button>
          <button
            className={`spa-tab-btn ${activeTab === 'popular' ? 'active' : ''}`}
            onClick={() => handleTabClick('popular')}
          >
            {TEXT.popularTab}
          </button>
        </div>
      </header>

      <main className="spa-content">
        {loading && <p className="spa-message">{TEXT.loading}</p>}
        {error && <p className="spa-message error">{TEXT.error}</p>}
        {!loading && !error && posts.length === 0 && <p className="spa-message">{TEXT.noPosts}</p>}

        {!loading && !error && posts.length > 0 && (
          <div className="spa-grid">
            {posts.map(post => (
              <a href={`/news/${post.slug}`} key={post.slug} className="spa-card">
                <div className="spa-card-image">
                  <img src={post.featuredImageUrl} alt={post.title} />
                </div>
                <div className="spa-card-content">
                  <span className="spa-card-category">{post.category}</span>
                  <h3 className="spa-card-title">{post.title}</h3>
                  <div className="spa-card-meta">
                    <div className="spa-card-author" style={{ display: 'none' }}>
                      <img src={post.author.avatarUrl} alt={post.author.name} className="spa-card-author-avatar" />
                      <span>{post.author.name}</span>
                    </div>
                    <div className="spa-card-time">
                        <span>{TEXT.published} {post.publishedDate}</span>
                        <div className="reading-time">
                            <ClockIcon />
                            <span>{post.readingTime}</span>
                        </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {!loading && !error && pagination.pageCount > 1 && (
        <footer className="spa-pagination">
          {pagination.page > 1 && (
               <button className="spa-page-btn prev" onClick={() => handlePageChange(pagination.page - 1)}>
                 {TEXT.prevButton}
            </button>
          )}

          {pageItems.map((item, index) => 
            typeof item === 'number' ? (
              <button
                key={index}
                className={`spa-page-btn ${pagination.page === item ? 'active' : ''}`}
                onClick={() => handlePageChange(item)}
              >
                {item}
              </button>
            ) : (
              <span key={index} className="spa-page-ellipsis">
                {item}
              </span>
            )
          )}

          {pagination.page < pagination.pageCount && (
            <button
              className="spa-page-btn next"
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              {TEXT.nextButton}
            </button>
          )}
        </footer>
      )}
    </div>
  );
};

export default SmallPostArchive;