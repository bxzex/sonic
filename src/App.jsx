import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, Shield, Cpu, Share2, X, Instagram, Linkedin, Github, Globe, User, Download, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import Logo from './components/Logo';
import { useEngine } from './hooks/useEngine';
import './App.css';

const getInitialChats = () => {
  const saved = localStorage.getItem('sonic_chats');
  return saved ? JSON.parse(saved) : [{ id: '1', title: 'New Conversation', messages: [] }];
};

const getInitialUser = () => {
  const saved = localStorage.getItem('sonic_user');
  return saved ? JSON.parse(saved) : { name: 'Local User', avatar: null };
};

function App() {
  const [chats, setChats] = useState(getInitialChats);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [input, setInput] = useState('');
  const [core, setCore] = useState('Llama-3.2-3B-Instruct-q4f32_1-MLC');
  const SONIC_CORE = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
  const [showSettings, setShowSettings] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [userProfile, setUserProfile] = useState(getInitialUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [activeNodes, setActiveNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('sonic_active_nodes');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('sonic_active_nodes', JSON.stringify(activeNodes));
  }, [activeNodes]);

  useEffect(() => {
    const saved = localStorage.getItem('sonic_active_nodes');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[SONIC_CORE]) {
        setActiveNodes(parsed);
      }
    }
  }, []);

  const messagesEndRef = useRef(null);
  const { processQuery, loading, progress, loadCore } = useEngine();

  useEffect(() => {
    localStorage.setItem('sonic_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('sonic_user', JSON.stringify(userProfile));
  }, [userProfile]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChat.messages.length > 0) {
      scrollToBottom();
    }
  }, [activeChat.messages]);

  const handleAction = async (isSetup = false) => {
    if ((!input.trim() && !isSetup) || loading) return;

    if (isSetup) {
      if (loading || isInitializing) return;
      if (activeNodes[SONIC_CORE]) {
        alert('SONIC Intelligence is active and ready.');
        return;
      }

      setIsInitializing(true);
      try {
        await loadCore(SONIC_CORE);
        setActiveNodes(prev => {
          const newState = { ...prev, [SONIC_CORE]: true };
          localStorage.setItem('sonic_active_nodes', JSON.stringify(newState));
          return newState;
        });
        alert('SONIC Intelligence has been synced to your hardware.');
        return;
      } catch (e) {
        alert(e.message);
        return;
      } finally {
        setIsInitializing(false);
      }
    }

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...activeChat.messages, userMessage];

    setChats(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, messages: updatedMessages, title: input.slice(0, 30) + (input.length > 30 ? '...' : '') }
        : c
    ));
    setInput('');

    try {
      const aiPlaceholder = { role: 'assistant', content: '' };
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, messages: [...updatedMessages, aiPlaceholder] }
          : c
      ));

      await processQuery(updatedMessages, 'local', SONIC_CORE, (content) => {
        if (!activeNodes[SONIC_CORE]) {
          setActiveNodes(prev => {
            const newState = { ...prev, [SONIC_CORE]: true };
            localStorage.setItem('sonic_active_nodes', JSON.stringify(newState));
            return newState;
          });
        }
        setChats(prev => prev.map(c =>
          c.id === activeChatId
            ? {
              ...c,
              messages: [
                ...updatedMessages,
                { role: 'assistant', content }
              ]
            }
            : c
        ));
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: []
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = (id) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        return [{ id: Date.now().toString(), title: 'New Conversation', messages: [] }];
      }
      return filtered;
    });
    if (activeChatId === id) {
      setActiveChatId(chats[0].id);
    }
  };

  const handleExport = (id) => {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const content = chat.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}\n`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard.');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = () => {
    localStorage.setItem('sonic_user', JSON.stringify(userProfile));
    alert('Identity updated.');
    setShowSettings(false);
  };

  return (
    <div className="app-container">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={createNewChat}
        onSelectChat={setActiveChatId}
        onDeleteChat={handleDeleteChat}
        onDownloadChat={handleExport}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDocs={() => setShowDocs(true)}
        userProfile={userProfile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className={`chat-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="menu-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="header-brand-mobile">SONIC</div>
            <select
              className="model-selector desktop-only"
              value={core}
              onChange={(e) => setCore(e.target.value)}
            >
              <option value={SONIC_CORE}>SONIC Intelligence</option>
            </select>

            <div className="status-container">
              {!activeNodes[SONIC_CORE] || isInitializing ? (
                <button
                  className="share-btn"
                  onClick={() => handleAction(true)}
                  disabled={loading || isInitializing}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.8rem',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: isInitializing ? '140px' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <Download size={14} />
                  {isInitializing ? `${progress?.status || 'Active'}: ${progress?.percent || 0}%` : 'Initialize AI'}
                </button>
              ) : (
                <div className="ready-badge">
                  <Zap size={14} />
                  <span>Ready State</span>
                </div>
              )}

              <span className="desktop-only" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '140px', lineHeight: '1.2' }}>
                {isInitializing ? (
                  <strong>Syncing...</strong>
                ) : !activeNodes[SONIC_CORE] ? (
                  <><strong>Local Setup:</strong> One-time sync for private access.</>
                ) : (
                  <strong>Stored in local hardware.</strong>
                )}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="share-btn hide-mobile" onClick={handleLink}>
              <Share2 size={16} />
              Share
            </button>
          </div>
        </header>

        <div className="messages-container">
          {activeChat.messages.length === 0 ? (
            <div className="welcome-screen">
              <Logo size={100} />
              <div className="brand-logo brand-gradient" style={{ marginTop: '1rem' }}>SONIC</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <span className="badge">OPEN SOURCE</span>
                <span className="badge free">100% FREE</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Private, Offline Intelligence.
              </p>

              <div className="features-grid">
                <div className="feature-card glass-panel">
                  <Shield size={24} color="var(--accent-secondary)" />
                  <h3>100% Private</h3>
                  <p>Your data stays on your device. Local processing, zero cloud interaction.</p>
                </div>
                <div className="feature-card glass-panel">
                  <Cpu size={24} color="var(--accent-secondary)" />
                  <h3>Local Intelligence</h3>
                  <p>Runs directly on your computer. High-performance, zero latency processing.</p>
                </div>
                <div className="feature-card glass-panel">
                  <Zap size={24} color="var(--accent-secondary)" />
                  <h3>Extreme Speed</h3>
                  <p>State-of-the-art local architecture for high-performance, real-time AI responses.</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', marginTop: '1.5rem', fontStyle: 'italic' }}>
                Once synced, SONIC runs entirely from your local hardware.
              </p>

              <div style={{ marginTop: '2rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Initialize from the header to start chatting offline.
                </p>
              </div>
            </div>
          ) : (
            <div className="messages-stream">
              <AnimatePresence>
                {activeChat.messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessage message={m} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && !activeChat.messages[activeChat.messages.length - 1]?.content && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="shimmer-bg" style={{ height: '4px', width: '100px', margin: '0 auto', borderRadius: '100px' }}></div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="input-area">
          <div className="input-container glass-panel">
            <textarea
              placeholder="Enter prompt..."
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAction();
                }
              }}
            />

            <button
              className="send-btn"
              onClick={handleAction}
              disabled={loading || !input.trim()}
            >
              <Zap size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
            Private Local Engine v1.1.0
          </p>
        </footer>
      </main>

      {
        showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="brand-gradient" style={{ margin: 0 }}>Identity Settings</h2>
                <X size={20} className="action-icon" onClick={() => setShowSettings(false)} style={{ opacity: 1 }} />
              </div>

              <div className="setting-item">
                <label>Profile Name</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input"
                />
              </div>

              <div className="setting-item">
                <label>Avatar Preference</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={24} color="var(--text-muted)" />
                    )}
                  </div>
                  <label className="upload-btn">
                    <Download size={16} />
                    Upload Image
                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>

              <button className="new-chat-btn" style={{ width: '100%', marginTop: '2rem' }} onClick={handleUpdate}>Update Identity</button>
            </div>
          </div>
        )
      }

      {
        showDocs && (
          <div className="modal-overlay" onClick={() => setShowDocs(false)}>
            <div className="modal-content glass-panel docs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="brand-gradient" style={{ margin: 0 }}>Documentation</h2>
                <X size={20} className="action-icon" onClick={() => setShowDocs(false)} style={{ opacity: 1 }} />
              </div>

              <div className="docs-content" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
                <h3>By bxzex</h3>
                <p>
                  SONIC is a private intelligence layer built by <strong>bxzex</strong>. It runs entirely on your hardware—no cloud, no tracking, and 100% free.
                </p>

                <h4>The Essentials</h4>
                <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li><strong>Local Intelligence:</strong> High-performance, offline processing synced directly to your device.</li>
                  <li><strong>SONIC Core:</strong> State-of-the-art neural architecture optimized for private reasoning.</li>
                  <li><strong>Privacy Standard:</strong> Your chats and data never leave your hardware.</li>
                </ul>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Connect</h4>
                  <div className="social-links" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <a href="http://bxzex.com/" target="_blank" className="social-link"><Globe size={18} /> Website</a>
                    <a href="https://github.com/bxzex" target="_blank" className="social-link"><Github size={18} /> GitHub</a>
                    <a href="https://www.instagram.com/bxzex/" target="_blank" className="social-link"><Instagram size={18} /> Instagram</a>
                    <a href="https://www.linkedin.com/in/bxzex/" target="_blank" className="social-link"><Linkedin size={18} /> LinkedIn</a>
                  </div>
                </div>
              </div>

              <button className="new-chat-btn" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setShowDocs(false)}>Close</button>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;
