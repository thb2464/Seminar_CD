import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext'; // Assuming you have this context
import config from '../../config/strapi'; // Your Strapi config
import './CommunityPostArchive.css'; // Use the new CSS file
import FallBackImage from './PostBackUp.png'

// --- Helper Icon Components ---
const CommunityIcon = () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const PlayIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" />
    </svg>
);

const PauseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 5H10V19H6V5ZM14 5H18V19H14V5Z" />
    </svg>
);

// --- NEW: Search Icon ---
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);


// --- Static Display Data (for easy translation/updates) ---
const displayData = {
    vi: {
        title: 'Bài Viết Cộng Đồng',
        // --- MODIFICATION: Updated Tabs ---
        podcastTab: 'Podcast',
        analysisTab: 'Phân Tích - Bình Luận',
        qaTab: 'Hỏi & Đáp',
        searchPlaceholder: 'Tìm kiếm bài viết...',
        // --- END MODIFICATION ---
        prevButton: 'TRƯỚC',
        nextButton: 'TIẾP',
        loading: 'Đang tải bài viết...',
        error: 'Không thể tải bài viết.',
        noPosts: 'Không có bài viết nào.',
        publishedOn: 'Đăng ngày'
    },
    en: {
        title: 'Community Posts',
        // --- MODIFICATION: Updated Tabs ---
        podcastTab: 'Podcast',
        analysisTab: 'Analysis-Remark',
        qaTab: 'Q&A',
        searchPlaceholder: 'Search for posts...',
        // --- END MODIFICATION ---
        prevButton: 'PREV',
        nextButton: 'NEXT',
        loading: 'Loading posts...',
        error: 'Could not load posts.',
        noPosts: 'No posts found.',
        publishedOn: 'Published'
    },
    zh: {
        title: '社区帖子',
        // --- MODIFICATION: Updated Tabs ---
        podcastTab: '播客',
        analysisTab: '分析-评论',
        qaTab: '问与答',
        searchPlaceholder: '搜索帖子...',
        // --- END MODIFICATION ---
        prevButton: '上一页',
        nextButton: '下一页',
        loading: '正在加载...',
        error: '无法加载帖子。',
        noPosts: '未找到帖子。',
        publishedOn: '发布于'
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

const CommunityPostArchive = () => {
    const { currentLanguage } = useLanguage();
    const TEXT = displayData[currentLanguage.code] || displayData.vi;

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- MODIFICATION: Set 'podcast' as default tab ---
    const [activeTab, setActiveTab] = useState('podcast'); 
    const [pagination, setPagination] = useState({ page: 1, pageCount: 1 });

    // --- NEW: Search State ---
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [playingAudio, setPlayingAudio] = useState({ slug: null, isPlaying: false });
    const audioRef = useRef(null);

    const POSTS_PER_PAGE = 6;
    
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);


    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);

            if (audioRef.current) {
                audioRef.current.pause();
                setPlayingAudio({ slug: null, isPlaying: false });
            }

            const populateQuery = 'populate[Featured_Image]=true&populate[author][populate][AuthorAvatar]=true&populate[post_category]=true&populate[AudioFile]=true';
            const paginationQuery = `pagination[page]=${pagination.page}&pagination[pageSize]=${POSTS_PER_PAGE}`;
            const sortQuery = 'sort=publishedAt:desc';
            const localeQuery = `locale=${currentLanguage.code}`;
            
            // --- MODIFICATION: Reworked filter logic for new tabs and search ---
            let filterQuery = '';
            const filters = [];

            // 1. Tab Filter
            if (activeTab === 'podcast') {
                filters.push(`filters[PostType][$eq]=Podcast`);
            } else if (activeTab === 'analysis') {
                filters.push(`filters[PostType][$eq]=PhanTichBinhLuan`);
            } else if (activeTab === 'qa') {
                filters.push(`filters[PostType][$eq]=ChuyenMucHoiDap`);
            }

            // 2. Search Filter
            if (searchTerm) {
                filters.push(`filters[$or][0][PostTitle][$containsi]=${encodeURIComponent(searchTerm)}&filters[$or][1][post_category][Category_Name][$containsi]=${encodeURIComponent(searchTerm)}`);
            }

            // 3. Combine all filters
            if (filters.length > 0) {
                filterQuery = `&${filters.join('&')}`;
            }
            // --- END MODIFICATION ---

            const apiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.SINGLE_COMMUNITY_POST}?${populateQuery}&${paginationQuery}&${sortQuery}&${localeQuery}${filterQuery}`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`API error! Status: ${response.status}`);
                }
                const json = await response.json();
                
                // Assuming Strapi v5 structure (no .attributes wrapper) as per your code
                const transformedPosts = (json.data || []).map(post => ({
                    slug: post.slug,
                    title: post.PostTitle,
                    category: post.post_category?.Category_Name || 'Uncategorized',
                    author: {
                        name: post.author?.DisplayName || 'Unknown Author',
                        avatarUrl: post.author?.AuthorAvatar?.url
                            ? `${config.STRAPI_URL}${post.author.AuthorAvatar.url}`
                            : 'https://i.pravatar.cc/40',
                    },
                    publishedDate: new Date(post.publishedAt).toLocaleDateString(currentLanguage.code === 'vi' ? 'vi-VN' : currentLanguage.code === 'zh' ? 'zh-CN' : 'en-US'),
                    featuredImageUrl: post.Featured_Image?.url
                        ? `${config.STRAPI_URL}${post.Featured_Image.url}`
                        : FallBackImage,
                    audioUrl: post.AudioFile?.url 
                        ? `${config.STRAPI_URL}${post.AudioFile.url}` 
                        : null,
                }));

                setPosts(transformedPosts);
                if (json.meta && json.meta.pagination) {
                    setPagination(json.meta.pagination);
                }

            } catch (err) {
                console.error("Failed to fetch community posts:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    // --- MODIFICATION: Added searchTerm to dependency array ---
    }, [activeTab, pagination.page, currentLanguage, searchTerm]);

    const handlePlayPause = (slug, audioUrl) => {
        if (!audioUrl) return;

        if (playingAudio.slug !== slug) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(audioUrl);
            audioRef.current.play();
            setPlayingAudio({ slug, isPlaying: true });
            
            audioRef.current.onended = () => {
                setPlayingAudio({ slug: null, isPlaying: false });
            };
        } else { 
            if (playingAudio.isPlaying) {
                audioRef.current.pause();
                setPlayingAudio({ slug, isPlaying: false });
            } else {
                audioRef.current.play();
                setPlayingAudio({ slug, isPlaying: true });
            }
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 })); 
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.pageCount) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // --- NEW: Search Submit Handler ---
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchTerm(inputValue);
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    
    const pageItems = generatePaginationItems(pagination.page, pagination.pageCount);

    return (
    <div className = "cpa-wrapper">
        <div className="cpa-container">
            {/* --- MODIFICATION: Reworked header for Title, Tabs, and Search --- */}
            <header className="cpa-header">
                <div className="cpa-header-title">
                    <CommunityIcon />
                    <h2>{TEXT.title}</h2>
                </div>
                
                <div className="cpa-tabs">
                    <button className={`cpa-tab-btn ${activeTab === 'podcast' ? 'active' : ''}`} onClick={() => handleTabClick('podcast')}>
                        {TEXT.podcastTab}
                    </button>
                    <button className={`cpa-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => handleTabClick('analysis')}>
                        {TEXT.analysisTab}
                    </button>
                    <button className={`cpa-tab-btn ${activeTab === 'qa' ? 'active' : ''}`} onClick={() => handleTabClick('qa')}>
                        {TEXT.qaTab}
                    </button>
                </div>
                
                <form className="cpa-search-form" onSubmit={handleSearchSubmit}>
                    <input 
                        type="text" 
                        placeholder={TEXT.searchPlaceholder} 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        className="cpa-search-input" 
                    />
                    <button type="submit" className="cpa-search-btn"> 
                        <SearchIcon /> 
                    </button>
                </form>
            </header>
            {/* --- END MODIFICATION --- */}

            <main className="cpa-content">
                {loading && <p className="cpa-message">{TEXT.loading}</p>}
                {error && <p className="cpa-message error">{TEXT.error}</p>}
                {!loading && !error && posts.length === 0 && <p className="cpa-message">{TEXT.noPosts}</p>}

                {!loading && !error && posts.length > 0 && (
                    <div className="cpa-grid">
                        {posts.map(post => (
                            <a href={`/community/${post.slug}`} key={post.slug} className="cpa-card">
                                <div className="cpa-card-image">
                                    <img src={post.featuredImageUrl} alt={post.title} />
                                </div>
                                <div className="cpa-card-content">
                                    <span className="cpa-card-category">{post.category}</span>
                                    <h3 className="cpa-card-title">{post.title}</h3>
                                    <div className="cpa-card-meta">
                                        {/* --- Author block is hidden as per original code --- */}
                                        <div className="cpa-card-author" style={{ display: 'none' }}>
                                            <img src={post.author.avatarUrl} alt={post.author.name} className="cpa-card-author-avatar" />
                                            <span>{post.author.name}</span>
                                        </div>
                                        <div className="cpa-card-time">
                                            <span className="cpa-card-date">{TEXT.publishedOn} {post.publishedDate}</span>
                                            {post.audioUrl && (
                                                <button 
                                                    className="cpa-play-btn"
                                                    onClick={(e) => { 
                                                        e.preventDefault(); 
                                                        e.stopPropagation(); 
                                                        handlePlayPause(post.slug, post.audioUrl);
                                                    }}
                                                >
                                                    {playingAudio.slug === post.slug && playingAudio.isPlaying 
                                                        ? <PauseIcon /> 
                                                        : <PlayIcon />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </main>

            {/* --- Pagination (Unchanged) --- */}
            {!loading && !error && pagination.pageCount > 1 && (
                <footer className="cpa-pagination">
                    {pagination.page > 1 && (
                        <button className="cpa-page-btn prev" onClick={() => handlePageChange(pagination.page - 1)}>
                            {TEXT.prevButton}
                        </button>
                    )}

                    {pageItems.map((item, index) => 
                        typeof item === 'number' ? (
                        <button
                            key={index}
                            className={`cpa-page-btn ${pagination.page === item ? 'active' : ''}`}
                            onClick={() => handlePageChange(item)}
                        >
                            {item}
                        </button>
                        ) : (
                        <span key={index} className="cpa-page-ellipsis">
                            {item}
                        </span>
                        )
                    )}

                    {pagination.page < pagination.pageCount && (
                        <button
                        className="cpa-page-btn next"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        >
                        {TEXT.nextButton}
                        </button>
                    )}
                </footer>
            )}
        </div>
    </div>
    );
};

export default CommunityPostArchive;