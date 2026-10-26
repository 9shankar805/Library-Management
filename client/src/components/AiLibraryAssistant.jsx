import React, { useState, useRef, useEffect } from "react";
import ShelfNavModal from "./ShelfNavModal";
import "../styles/AiLibraryAssistant.css";

export default function AiLibraryAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your **NIT Andhra AI Library Assistant**.\n\nYou can ask me to locate any textbook on the shelves, check library opening hours, explain loan policies, or find books by subject or topic!",
      matchedBooks: []
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeNavBook, setActiveNavBook] = useState(null);
  const [suggestions, setSuggestions] = useState([
    "Where is Clean Code located?",
    "Find books on algorithms",
    "What are the library timings?",
    "How many books can I borrow?"
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const queryText = (textToSend || inputVal).trim();
    if (!queryText || loading) return;

    const userMessage = { sender: "user", text: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setLoading(true);

    try {
      const res = await fetch("/api/discovery/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText })
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            matchedBooks: data.matchedBooks || []
          }
        ]);
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } else {
        throw new Error(data.message || "Failed to reach AI assistant.");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `⚠️ I encountered an error: ${err.message}. Please try again or ask another question.`,
          matchedBooks: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="ai-assistant-wrapper">
        {!isOpen && (
          <button
            type="button"
            className="ai-fab-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Library Assistant"
          >
            <span className="ai-sparkle-icon">✨</span>
            <span>AI Library Assistant</span>
          </button>
        )}

        {isOpen && (
          <div className="ai-drawer-card">
            {/* Header */}
            <div className="ai-drawer-header">
              <div className="ai-header-left">
                <div className="ai-avatar-circle">✨</div>
                <div className="ai-header-titles">
                  <h4>AI Library Assistant</h4>
                  <p className="ai-online-status">
                    <span className="ai-status-dot" /> Online · Catalog & Wayfinding
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ai-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="ai-chat-body">
              {messages.map((m, idx) => (
                <div key={idx} className={`ai-bubble ${m.sender}`}>
                  <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
                  {m.matchedBooks && m.matchedBooks.length > 0 && (
                    <div className="ai-matched-books">
                      {m.matchedBooks.map((b) => (
                        <div key={b.id} className="ai-book-chip">
                          <strong>{b.title}</strong>
                          <div className="ai-book-meta">
                            <span>By {b.author}</span>
                            <span>·</span>
                            <span>Floor {b.floor}, {b.section} (Rack {b.rackNumber})</span>
                            <span>·</span>
                            <span style={{ color: b.availableCopies > 0 ? "#15803d" : "#dc2626", fontWeight: 700 }}>
                              {b.availableCopies} available
                            </span>
                          </div>
                          <button
                            type="button"
                            className="ai-locate-btn"
                            onClick={() =>
                              setActiveNavBook({
                                title: b.title,
                                shelf: {
                                  floor: b.floor,
                                  section: b.section,
                                  rackNumber: b.rackNumber,
                                  shelfTier: b.shelfTier || "Tier 1"
                                }
                              })
                            }
                          >
                            📍 Show on Floor Blueprint Map &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="ai-bubble bot" style={{ fontStyle: "italic", color: "#64748b" }}>
                  ✨ Searching catalog & shelf coordinates...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips */}
            <div className="ai-suggestions-bar">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ai-suggestion-chip"
                  onClick={() => handleSendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              className="ai-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                placeholder="Ask about books, shelf locations, or library rules..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="ai-send-btn" disabled={loading || !inputVal.trim()}>
                ➤
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Blueprint Map Modal Triggered by AI */}
      <ShelfNavModal
        isOpen={Boolean(activeNavBook)}
        book={activeNavBook || {}}
        onClose={() => setActiveNavBook(null)}
      />
    </>
  );
}
