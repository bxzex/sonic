import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`message-wrapper ${isUser ? 'user-message' : 'ai-message'}`}>
            <div className={`avatar ${isUser ? 'user' : 'ai'}`}>
                {isUser ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-content">
                {!message.content && !isUser ? (
                    <div className="shimmer-bg" style={{ height: '1.2em', width: '60%', borderRadius: '4px' }}></div>
                ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
