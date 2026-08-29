import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import ChatWindow from "../components/ChatWindow";

const SUGGESTED = [
  { icon: "🔍", text: "What is eczema?" },
  { icon: "💊", text: "What medications help acne?" },
  { icon: "☀️", text: "How to protect skin from sun?" },
  { icon: "🚨", text: "When should I see a dermatologist?" },
  { icon: "🧴", text: "Best skincare routine for oily skin?" },
  { icon: "🩹", text: "How to reduce skin inflammation?" },
];

const DISCLAIMER = "DermaAI provides educational information only. This is not a substitute for professional medical diagnosis or treatment.";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [latest, setLatest] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get("/chat/history").then(({ data }) => {
      if (data.messages.length) {
        setMessages(data.messages);
      } else {
        setMessages([greeting]);
      }
    }).catch(() => setMessages([greeting]));
    api.get("/predictions").then(({ data }) => setLatest(data.predictions?.[0])).catch(() => {});
    inputRef.current?.focus();
  }, []);

  const greeting = {
    role: "assistant",
    text: `Hello! I'm your DermaAI skin health assistant. 👋\n\nI can help you with:\n• Understanding skin conditions\n• Skincare routines & product advice\n• Medication information\n• Sun protection tips\n• When to see a dermatologist\n\nWhat would you like to know?`,
  };

  const send = async (text, context) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    try {
      const { data } = await api.post("/chat", { message: text, context });
      setMessages((m) => [...m, { role: "assistant", text: data.reply, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't process that right now. Please try again.", timestamp: new Date().toISOString() }]);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  };

  const clear = async () => {
    await api.delete("/chat/history");
    setMessages([greeting]);
  };

  const useLatestAnalysis = () => {
    if (!latest) return;
    send("Can you explain my latest analysis result?", { condition: latest.condition, severity: latest.severity, confidence: latest.confidence });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-avatar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1l2 5H7l2-5H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2V6a4 4 0 0 1 4-4z"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
                <circle cx="15" cy="9" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="chat-header-title">DermaAI Assistant</h3>
              <span className="chat-header-status">
                <span className="chat-status-dot" /> Online
              </span>
            </div>
          </div>
          <button className="chat-clear-btn" onClick={clear} title="Clear conversation">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages-area">
          <ChatWindow messages={messages} typing={typing} />

          {showSuggestions && !typing && (
            <div className="chat-suggestions">
              <p className="chat-suggestions-label">Suggested questions</p>
              <div className="chat-suggestions-grid">
                {latest && (
                  <button className="chat-suggestion-chip chat-suggestion-chip-accent" onClick={useLatestAnalysis}>
                    <span>📊</span> Explain my latest analysis
                  </button>
                )}
                {SUGGESTED.map((q) => (
                  <button key={q.text} className="chat-suggestion-chip" onClick={() => send(q.text)}>
                    <span>{q.icon}</span> {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, skincare, medications..."
              aria-label="Chat message"
              className="chat-input"
              disabled={typing}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || typing}
              title="Send message"
            >
              {typing ? (
                <div className="chat-send-spinner" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p className="chat-disclaimer-text">{DISCLAIMER}</p>
        </form>
      </div>
    </div>
  );
}
