import React, { useState } from "react";
import {
  Sparkles,
  Send,
  MapPinned,
  BookOpen,
  HelpCircle,
  Compass,
  ArrowRight
} from "lucide-react";
import "../styles/LibrarianAiAssistantPage.css";

const LibrarianAiAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hello! I am your Smart Library AI Assistant. Ask me to find books across the 3 floors, check shelf locations (racks A1–G1), look up overdue rules, or recommend titles.",
      matchedBooks: [],
      suggestions: [
        "Where can I find Clean Code?",
        "What are the library operating hours?",
        "How are overdue fines calculated?",
        "Find machine learning textbooks on Floor 1"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { id: Date.now(), sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/discovery/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "ai",
            text: data.reply,
            matchedBooks: data.matchedBooks || [],
            suggestions: data.suggestions || []
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "ai",
            text: "Sorry, I encountered an issue processing your query. Please try again."
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Communication error with discovery engine. Please check backend health."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div>
          <span className="ai-kicker">NATURAL LANGUAGE WAYFINDING & FAQs</span>
          <h1>AI Library Assistant</h1>
          <p>Real-time conversational search, precise shelf coordinates, and automated circulation policy guidance.</p>
        </div>
      </div>

      {/* Main Chat Shell */}
      <div className="ai-chat-card">
        <div className="ai-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
              {msg.sender === "ai" && (
                <div className="ai-avatar-badge">
                  <Sparkles size={16} />
                </div>
              )}
              <div className="ai-bubble">
                <p className="ai-bubble-text">{msg.text}</p>

                {/* Matched Books Cards */}
                {msg.matchedBooks && msg.matchedBooks.length > 0 && (
                  <div className="ai-matched-books-grid">
                    {msg.matchedBooks.map((b) => (
                      <div key={b.id} className="ai-book-card">
                        <div className="ai-book-cover">
                          <BookOpen size={16} />
                        </div>
                        <div className="ai-book-meta">
                          <strong>{b.title}</strong>
                          <span>By {b.author}</span>
                          <div className="ai-shelf-tag">
                            <MapPinned size={12} />
                            Floor {b.floor} · {b.section} ({b.rackNumber})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="ai-suggestions-row">
                    <span>Suggested prompts:</span>
                    <div className="suggestions-list">
                      {msg.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="suggestion-chip"
                          onClick={() => handleSend(s)}
                        >
                          {s} <ArrowRight size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message-row ai">
              <div className="ai-avatar-badge">
                <Sparkles size={16} />
              </div>
              <div className="ai-bubble loading">
                <div className="ai-dot-pulse" />
                <span>Searching library catalog & shelf locations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="ai-input-bar"
        >
          <input
            type="text"
            placeholder="Ask about any book title, floor location, fine policy, or renewal rule..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading} className="ai-btn-send">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LibrarianAiAssistantPage;
