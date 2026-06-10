import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import './Chat.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isHtml?: boolean;
}

const initialMessages: Message[] = [];

const suggestions = [
  "What is a black hole?",
  "The James Webb Telescope",
  "Life on Europa?",
  "Expansion of the universe",
  "Voyager 1 location",
  "How are stars born?",
  "Could Mars support life?",
  "What is dark matter?",
  "The fate of our Sun",
];

interface ChatProps {
  user?: any;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(() => {
    const cached = sessionStorage.getItem('cosmiqai_chat_messages');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return initialMessages;
      }
    }
    return initialMessages;
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    const cached = sessionStorage.getItem('cosmiqai_chat_messages');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return false;
      } catch (e) {}
    }
    return true;
  });

  // Persist messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('cosmiqai_chat_messages', JSON.stringify(messages));
  }, [messages]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMobileQueries, setShowMobileQueries] = useState(false);

  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close mobile suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMobileQueries(false);
      }
    };

    if (showMobileQueries) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileQueries]);

  // Scroll to bottom helper of the chat container only
  const scrollToBottom = () => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    // Strip HTML tags for clean copy text
    const cleanText = text.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    
    if (!text.trim()) return;

    // Hide welcome screen
    setShowWelcome(false);

    // Add user message
    const userMsgId = `msg-user-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      isUser: true,
      text: text
    };
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);
    setShowMobileQueries(false);

    try {
      const response = await api.post('/chat', { message: text });
      
      const aiMsgId = `msg-ai-${Date.now()}`;
      const aiText = response.response || "No response received.";
      
      const aiMsg: Message = {
        id: aiMsgId,
        isUser: false,
        text: aiText,
        isHtml: true
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat API error:", error);
      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        isUser: false,
        text: `<p>Sorry, I encountered an error. Please try again or rephrase your cosmic query.</p>`,
        isHtml: true
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="chat-page">
      {/* Compact Page Hero */}
      <header className="page-hero chat-hero aurora-glow">
        <div className="page-hero-content">
          <h1 className="page-hero-title">Cosmiq Chat</h1>
          <p className="page-hero-subtitle">Ask anything about the universe.</p>
        </div>
      </header>

      {/* Main Container */}
      <main className="chat-main-container">
        {/* Left Sidebar */}
        <aside className="chat-sidebar">
          {/* Profile Card */}
          <div className="glass-panel sidebar-profile">
            <div className="avatar-wrapper">
              <div className="avatar-img-container">
                <img
                  className="avatar-img"
                  alt="CosmiqAI Avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCysNwlpaK7l9mCK6B_OMGzXPOyPk49sDigj2eF9dDugSFELsxooc2HQC-hjQs0_s51DdvPODKn0muoD9I6R2Ao3ivWXhViIOjKxJxJckmmyPQ0EEG90RZWW1Zm_JY9WYYLwr67fK2o85QW1Rbnx9MPy5b5AQJ2mI96pXR4Vd5Bi6L7L-8EdbxOMk2CvB1SMPYxQZXnIROlaPorfIF2tYbRleh7fMQEZSnQb2TJZZ7kiBWA8mXKO_WbrXaucPkJjyQsb3-1pZfsTQ"
                />
              </div>
              <div className="status-indicator pulse"></div>
            </div>
            <h3 className="font-orbitron profile-name">CosmiqAI-V4</h3>
            <p className="profile-status">Status: Online</p>
            <div className="divider"></div>
            <p className="profile-quote">"Ready to decode the cosmic mysteries."</p>
          </div>

          {/* Stellar Queries List */}
          <div className="glass-panel sidebar-queries">
            <p className="queries-title">Stellar Queries</p>
            <div className="queries-container-scrollable custom-scrollbar">
              <div className="queries-list">
                {suggestions.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(query)}
                    className="query-btn"
                  >
                    <span className="query-text">{query}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Chat Area */}
        <section className="glass-panel chat-main-area dot-grid">
          {/* Chat Top Bar */}
          <div className="chat-top-bar">
            <div className="chat-status-indicator">
              <span className="status-dot"></span>
              <span className="session-title">Session: Deep Space Exploration</span>
            </div>
            {/* Mobile query suggestion button */}
            <div className="mobile-suggest-container" ref={dropdownRef}>
              <button
                className="mobile-suggest-btn"
                onClick={() => setShowMobileQueries(!showMobileQueries)}
                title="Suggestions"
              >
                <span className="material-symbols-outlined">lightbulb</span>
              </button>
              {showMobileQueries && (
                <div className="mobile-queries-dropdown">
                  <p className="queries-title" style={{ padding: '0 4px', margin: '4px 0' }}>Stellar Queries</p>
                  {suggestions.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(query)}
                      className="query-btn"
                      style={{ padding: '8px' }}
                    >
                      <span className="query-text" style={{ fontSize: '13px' }}>{query}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message List */}
          <div ref={chatMessagesContainerRef} className="chat-messages-container custom-scrollbar">
            {/* Welcome State */}
            {showWelcome && (
              <div className="welcome-screen">
                <div className="welcome-logo-container">
                  <span className="material-symbols-outlined welcome-logo">satellite</span>
                </div>
                <h4 className="welcome-title font-orbitron">Hello, Space Explorer</h4>
                <p className="welcome-subtitle">
                  Initiating neural link with planetary databases. How can I assist your discovery today?
                </p>
                <div className="welcome-grid">
                  <div className="welcome-card" onClick={() => handleSendMessage("Explore Constellations")}>
                    <span className="welcome-card-emoji">🔭</span>
                    <p className="welcome-card-text">Explore Constellations</p>
                  </div>
                  <div className="welcome-card" onClick={() => handleSendMessage("Deep Sky Objects")}>
                    <span className="welcome-card-emoji">🌌</span>
                    <p className="welcome-card-text">Deep Sky Objects</p>
                  </div>
                  <div className="welcome-card" onClick={() => handleSendMessage("Planetary Data")}>
                    <span className="welcome-card-emoji">🪐</span>
                    <p className="welcome-card-text">Planetary Data</p>
                  </div>
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.isUser ? 'msg-wrapper-user message-in' : 'msg-wrapper-ai message-in'}
              >
                <div className={message.isUser ? 'msg-bubble-user' : 'msg-bubble-ai'}>
                  {!message.isUser && (
                    <div className="msg-ai-header">
                      <span className="msg-ai-title">CosmiqAI Intelligence</span>
                      <span className="msg-ai-dot"></span>
                    </div>
                  )}

                  <div className="msg-text">
                    {message.isHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: message.text }} />
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>

                  <div className="msg-actions">
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(message.id, message.text)}
                      title={copiedId === message.id ? "Copied!" : "Copy message"}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {copiedId === message.id ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="typing-container">
                <div className="typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span className="typing-text">Consulting the cosmos...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="chat-input-bar">
            <div className="input-wrapper">
              <input
                className="chat-input-field"
                type="text"
                placeholder="Message CosmiqAI... (e.g. 'How far is the Moon?')"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="chat-send-btn"
                onClick={() => {
                  handleSendMessage(inputValue);
                  setInputValue('');
                }}
                title="Send Message"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="disclaimer-text">
              Stellar data synchronized via NASA Open API. Information may vary by lightyears.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Chat;
