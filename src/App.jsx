import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Shield, Cpu, Share2, X, Upload, Instagram, Linkedin, Github, Globe, User, Download, Mic, Image as ImageIcon, Camera } from 'lucide-react';
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
  const [model, setModel] = useState('auto');
  const TEXT_MODEL = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
  const VISION_MODEL = 'Phi-3.5-vision-instruct-q4f16_1-MLC';
  const [showSettings, setShowSettings] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [userProfile, setUserProfile] = useState(getInitialUser);
  const [voiceOutput, setVoiceOutput] = useState(() => {
    const saved = localStorage.getItem('sonic_voice_output');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sonic_voice_output', JSON.stringify(voiceOutput));
  }, [voiceOutput]);

  const [downloadedModels, setDownloadedModels] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
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
      try {
        const modelsToInit = model === 'auto' ? [TEXT_MODEL, VISION_MODEL] : [model];
        for (const m of modelsToInit) {
          await initWebLLM(m);
          setDownloadedModels(prev => ({ ...prev, [m]: true }));
        }
        alert('SONIC Intelligence is now downloaded and ready for offline use.');
        return;
      } catch (e) {
        alert(e.message);
        return;
      }
    }

    const userMessage = { role: 'user', content: input, images: pendingImages };
    const updatedMessages = [...activeChat.messages, userMessage];

    setChats(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, messages: updatedMessages, title: input.slice(0, 30) + (input.length > 30 ? '...' : '') }
        : c
    ));
    setInput('');
    setPendingImages([]);

    try {
      const aiPlaceholder = { role: 'assistant', content: '' };
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, messages: [...updatedMessages, aiPlaceholder] }
          : c
      ));

      let selectedModel = model;
      if (model === 'auto') {
        selectedModel = (pendingImages.length > 0 || updatedMessages.some(m => m.images?.length > 0)) ? VISION_MODEL : TEXT_MODEL;
      }

      const fullContent = await sendMessage(updatedMessages, 'browser', selectedModel, (content) => {
        setDownloadedModels(prev => ({ ...prev, [selectedModel]: true }));
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

      if (voiceOutput && fullContent) {
        const utterance = new SpeechSynthesisUtterance(fullContent);
        window.speechSynthesis.speak(utterance);
      }
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

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or not available.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    const tracks = stream?.getTracks();
    tracks?.forEach(track => track.stop());
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const photo = canvas.toDataURL('image/jpeg');
      setPendingImages(prev => [...prev, photo]);
      stopCamera();
    }
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
              <option value="auto">SONIC Intelligence (Multimodal)</option>
              <option value="Llama-3.2-3B-Instruct-q4f16_1-MLC">SONIC 2 (Fast Text)</option>
              <option value="Phi-3.5-vision-instruct-q4f16_1-MLC">SONIC 3 (Vision HD)</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="share-btn"
                onClick={() => handleSend(true)}
                disabled={loading}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  background: (model === 'auto' ? (downloadedModels[TEXT_MODEL] && downloadedModels[VISION_MODEL]) : downloadedModels[model]) ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                  border: 'none',
                  color: (model === 'auto' ? (downloadedModels[TEXT_MODEL] && downloadedModels[VISION_MODEL]) : downloadedModels[model]) ? '#020617' : 'white',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: loading ? '120px' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <Download size={14} />
                {loading ? `Initializing ${progress?.percent || 0}%` : (model === 'auto' ? (downloadedModels[TEXT_MODEL] && downloadedModels[VISION_MODEL]) : downloadedModels[model]) ? 'Downloaded' : 'Initialize AI'}
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '140px', lineHeight: '1.2' }}>
                {loading ? (
                  <strong>Status: {progress?.status || 'Active'}</strong>
                ) : (model === 'auto' ? (downloadedModels[TEXT_MODEL] && downloadedModels[VISION_MODEL]) : downloadedModels[model]) ? (
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
          {pendingImages.length > 0 && (
            <div className="image-previews">
              {pendingImages.map((img, i) => (
                <div key={i} className="preview-container">
                  <img src={img} alt="Preview" />
                  <button onClick={() => removeImage(i)} className="remove-img"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="input-container glass-panel">
            <button
              className="upload-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Images"
            >
              <ImageIcon size={20} />
            </button>
            <button
              className="upload-icon-btn"
              onClick={startCamera}
              title="Snap Photo"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />

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
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              title="Speech to Text"
            >
              <Mic size={20} />
            </button>

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={loading || (!input.trim() && pendingImages.length === 0)}
            >
              <Zap size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
            Private Local Engine • v1.1.0
          </p>
        </footer>
      </main>

      {
        showSettings && (
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

              <div className="setting-item">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={voiceOutput}
                    onChange={(e) => setVoiceOutput(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Voice Output (Text-to-Speech)
                </label>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Enable this to have SONIC read responses aloud.
                </p>
              </div>

              <button className="new-chat-btn" style={{ width: '100%', marginTop: '2rem' }} onClick={handleSaveSettings}>Update Identity</button>
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
        )
      }
      {
        showCamera && (
          <div className="modal-overlay" onClick={stopCamera}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="brand-gradient" style={{ margin: 0 }}>Snap a Photo</h3>
                <X size={20} className="action-icon" onClick={stopCamera} style={{ opacity: 1 }} />
              </div>
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '1.5rem' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="new-chat-btn" style={{ flex: 1 }} onClick={capturePhoto}>Capture</button>
                <button className="new-chat-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;
