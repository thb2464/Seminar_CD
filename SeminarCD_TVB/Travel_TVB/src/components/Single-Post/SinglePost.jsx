// src/components/SinglePost/SinglePost.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './SinglePost.css';
import FallbackImage from './PostBackUp.png';
import SuggestedTours from '../SuggestedTours/SuggestedTours';

// --- Helper Components & Functions (Unchanged) ---

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-clock"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const PlayIcon = () => <span>&#9654;</span>;
const PauseIcon = () => <span>&#9208;</span>;

// --- Citation Regex (Unchanged) ---
const CITATION_REGEX = /\[\^\s*(\d+)\s*\]/g;
const TARGET_REGEX = /^\s*\[\s*(\d+)\s*\^\]\s*/;

// --- TASK 2: Add displayData for translations ---
const displayData = {
  vi: { followText: 'Theo dõi chúng tôi trên:' },
  en: { followText: 'Follow us on:' },
  zh: { followText: '关注我们：' },
};

/**
 * --- Citation Link Renderer (Unchanged) ---
 */
const renderTextWithCitations = (text, keyPrefix) => {
  if (!text) return null;

  const allMatches = [...text.matchAll(CITATION_REGEX)];

  if (allMatches.length === 0) {
    return text;
  }

  const parts = [];
  let lastIndex = 0;

  allMatches.forEach((match) => {
    const id = match[1]; // The '1' in [^1]
    const plainText = text.substring(lastIndex, match.index);

    // 1. Add the text before the match
    if (plainText) {
      parts.push(plainText);
    }

    // 2. Add the citation link
    parts.push(
      <a
        href={`#citation-${id}`}
        key={`${keyPrefix}-link-${id}-${match.index}`}
        className="citation-link"
      >
        <sup>{id}</sup>
      </a>
    );

    lastIndex = match.index + match[0].length;
  });

  // 3. Add any remaining text after the last match
  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    parts.push(remainingText);
  }

  return parts.map((part, i) => (
    <React.Fragment key={`${keyPrefix}-part-${i}`}>{part}</React.Fragment>
  ));
};

const handleImageError = (e) => {
  console.error(`Failed to load image. Attempted URL: ${e.currentTarget.src}`);
  if (e.currentTarget.src !== FallbackImage) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FallbackImage;
  }
};

/**
 * --- Content Renderer (Unchanged) ---
 */
const renderContent = (blocks) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block, index) => {
    switch (block.type) {
      case 'paragraph': {
        const firstChild = block.children[0];
        const firstChildText = firstChild?.text || '';

        const match = firstChildText.match(TARGET_REGEX);

        if (match) {
          const id = match[1];
          const cleanedText =
            `[${id}] ` + firstChildText.substring(match[0].length);

          const newChildren = [
            { ...firstChild, text: cleanedText },
            ...block.children.slice(1),
          ];

          return (
            <p
              key={index}
              id={`citation-${id}`}
              className="citation-target"
            >
              {newChildren.map((child, childIndex) => (
                <span key={childIndex}>
                  {renderTextWithCitations(
                    child.text,
                    `p-${index}-child-${childIndex}`
                  )}
                </span>
              ))}
            </p>
          );
        } else {
          return (
            <p key={index}>
              {block.children.map((child, childIndex) => (
                <span key={childIndex}>
                  {renderTextWithCitations(
                    child.text,
                    `p-${index}-child-${childIndex}`
                  )}
                </span>
              ))}
            </p>
          );
        }
      }
      case 'image':
        return (
          <img
            key={index}
            src={block.image.url}
            alt={block.image.alternativeText || 'Content image'}
            className="content-image"
            onError={handleImageError}
          />
        );
      default:
        return null;
    }
  });
};

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
};

// --- Main Component ---

const SinglePost = ({ slug }) => {
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;
  const navigate = useNavigate();
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('No slug provided for the post.');
      return;
    }

    const fetchPostAndRelatedData = async () => {
      setLoading(true);
      setError(null);
      setPostData(null);

      try {
        const populateMainPostQuery = [
          'populate[Featured_Image]=true',
          'populate[author][populate][AuthorAvatar]=true',
          'populate[Social_Link][populate]=Social_Logo',
          'populate[AudioFile]=true',
          'populate[post_category]=true',
        ].join('&');

        const filterQuery = `filters[slug][$eq]=${slug}`;
        const localeQuery = `locale=${currentLanguage.code}`;
        const mainApiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.SINGLE_POST}?${filterQuery}&${populateMainPostQuery}&${localeQuery}`;

        const mainResponse = await fetch(mainApiUrl);
        if (!mainResponse.ok) {
          throw new Error(`API error! Status: ${mainResponse.status}`);
        }

        const mainJson = await mainResponse.json();

        if (!mainJson.data || mainJson.data.length === 0) {
          console.warn(
            `Post with slug '${slug}' not found for locale '${currentLanguage.code}'. Redirecting to /news.`
          );
          navigate('/news');
          return;
        }

        const mainStrapiData = mainJson.data[0];

        const currentCategorySlug =
          mainStrapiData.post_category?.Category_Slug;
        const currentPostSlug = mainStrapiData.slug;

        let relatedPosts = [];
        if (currentCategorySlug) {
          const populateRelatedQuery = [
            'populate[Featured_Image]=true',
            'populate[author][populate][AuthorAvatar]=true',
            'populate[post_category]=true',
          ].join('&');

          const relatedFilterQuery = `filters[post_category][Category_Slug][$eq]=${currentCategorySlug}&filters[slug][$ne]=${currentPostSlug}`;
          const paginationQuery = 'pagination[limit]=5';
          
          // --- UPDATED: Sort by createdAt ---
          const sortQuery = 'sort=createdAt:desc';
          const relatedApiUrl = `${config.STRAPI_URL}${config.API_ENDPOINTS.SINGLE_POST}?${relatedFilterQuery}&${populateRelatedQuery}&${paginationQuery}&${sortQuery}&${localeQuery}`;

          const relatedResponse = await fetch(relatedApiUrl);
          if (relatedResponse.ok) {
            const relatedJson = await relatedResponse.json();
            relatedPosts = (relatedJson.data || []).map((post) => ({
              slug: post.slug,
              title: post.PostTitle,
              category: {
                name: post.post_category?.Category_Name || 'Uncategorized',
              },
              author: {
                name: post.author?.DisplayName || 'Unknown',
                avatarUrl: post.author?.AuthorAvatar?.url
                  ? `${config.STRAPI_URL}${post.author.AuthorAvatar.url}`
                  : 'https://i.pravatar.cc/40',
              },
              // --- UPDATED: Use createdAt ---
              publishedDate: new Date(post.createdAt).toLocaleDateString(
                currentLanguage.code === 'vi' ? 'vi-VN' : 'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              ),
              featuredImageUrl: post.Featured_Image?.url
                ? `${config.STRAPI_URL}${post.Featured_Image.url}`
                : FallbackImage,
              readingTime:
                post.Time_To_Read ||
                (currentLanguage.code === 'vi' ? '5 phút đọc' : '5 min read'),
            }));
          } else {
            console.warn('Could not fetch related posts.');
          }
        }

        const processedContent = (mainStrapiData.Content || []).map(
          (block) => {
            if (block.type === 'image' && block.image?.url) {
              const imageUrl = block.image.url;
              if (
                imageUrl.startsWith('http://') ||
                imageUrl.startsWith('https://')
              ) {
                return { ...block, image: { ...block.image, url: imageUrl } };
              }
              const relativePath = imageUrl.startsWith('/')
                ? imageUrl
                : `/uploads/${imageUrl}`;
              return {
                ...block,
                image: {
                  ...block.image,
                  url: `${config.STRAPI_URL}${relativePath}`,
                },
              };
            }
            return block;
          }
        );

        const transformedData = {
          slug: mainStrapiData.slug,
          category: {
            name:
              mainStrapiData.post_category?.Category_Name || 'Uncategorized',
            slug: mainStrapiData.post_category?.Category_Slug,
          },
          title: mainStrapiData.PostTitle,
          author: {
            name: mainStrapiData.author?.DisplayName || 'Unknown Author',
            avatarUrl: mainStrapiData.author?.AuthorAvatar?.url
              ? `${config.STRAPI_URL}${mainStrapiData.author.AuthorAvatar.url}`
              : 'https://i.pravatar.cc/40',
          },
          // --- UPDATED: Use createdAt ---
          publishedDate: new Date(mainStrapiData.createdAt).toLocaleDateString(
            currentLanguage.code === 'vi' ? 'vi-VN' : 'en-US',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          ),
          featuredImageUrl: mainStrapiData.Featured_Image?.url
            ? `${config.STRAPI_URL}${mainStrapiData.Featured_Image.url}`
            : FallbackImage,
          socialLinks: (mainStrapiData.Social_Link || []).map((link) => ({
            name: link.Social_Link_Name,
            url: link.Url,
            iconUrl: link.Social_Logo?.url
              ? `${config.STRAPI_URL}${link.Social_Logo.url}`
              : '',
          })),
          audio: {
            src: mainStrapiData.AudioFile?.url
              ? `${config.STRAPI_URL}${mainStrapiData.AudioFile.url}`
              : null,
            playText: mainStrapiData.Audio_Button_Text || 'Listen',
            pauseText: mainStrapiData.Audio_Pause_Text || 'Pause',
          },
          content: processedContent,
          relatedPostsTitle:
            mainStrapiData.Related_Post_Highlight || 'Related Posts',
          relatedPosts: relatedPosts,
        };

        setPostData(transformedData);
      } catch (err) {
        console.error('Failed to fetch post data from Strapi:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndRelatedData();
  }, [slug, currentLanguage, navigate]);

  // --- Audio Player Logic (Unchanged) ---

  const togglePlayPause = () => {
    if (!audioRef.current || !postData.audio.src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // --- Render Logic (Unchanged) ---

  if (loading) {
    return (
      <div className="single-post-container">
        <h2>Loading Post...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="single-post-container">
        <h2>Error Loading Post</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="single-post-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="single-post-container">
      <audio
        ref={audioRef}
        src={postData.audio.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnd}
        style={{ display: 'none' }}
      />

      <div className="header-wrapper">
        <header className="post-header">
          <div className="header-left">
            <img
              src={postData.featuredImageUrl}
              alt={postData.title}
              className="featured-image"
            />
            <div className="social-follow">
              {/* --- TASK 2: Use translated text --- */}
              <span>{TEXT.followText}</span>
              <div className="social-icons">
                {postData.socialLinks.map((link, index) => (
                  <a href={link.url} key={link.name || index} title={link.name}>
                    {link.iconUrl ? (
                      <img
                        src={link.iconUrl}
                        alt={`${link.name} icon`}
                        style={{ width: '20px', height: '20px' }}
                      />
                    ) : link.name ? (
                      link.name.substring(0, 2)
                    ) : (
                      ''
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="header-right">
            <span className="post-category">{postData.category.name}</span>
            <h1 className="post-title">{postData.title}</h1>
            <div className="author-info">
              {/* --- TASK 1: Hide author avatar --- */}
              <img
                src={postData.author.avatarUrl}
                alt={postData.author.name}
                className="author-avatar"
                style={{ display: 'none' }}
              />
              <div className="author-details">
                {/* --- TASK 1: Hide author name --- */}
                <span className="author-name" style={{ display: 'none' }}>
                  {postData.author.name}
                </span>
                <span className="publish-date">{postData.publishedDate}</span>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="post-body">
        <div className="content-columns">
          <div className="content-left">
            {postData.audio.src && (
              <div className="audio-player">
                <button onClick={togglePlayPause} className="play-pause-btn">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  <span>
                    {isPlaying
                      ? postData.audio.pauseText
                      : postData.audio.playText}
                  </span>
                </button>
                <div className="audio-progress">
                  <span>{formatTime(currentTime)}</span>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-filled"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            <h2 className="post-title-content">{postData.title}</h2>
            <div className="rich-text-content">
              {renderContent(postData.content)}
            </div>
          </div>

          {/* --- TASK 3: Make sidebar sticky --- */}
          <aside
            className="content-right"
            style={{ position: 'sticky', top: '20px', alignSelf: 'flex-start' }}
          >
            <h3 className="related-posts-title">
              {postData.relatedPostsTitle}
            </h3>
            <div className="related-posts-list">
              {postData.relatedPosts.map((relatedPost) => (
                <a
                  href={`/news/${relatedPost.slug}`}
                  key={relatedPost.slug}
                  className="related-post-card"
                >
                  <div className="related-post-info">
                    <span className="related-post-category">
                      {relatedPost.category.name}
                    </span>
                    <h4 className="related-post-title-text">
                      {relatedPost.title}
                    </h4>
                    <div className="related-post-reading-time">
                      <ClockIcon />
                      <span>{relatedPost.readingTime}</span>
                    </div>
                    {/* --- TASK 1: Hide related post author --- */}
                    <div
                      className="related-post-author-meta"
                      style={{ display: 'none' }}
                    >
                      <img
                        src={relatedPost.author.avatarUrl}
                        alt={relatedPost.author.name}
                        className="related-post-author-avatar"
                      />
                      <span>{relatedPost.author.name}</span>
                    </div>
                    <span className="related-post-published-date">
                      {relatedPost.publishedDate}
                    </span>
                  </div>
                  <div
                    className="related-post-image-background"
                    style={{
                      backgroundImage: `url(${relatedPost.featuredImageUrl})`,
                    }}
                  ></div>
                </a>
              ))}
            </div>
          </aside>
        </div>

        {/* Suggested Tours - REQ-BLOG-05 */}
        <SuggestedTours />
      </main>
    </div>
  );
};

export default SinglePost;