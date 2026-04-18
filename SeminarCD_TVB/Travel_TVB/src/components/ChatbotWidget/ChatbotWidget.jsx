// src/components/ChatbotWidget/ChatbotWidget.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config/strapi';
import './ChatbotWidget.css';

// --- i18n display data ---
const displayData = {
  vi: {
    title: 'Trợ Lý Du Lịch',
    subtitle: 'Travel TVB',
    welcomeMessage: 'Xin chào! Tôi là trợ lý du lịch của Travel TVB. Tôi có thể giúp bạn tìm tour phù hợp. Hãy hỏi tôi bất cứ điều gì!',
    placeholder: 'Nhập tin nhắn...',
    sendBtn: 'Gửi',
    errorMessage: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
    rateLimitMessage: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút.',
    viewTour: 'Xem tour',
    typing: 'Đang suy nghĩ...',
  },
  en: {
    title: 'Travel Assistant',
    subtitle: 'Travel TVB',
    welcomeMessage: 'Hello! I\'m Travel TVB\'s tour assistant. I can help you find the perfect tour. Ask me anything!',
    placeholder: 'Type a message...',
    sendBtn: 'Send',
    errorMessage: 'Sorry, something went wrong. Please try again.',
    rateLimitMessage: 'You\'ve sent too many messages. Please wait a moment.',
    viewTour: 'View tour',
    typing: 'Thinking...',
  },
  zh: {
    title: '旅游助手',
    subtitle: 'Travel TVB',
    welcomeMessage: '您好！我是Travel TVB的旅游助手。我可以帮您找到合适的旅游线路。随时问我吧！',
    placeholder: '输入消息...',
    sendBtn: '发送',
    errorMessage: '抱歉，出现了错误。请重试。',
    rateLimitMessage: '您发送消息过于频繁，请稍候。',
    viewTour: '查看旅游',
    typing: '思考中...',
  },
};

// --- SVG Icons ---
const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotAvatarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="9" cy="16" r="1.5" fill="#007bff" />
    <circle cx="15" cy="16" r="1.5" fill="#007bff" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <circle cx="12" cy="2" r="1" fill="#007bff" />
  </svg>
);

/**
 * Typing indicator component — animated dots
 */
const TypingIndicator = ({ text }) => (
  <div className="chatbot-message bot">
    <div className="chatbot-bot-avatar">
      <BotAvatarIcon />
    </div>
    <div className="chatbot-bubble bot">
      <div className="chatbot-typing-indicator">
        <span className="chatbot-typing-dot" />
        <span className="chatbot-typing-dot" />
        <span className="chatbot-typing-dot" />
      </div>
      <span className="chatbot-typing-text">{text}</span>
    </div>
  </div>
);

/**
 * Parse bot reply to make [tour-slug] into clickable links
 */
function parseBotReply(text, sources, navigate, viewTourLabel) {
  if (!text) return null;

  // Replace [slug] patterns with clickable links
  const slugPattern = /\[([a-z0-9-]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = slugPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const slug = match[1];
    // Find if this slug is in sources
    const source = sources.find((s) => s.tourSlug === slug);

    if (source) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={`/tours/${slug}`}
          className="chatbot-tour-link"
          onClick={(e) => {
            e.preventDefault();
            navigate(`/tours/${slug}`);
          }}
        >
          {source.tourName || slug}
        </a>
      );
    } else {
      // Keep as text if not a known tour slug
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

// --- Main Component ---

const ChatbotWidget = () => {
  const { currentLanguage } = useLanguage();
  const TEXT = displayData[currentLanguage.code] || displayData.en;
  const navigate = useNavigate();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      setMessages([
        {
          role: 'bot',
          content: TEXT.welcomeMessage,
          sources: [],
        },
      ]);
    }
  }, [isOpen, TEXT.welcomeMessage]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Toggle chat panel
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Send message to chatbot API
  const sendMessage = useCallback(async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: trimmedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history (last 5 pairs = 10 messages)
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'bot')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${config.STRAPI_URL}${config.API_ENDPOINTS.CHATBOT_QUERY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedMessage,
            language: currentLanguage.code,
            history: history,
          }),
        }
      );

      if (response.status === 429) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', content: TEXT.rateLimitMessage, sources: [] },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      const botReply = json.data?.reply || TEXT.errorMessage;
      const sources = json.data?.sources || [];

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: botReply, sources: sources },
      ]);
    } catch (err) {
      console.error('[ChatbotWidget] Error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: TEXT.errorMessage, sources: [] },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, currentLanguage.code, TEXT]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'chatbot-toggle-open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        title={TEXT.title}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">
                <BotAvatarIcon />
              </div>
              <div>
                <h3 className="chatbot-header-title">{TEXT.title}</h3>
                <span className="chatbot-header-subtitle">{TEXT.subtitle}</span>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.role}`}
              >
                {msg.role === 'bot' && (
                  <div className="chatbot-bot-avatar">
                    <BotAvatarIcon />
                  </div>
                )}
                <div className={`chatbot-bubble ${msg.role}`}>
                  <div className="chatbot-bubble-text">
                    {msg.role === 'bot'
                      ? parseBotReply(msg.content, msg.sources || [], navigate, TEXT.viewTour)
                      : msg.content}
                  </div>
                  {/* Source tour links */}
                  {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                    <div className="chatbot-sources">
                      {msg.sources.map((source, i) => (
                        <a
                          key={i}
                          href={`/tours/${source.tourSlug}`}
                          className="chatbot-source-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/tours/${source.tourSlug}`);
                          }}
                        >
                          {source.tourName}
                          {source.price && ` - ${source.price}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator text={TEXT.typing} />}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="chatbot-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={TEXT.placeholder}
              disabled={isLoading}
              maxLength={500}
            />
            <button
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              aria-label={TEXT.sendBtn}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
