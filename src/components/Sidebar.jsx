import { PlusCircle, MessageSquare, Trash2, Download, Settings, BookOpen, LogOut, User, Instagram, Linkedin, Github, Globe } from 'lucide-react';
import Logo from './Logo';

const Sidebar = ({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, onDownloadChat, onOpenSettings, onOpenDocs, userProfile }) => {
    return (
        <aside className="sidebar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.5rem 0.5rem 1.5rem' }}>
                <Logo size={24} />
                <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px', color: 'var(--text-main)' }}>SONIC</span>
            </div>

            <button className="new-chat-btn" onClick={onNewChat} style={{ marginBottom: '1.5rem' }}>
                <PlusCircle size={20} />
                New Chat
            </button>

            <div className="chat-history">
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                    Conversations
                </div>
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`history-item ${chat.id === activeChatId ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1 }}>
                            <MessageSquare size={16} style={{ marginRight: '10px', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
                        </div>
                        <div className="item-actions" style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <Download
                                size={14}
                                className="action-icon"
                                onClick={(e) => { e.stopPropagation(); onDownloadChat(chat.id); }}
                            />
                            <Trash2
                                size={14}
                                className="action-icon"
                                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenDocs(); }}
                    className="history-item"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                    <BookOpen size={18} style={{ marginRight: '10px' }} />
                    Documentation
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenSettings(); }}
                    className="history-item"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem' }}
                >
                    <Settings size={18} style={{ marginRight: '10px' }} />
                    Settings
                </button>

                <div
                    className="user-profile"
                    onClick={onOpenSettings}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', marginBottom: '1rem' }}
                >
                    {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={18} color="white" />
                        </div>
                    )}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userProfile?.name || 'Local User'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Free Account</div>
                    </div>
                </div>

                <div className="sidebar-socials" style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem', opacity: 0.6 }}>
                    <a href="http://bxzex.com/" target="_blank" className="action-icon"><Globe size={16} /></a>
                    <a href="https://github.com/bxzex" target="_blank" className="action-icon"><Github size={16} /></a>
                    <a href="https://www.instagram.com/bxzex/" target="_blank" className="action-icon"><Instagram size={16} /></a>
                    <a href="https://www.linkedin.com/in/bxzex/" target="_blank" className="action-icon"><Linkedin size={16} /></a>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
