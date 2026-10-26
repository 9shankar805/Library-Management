import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookCopy,
  Users,
  MapPinned,
  FileText,
  ScanBarcode,
  LayoutDashboard,
  ArrowRight,
  X
} from "lucide-react";
import "../styles/CommandPaletteModal.css";

const QUICK_ACTIONS = [
  { id: "dash", title: "Open Dashboard", icon: LayoutDashboard, path: "/librarian-dashboard", group: "Navigation" },
  { id: "issue", title: "Issue or Return a Book", icon: ScanBarcode, path: "/librarian/issue-book?tab=issue", group: "Circulation" },
  { id: "stock", title: "Manage Catalog & Physical Copies", icon: BookCopy, path: "/librarian/update-stock", group: "Inventory" },
  { id: "map", title: "Shelf & Rack Floor Navigator", icon: MapPinned, path: "/librarian/shelf-map", group: "Wayfinding" },
  { id: "rfid", title: "RFID Bulk Scanner Desk", icon: ScanBarcode, path: "/librarian/rfid-audit", group: "Circulation" },
  { id: "members", title: "Student & Member Directory", icon: Users, path: "/librarian/members", group: "Members" },
  { id: "fines", title: "Fines & Payments Ledger", icon: FileText, path: "/librarian/fines", group: "Financial" },
  { id: "analytics", title: "Circulation Analytics & Reports", icon: FileText, path: "/librarian/analytics", group: "Intelligence" }
];

const CommandPaletteModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(QUICK_ACTIONS);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [bookRes, studentRes] = await Promise.all([
          fetch(`/api/discovery/search?q=${encodeURIComponent(query.trim())}&limit=6`),
          fetch(`/api/students`)
        ]);

        const [bookData, studentData] = await Promise.all([
          bookRes.json(),
          studentRes.json()
        ]);

        const combined = [];

        // 1. Books
        if (bookData.success && bookData.books) {
          bookData.books.forEach((b) => {
            combined.push({
              id: `book-${b.id}`,
              title: b.title,
              sub: `By ${b.author} · ${b.locationSummary || "Central Stacks"}`,
              icon: BookCopy,
              path: `/librarian/update-stock?search=${encodeURIComponent(b.title)}`,
              group: "Books & Catalog"
            });
          });
        }

        // 2. Students / Members
        if (studentData.success && studentData.students) {
          const qLower = query.toLowerCase();
          const matchedStudents = studentData.students.filter(
            (s) =>
              s.rollNo.toLowerCase().includes(qLower) ||
              s.user?.username?.toLowerCase().includes(qLower) ||
              s.department?.toLowerCase().includes(qLower)
          ).slice(0, 4);

          matchedStudents.forEach((s) => {
            combined.push({
              id: `student-${s.rollNo}`,
              title: `${s.user?.username || "Student"} (${s.rollNo})`,
              sub: `${s.department} · Year ${s.yearOfStudy}`,
              icon: Users,
              path: `/librarian/members?search=${encodeURIComponent(s.rollNo)}`,
              group: "Members"
            });
          });
        }

        // 3. Quick actions matching query
        const matchedActions = QUICK_ACTIONS.filter((a) =>
          a.title.toLowerCase().includes(query.toLowerCase())
        );
        matchedActions.forEach((a) => combined.push(a));

        setResults(combined);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    if (item?.path) {
      navigate(item.path);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="cmd-search-bar">
          <Search className="cmd-search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search books, accession IDs, members, shelves, or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button type="button" className="cmd-clear-btn" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
          <span className="cmd-esc-badge">ESC</span>
        </div>

        {/* Results List */}
        <div className="cmd-results-list">
          {loading ? (
            <div className="cmd-loading">
              <div className="cmd-spinner" />
              <span>Searching across library records...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="cmd-empty">
              <Search size={28} className="cmd-empty-icon" />
              <p>No results found for "{query}"</p>
              <span>Try searching by book title, ISBN, author, roll number, or rack</span>
            </div>
          ) : (
            results.map((item, index) => {
              const IconComp = item.icon || BookCopy;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="cmd-item-icon-box">
                    <IconComp size={16} />
                  </div>
                  <div className="cmd-item-text">
                    <div className="cmd-item-title">{item.title}</div>
                    {item.sub && <div className="cmd-item-sub">{item.sub}</div>}
                  </div>
                  <span className="cmd-item-group">{item.group}</span>
                  {isSelected && <ArrowRight size={14} className="cmd-item-arrow" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="cmd-footer">
          <div className="cmd-shortcut-hint">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>ESC</kbd> to close</span>
          </div>
          <span className="cmd-footer-tag">Institutional Library Core</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
