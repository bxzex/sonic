import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
