import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Shield, Cpu, Share2, X, Upload, Instagram, Linkedin, Github, Globe, User, Download } from 'lucide-react';
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
  const [model, setModel] = useState('Llama-3.1-8B-Instruct-q4f32_1-MLC');
  const [showSettings, setShowSettings] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [userProfile, setUserProfile] = useState(getInitialUser);
  const [downloadedModels, setDownloadedModels] = useState({});
  const messagesEndRef = useRef(null);
  const { sendMessage, loading, progress, initWebLLM } = useEngine();

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

  const handleSend = async (isWarmup = false) => {
    if ((!input.trim() && !isWarmup) || loading) return;

    if (isWarmup) {
      // This is a warmup call
      try {
        await initWebLLM(model);
        setDownloadedModels(prev => ({ ...prev, [model]: true }));
        alert('Model downloaded and ready. You can now chat offline.');
        return;
      } catch (e) {
        alert(e.message);
        return;
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

      await sendMessage(updatedMessages, 'browser', model, (content) => {
        setDownloadedModels(prev => ({ ...prev, [model]: true }));
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

  const handleWarmup = async () => {
    if (loading) return;
    await handleSend(true);
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

  const handleDownloadChat = (id) => {
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

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Site link copied! Share the power of private AI.');
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

  const handleSaveSettings = () => {
    localStorage.setItem('sonic_user', JSON.stringify(userProfile));
    alert('Profile updated successfully.');
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
        onDownloadChat={handleDownloadChat}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDocs={() => setShowDocs(true)}
        userProfile={userProfile}
      />

      <main className="chat-main">
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <select
              className="model-selector"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="Llama-3.1-8B-Instruct-q4f32_1-MLC">SONIC 1 (Standard)</option>
              <option value="Qwen2-7B-Instruct-q4f32_1-MLC">SONIC 2 (Pro)</option>
              <option value="Mistral-7B-Instruct-v0.3-q4f32_1-MLC">SONIC 3 (Lite)</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="share-btn"
                onClick={() => handleSend(true)}
                disabled={loading}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  background: downloadedModels[model] ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                  border: 'none',
                  color: downloadedModels[model] ? '#020617' : 'white',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: loading ? '120px' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <Download size={14} />
                {loading ? `Initializing ${progress?.percent || 0}%` : downloadedModels[model] ? 'Downloaded' : 'Initialize AI'}
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '140px', lineHeight: '1.2' }}>
                {loading ? (
                  <strong>Status: {progress?.status || 'Active'}</strong>
                ) : downloadedModels[model] ? (
                  <strong>Ready for offline use.</strong>
                ) : (
                  <><strong>Offline Support:</strong> One-time setup saves models locally.</>
                )}
              </span>
            </div>
          </div>

          <button className="share-btn" onClick={handleShare}>
            <Share2 size={16} />
            Share SONIC
          </button>
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
                Private, In-Browser Processing. 100% Offline.
              </p>

              <div className="features-grid">
                <div className="feature-card glass-panel">
                  <Shield size={24} color="var(--accent-secondary)" />
                  <h3>Private AI</h3>
                  <p>Your data stays on your device. No trackers, no cloud, no compromise.</p>
                </div>
                <div className="feature-card glass-panel">
                  <Cpu size={24} color="var(--accent-secondary)" />
                  <h3>Local Processing</h3>
                  <p>Runs directly on your computer. High-performance, zero latency.</p>
                </div>
                <div className="feature-card glass-panel">
                  <Zap size={24} color="var(--accent-secondary)" />
                  <h3>Fast Response</h3>
                  <p>Experience the speed of local processing with zero network lag.</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', marginTop: '1.5rem', fontStyle: 'italic' }}>
                Once downloaded, SONIC will run 100% locally from your device storage.
              </p>

              <div style={{ marginTop: '2rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Select a model above and initialize to start chatting offline.
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeChat.messages.map((m, i) => (
                <ChatMessage key={i} message={m} />
              ))}
              {loading && !activeChat.messages[activeChat.messages.length - 1]?.content && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="shimmer-bg" style={{ height: '4px', width: '100px', margin: '0 auto', borderRadius: '100px' }}></div>
                </div>
              )}
            </>
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
                  handleSend();
                }
              }}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Zap size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
            Private Local Engine • v1.1.0
          </p>
        </footer>
      </main>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="brand-gradient" style={{ margin: 0 }}>User Settings</h2>
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
              <label>Profile Picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={24} color="var(--text-muted)" />
                  )}
                </div>
                <label className="upload-btn">
                  <Upload size={16} />
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            <button className="new-chat-btn" style={{ width: '100%', marginTop: '2rem' }} onClick={handleSaveSettings}>Update Identity</button>
          </div>
        </div>
      )}

      {showDocs && (
        <div className="modal-overlay" onClick={() => setShowDocs(false)}>
          <div className="modal-content glass-panel docs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="brand-gradient" style={{ margin: 0 }}>Documentation</h2>
              <X size={20} className="action-icon" onClick={() => setShowDocs(false)} style={{ opacity: 1 }} />
            </div>

            <div className="docs-content" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
              <h3>By bxzex</h3>
              <p>
                SONIC is a private AI layer built by <strong>bxzex</strong>. It runs entirely on your hardware—no cloud, no tracking, and 100% free.
              </p>

              <h4>The Essentials</h4>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <li><strong>Local Engine:</strong> Uses your device's GPU/CPU via WebGPU for fast, offline intelligence.</li>
                <li><strong>One-Time Setup:</strong> Models are saved to your browser storage once for permanent offline access.</li>
                <li><strong>Total Privacy:</strong> Your chats never leave your machine. Ever.</li>
              </ul>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Connect with bxzex</h4>
                <div className="social-links" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <a href="http://bxzex.com/" target="_blank" className="social-link"><Globe size={18} /> Website</a>
                  <a href="https://github.com/bxzex" target="_blank" className="social-link"><Github size={18} /> GitHub</a>
                  <a href="https://www.instagram.com/bxzex/" target="_blank" className="social-link"><Instagram size={18} /> Instagram</a>
                  <a href="https://www.linkedin.com/in/bxzex/" target="_blank" className="social-link"><Linkedin size={18} /> LinkedIn</a>
                </div>
              </div>
            </div>

            <button className="new-chat-btn" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setShowDocs(false)}>Close Docs</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
