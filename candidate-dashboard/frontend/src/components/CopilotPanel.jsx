import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader, Sparkles } from 'lucide-react';

const getApiUrl = (path) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const base = isLocal ? '' : 'https://aura-hire.onrender.com';
  return `${base}${path}`;
};

export default function CopilotPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'copilot',
      content: 'Hello! I am your AI Recruiter Copilot. How can I help you analyze the candidate pool today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const suggestions = [
    'Show me FAISS candidates',
    'Short notice period profiles',
    'How are honeypots flagged?'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/copilot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'copilot', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'copilot', 
        content: 'Sorry, I encountered an error. Please ensure the backend server is running.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="panel fade-in" style={{ gap: '0.75rem' }}>
      <div className="panel-title">
        <Sparkles size={18} style={{ color: 'var(--accent-terracotta)' }} />
        <span>Recruiter Copilot</span>
      </div>

      <div className="copilot-container">
        <div className="chat-history">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble copilot" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader size={12} className="animate-spin" /> Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="suggestions-row">
          {suggestions.map((s, idx) => (
            <button 
              key={idx}
              className="suggestion-chip"
              onClick={() => handleSend(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask Copilot about candidates..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            type="button" 
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
