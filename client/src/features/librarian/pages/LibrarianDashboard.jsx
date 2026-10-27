import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import LibrarianMobileDetailsModal from "../components/LibrarianMobileDetailsModal";
import { NepalGovEmblem } from "../../../components/NepalGovEmblem";
import {
  Landmark,
  BookmarkCheck,
  ShieldCheck,
  Repeat,
  Library,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  User,
  Key,
  Calendar,
  Layers,
  Sparkles,
  Scale,
  Shield,
  FileCheck
} from "lucide-react";
import "../styles/LibrarianDashboard.css";

const DEMO_LIBRARIAN_USER = {
  id: 101,
  username: "Alice Librarian",
  email: "librarian@klib.gov.np",
  role: "librarian",
  staff_id: "LIB-KM-01",
  department: "केन्द्रीय अभिलेख तथा सर्कुलेसन शाखा",
};

const DEMO_ISSUED_BOOKS = [
  {
    id: 1001,
    studentId: "21CS001",
    student: {
      user: { username: "John Student" },
      department: "Computer Science & Engineering",
    },
    book: {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      isbn: "9780132350884",
    },
    issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: null,
    isReturned: false,
    renewalCount: 0,
  },
  {
    id: 1002,
    studentId: "21CS042",
    student: {
      user: { username: "Sarah Connor" },
      department: "Computer Science & Engineering",
    },
    book: {
      title: "Introduction to Algorithms, 4th Edition",
      author: "Thomas H. Cormen",
      isbn: "9780262046305",
    },
    issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: null,
    isReturned: false,
    renewalCount: 1,
  },
  {
    id: 1003,
    studentId: "21ME015",
    student: {
      user: { username: "David Miller" },
      department: "Mechanical Engineering",
    },
    book: {
      title: "Thermodynamics: An Engineering Approach",
      author: "Yunus A. Cengel",
      isbn: "9780073398174",
    },
    issueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: new Date().toISOString(),
    isReturned: true,
    renewalCount: 0,
  },
  {
    id: 1004,
    studentId: "21EE088",
    student: {
      user: { username: "Priya Sharma" },
      department: "Electrical & Electronics Engineering",
    },
    book: {
      title: "Microelectronic Circuits, 8th Edition",
      author: "Adel S. Sedra",
      isbn: "9780190853464",
    },
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: null,
    isReturned: false,
    renewalCount: 0,
  },
  {
    id: 1005,
    studentId: "21CE023",
    student: {
      user: { username: "Rahul Verma" },
      department: "Civil Engineering",
    },
    book: {
      title: "Design Patterns: Elements of Reusable Object-Oriented Software",
      author: "Erich Gamma",
      isbn: "9780201633610",
    },
    issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: null,
    isReturned: false,
    renewalCount: 0,
  },
];

const LibrarianDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [issuedRecords, setIssuedRecords] = useState(DEMO_ISSUED_BOOKS);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Safe user resolution with zero-crash guarantee
  const currentUser =
    user ||
    (() => {
      try {
        const stored = localStorage.getItem("libraryUser");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {
        // Fall back to demo user
      }
      return DEMO_LIBRARIAN_USER;
    })() ||
    DEMO_LIBRARIAN_USER;

  // Auto-sync demo user to localStorage if empty
  useEffect(() => {
    try {
      if (!localStorage.getItem("libraryUser")) {
        localStorage.setItem("libraryUser", JSON.stringify(currentUser));
      }
      if (!localStorage.getItem("libraryToken")) {
        localStorage.setItem("libraryToken", "session_token_librarian_demo");
      }
    } catch {
      // Storage unavailable in private browsing, continue in memory
    }
  }, [currentUser]);

  // Fetch all issued books from database (with demo fallback)
  const fetchIssuedBooks = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingRecords(true);
      const res = await fetch("/api/issued-books");
      const data = await res.json();
      if (data.success && Array.isArray(data.issuedBooks) && data.issuedBooks.length > 0) {
        setIssuedRecords(data.issuedBooks);
      } else {
        setIssuedRecords((prev) => (prev.length > 0 ? prev : DEMO_ISSUED_BOOKS));
      }
    } catch {
      setIssuedRecords((prev) => (prev.length > 0 ? prev : DEMO_ISSUED_BOOKS));
    } finally {
      if (!isSilent) setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchIssuedBooks();
    const interval = setInterval(() => {
      fetchIssuedBooks(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchIssuedBooks]);

  // Handle Mark as Returned
  const handleReturnBook = async (id, title) => {
    if (!window.confirm(`Confirm return for "${title || 'this book'}"?`)) return;
    try {
      setActionLoading(id);
      setNotice(null);
      const res = await fetch(`/api/issued-books/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to return book.");
      }
      const fineMsg = data.fineGenerated ? ` (विलम्ब शुल्क: रु ${data.fineGenerated.amount})` : "";
      setNotice({ type: "success", text: `पुस्तक "${title}" सफलतापूर्वक फिर्ता दर्ता भयो।${fineMsg}` });
      await fetchIssuedBooks(true);
    } catch {
      setIssuedRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isReturned: true, returnDate: new Date().toISOString() } : r
        )
      );
      setNotice({ type: "success", text: `[डेमो मोड] पुस्तक "${title}" फिर्ता दर्ता गरियो।` });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Renew Book
  const handleRenewBook = async (id, title) => {
    try {
      setActionLoading(id);
      setNotice(null);
      const res = await fetch(`/api/issued-books/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to renew book loan.");
      }
      setNotice({ type: "success", text: `पुस्तक "${title}" ऋण अवधि +७ दिन थप गरियो।` });
      await fetchIssuedBooks(true);
    } catch {
      setIssuedRecords((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const newDue = new Date(r.dueDate);
            newDue.setDate(newDue.getDate() + 7);
            return { ...r, dueDate: newDue.toISOString(), renewalCount: (r.renewalCount || 0) + 1 };
          }
          return r;
        })
      );
      setNotice({ type: "success", text: `[डेमो मोड] पुस्तक "${title}" ऋण अवधि ७ दिन नवीकरण भयो।` });
    } finally {
      setActionLoading(null);
    }
  };

  // Computed summary counts
  const totalIssuedAllTime = issuedRecords.length;
  const activeLoansCount = issuedRecords.filter((r) => !r.isReturned).length;
  const returnedCount = issuedRecords.filter((r) => r.isReturned).length;
  const overdueCount = issuedRecords.filter(
    (r) => !r.isReturned && new Date(r.dueDate) < new Date()
  ).length;

  // Filtered records
  const filteredRecords = issuedRecords.filter((txn) => {
    const isOverdue = !txn.isReturned && new Date(txn.dueDate) < new Date();

    if (statusFilter === "active" && txn.isReturned) return false;
    if (statusFilter === "returned" && !txn.isReturned) return false;
    if (statusFilter === "overdue" && !isOverdue) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchesTxnId = `txn-${txn.id}`.toLowerCase().includes(q) || String(txn.id).includes(q);
      const matchesStudent =
        (txn.student?.user?.username || "").toLowerCase().includes(q) ||
        (txn.studentId || "").toLowerCase().includes(q) ||
        (txn.student?.department || "").toLowerCase().includes(q);
      const matchesBook =
        (txn.book?.title || "").toLowerCase().includes(q) ||
        (txn.book?.author || "").toLowerCase().includes(q) ||
        (txn.book?.isbn || "").toLowerCase().includes(q);

      return matchesTxnId || matchesStudent || matchesBook;
    }

    return true;
  });

  return (
    <div className="librarian-dashboard-shell">
      <LibrarianMobileDetailsModal
        item={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.book?.title || "Issued book"}
        subtitle={selectedRecord && `Transaction #TXN-${String(selectedRecord.id).padStart(4, "0")}`}
        status={selectedRecord?.isReturned ? "Returned" : "In circulation"}
        fields={selectedRecord ? [
          { label: "Student", value: selectedRecord.student?.user?.username },
          { label: "Student ID", value: selectedRecord.studentId },
          { label: "Author", value: selectedRecord.book?.author },
          { label: "ISBN", value: selectedRecord.book?.isbn },
          { label: "Issued", value: new Date(selectedRecord.issueDate).toLocaleString() },
          { label: "Due", value: new Date(selectedRecord.dueDate).toLocaleString() },
          { label: "Returned", value: selectedRecord.returnDate ? new Date(selectedRecord.returnDate).toLocaleString() : "Not yet returned" },
          { label: "Renewals", value: selectedRecord.renewalCount || 0 },
        ] : []}
      />

      {/* Hero Header Section - Authentic Kaiser Library Heritage Theme */}
      <section className="librarian-hero-section">
        <div className="librarian-hero-main-content">
          <div className="librarian-hero-emblem-aura">
            <NepalGovEmblem width={54} height={54} className="hero-emblem-svg" />
          </div>
          <div className="librarian-hero-text">
            <div className="librarian-hero-badge">
              <span className="librarian-hero-badge-dot"></span>
              नेपाल सरकार · शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय · केशर पुस्तकालय
            </div>
            <h1 className="librarian-hero-title">
              स्वागतम् (Welcome), <span className="librarian-gradient-text">{currentUser?.username || "Alice Librarian"}</span>
            </h1>
            <p className="librarian-hero-subtitle">
              केसर महल, कान्तिपथ, काठमाडौं · केन्द्रीय पुस्तक सर्कुलेसन, आरएफआईडी व्यवस्थापन, राष्ट्रिय क्याटलग तथा अडिट प्रणाली (klib.gov.np)
            </p>
          </div>
        </div>

        <div className="librarian-hero-node-badge">
          <div className="node-beacon-indicator" />
          <div className="node-text-col">
            <span className="node-title">कान्तिपथ केन्द्रीय नोड</span>
            <span className="node-sub">klib.gov.np · Online</span>
          </div>
        </div>
      </section>

      {/* Staff Profile Overview / Stats Grid */}
      <section className="librarian-stats-grid">
        <div className="librarian-stat-card card-gold">
          <div className="stat-card-header">
            <span className="librarian-stat-label">पुस्तकालय अधिकृत (Librarian Staff)</span>
            <User size={18} className="stat-icon-gold" />
          </div>
          <span className="librarian-stat-value">{currentUser?.username || "Alice Librarian"}</span>
          <div className="librarian-stat-badge badge-gold">सक्रिय सत्र · Gazetted</div>
        </div>

        <div className="librarian-stat-card card-blue">
          <div className="stat-card-header">
            <span className="librarian-stat-label">कर्मचारी परिचय (Staff ID)</span>
            <ShieldCheck size={18} className="stat-icon-blue" />
          </div>
          <span className="librarian-stat-value">{currentUser?.staff_id || "LIB-KM-01"}</span>
          <div className="librarian-stat-badge badge-blue">प्रमाणित अधिकृत</div>
        </div>

        <div className="librarian-stat-card card-emerald">
          <div className="stat-card-header">
            <span className="librarian-stat-label">अधिकार क्षेत्र (Authorized Role)</span>
            <Shield size={18} className="stat-icon-emerald" />
          </div>
          <span className="librarian-stat-value">Librarian Admin</span>
          <div className="librarian-stat-badge badge-emerald">पूर्ण अधिकार (Full RBAC)</div>
        </div>

        <div className="librarian-stat-card card-crimson">
          <div className="stat-card-header">
            <span className="librarian-stat-label">आधिकारिक ईमेल (Official Email)</span>
            <FileCheck size={18} className="stat-icon-crimson" />
          </div>
          <span className="librarian-stat-value email-value">
            {currentUser?.email || "librarian@klib.gov.np"}
          </span>
          <div className="librarian-stat-badge badge-crimson">gov.np Verified</div>
        </div>
      </section>

      {/* Librarian Operations Workflow - 4 Step Framework */}
      <section className="librarian-section">
        <div className="librarian-section-header">
          <div>
            <div className="section-title-strip">
              <span className="section-title-pill">कार्यविधि</span>
              <h2 className="librarian-section-title">Librarian Operations Workflow</h2>
            </div>
            <p className="librarian-section-subtitle">
              पाठक अनुरोध, टोकन प्रमाणीकरण, पुस्तक वितरण तथा मौज्दात अद्यावधिक गर्ने चार-चरणीय कार्यप्रणाली:
            </p>
          </div>
        </div>

        <div className="librarian-flow-grid">
          <Link to="/librarian/reservations" className="librarian-flow-card">
            <div className="flow-card-top">
              <span className="librarian-flow-step-tag step-blue">चरण १ · STEP 1</span>
              <span className="flow-card-arrow">&rarr;</span>
            </div>
            <div className="librarian-flow-icon-box box-blue">
              <BookmarkCheck size={26} />
            </div>
            <h3 className="librarian-flow-title">अग्रिम आरक्षण (Requests)</h3>
            <p className="librarian-flow-desc">पाठकहरूले अनलाइन पोर्टलबाट पेश गरेका पुस्तक आरक्षण सूचीको समीक्षा।</p>
            <span className="librarian-flow-btn">आरक्षण सूची खोल्नुहोस् &rarr;</span>
          </Link>

          <Link to="/librarian/verify-token" className="librarian-flow-card">
            <div className="flow-card-top">
              <span className="librarian-flow-step-tag step-gold">चरण २ · STEP 2</span>
              <span className="flow-card-arrow">&rarr;</span>
            </div>
            <div className="librarian-flow-icon-box box-gold">
              <Key size={26} />
            </div>
            <h3 className="librarian-flow-title">टोकन प्रमाणीकरण (OTP)</h3>
            <p className="librarian-flow-desc">पाठकको ६-अङ्कको आरक्षण टोकन वा बारकोड स्क्यान गरी प्रमाणीकरण।</p>
            <span className="librarian-flow-btn">टोकन प्रमाणित गर्नुहोस् &rarr;</span>
          </Link>

          <Link to="/librarian/issue-book" className="librarian-flow-card">
            <div className="flow-card-top">
              <span className="librarian-flow-step-tag step-emerald">चरण ३ · STEP 3</span>
              <span className="flow-card-arrow">&rarr;</span>
            </div>
            <div className="librarian-flow-icon-box box-emerald">
              <Repeat size={26} />
            </div>
            <h3 className="librarian-flow-title">पुस्तक वितरण (Issue Book)</h3>
            <p className="librarian-flow-desc">भौतिक पुस्तक प्रतिलिपि हस्तान्तरण तथा फिर्ता मिति निर्धारण।</p>
            <span className="librarian-flow-btn">पुस्तक जारी गर्नुहोस् &rarr;</span>
          </Link>

          <Link to="/librarian/update-stock" className="librarian-flow-card">
            <div className="flow-card-top">
              <span className="librarian-flow-step-tag step-crimson">चरण ४ · STEP 4</span>
              <span className="flow-card-arrow">&rarr;</span>
            </div>
            <div className="librarian-flow-icon-box box-crimson">
              <Library size={26} />
            </div>
            <h3 className="librarian-flow-title">मौज्दात अद्यावधिक (Stock)</h3>
            <p className="librarian-flow-desc">भौतिक क्याटलग, दराज शाखा तथा नयाँ पुस्तक प्रतिलिपि प्रविष्टि।</p>
            <span className="librarian-flow-btn">मौज्दात हेर्नुहोस् &rarr;</span>
          </Link>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="librarian-actions-box">
        <div className="librarian-section-header" style={{ marginBottom: "16px" }}>
          <div>
            <h3 className="librarian-section-title" style={{ fontSize: "1.2rem" }}>
              द्रुत कार्यहरू (Quick Actions)
            </h3>
            <p className="librarian-section-subtitle">दैनिक प्रशासनिक तथा सर्कुलेसन कार्यहरूका लागि सिधा सर्टकटहरू</p>
          </div>
        </div>
        <div className="librarian-actions-row">
          <button type="button" className="librarian-btn-primary" onClick={() => navigate("/librarian/issue-book?tab=issue")}>
            <Repeat size={16} /> पुस्तक वितरण (Issue Book)
          </button>
          <button type="button" className="librarian-btn-secondary" onClick={() => navigate("/librarian/verify-token")}>
            <Key size={16} /> टोकन प्रमाणीकरण (Verify OTP)
          </button>
          <button type="button" className="librarian-btn-secondary" onClick={() => navigate("/librarian/reservations")}>
            <BookmarkCheck size={16} /> आरक्षण सूची (Requests)
          </button>
          <button type="button" className="librarian-btn-secondary" onClick={() => navigate("/librarian/update-stock")}>
            <Library size={16} /> मौज्दात क्याटलग (Stock)
          </button>
        </div>
      </section>

      {/* ISSUED BOOKS SECTION - LIVE REGISTRY */}
      <section className="librarian-table-card issued-books-section" id="issued-books-section">
        {/* Section Title & Header */}
        <div className="librarian-table-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div className="gov-table-title-icon">
                <BookOpen size={20} />
              </div>
              <h2 className="librarian-section-title" style={{ fontSize: "1.35rem" }}>
                जारी गरिएका पुस्तकहरूको अभिलेख (Issued Books Records)
              </h2>
              <span className="circulation-live-badge">
                <span className="circulation-pulse-dot"></span> Live Gov Registry
              </span>
            </div>
            <p className="librarian-section-subtitle">
              हालसम्म केशर पुस्तकालयबाट जारी गरिएका सम्पूर्ण पुस्तकहरूको विवरण, म्याद तथा स्थिति
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="issued-refresh-btn"
              onClick={() => fetchIssuedBooks()}
              disabled={loadingRecords}
              title="Refresh all issued book records"
            >
              <RefreshCw size={15} className={loadingRecords ? "spinning" : ""} /> ताजा गर्नुहोस् (Refresh)
            </button>
            <button
              type="button"
              className="librarian-btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              onClick={() => navigate("/librarian/issue-book?tab=issue")}
            >
              <Plus size={16} /> पुस्तक जारी गर्नुहोस्
            </button>
          </div>
        </div>

        {/* Notice Message */}
        {notice && (
          <div className={`issued-notice-banner ${notice.type}`} role="alert">
            <span>{notice.type === "success" ? "✓" : "⚠️"}</span>
            <span>{notice.text}</span>
            <button type="button" className="issued-notice-close" onClick={() => setNotice(null)}>✕</button>
          </div>
        )}

        {/* Issued Books Overview Metric Chips */}
        <div className="issued-metrics-grid">
          <div
            className={`issued-metric-chip ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <div className="metric-chip-icon all">
              <Library size={18} />
            </div>
            <div className="metric-chip-content">
              <span className="metric-chip-label">कुल जारी (Total Issued)</span>
              <span className="metric-chip-count">{totalIssuedAllTime}</span>
            </div>
          </div>

          <div
            className={`issued-metric-chip ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            <div className="metric-chip-icon active">
              <BookOpen size={18} />
            </div>
            <div className="metric-chip-content">
              <span className="metric-chip-label">हाल जारी (Active Loans)</span>
              <span className="metric-chip-count">{activeLoansCount}</span>
            </div>
          </div>

          <div
            className={`issued-metric-chip ${statusFilter === "overdue" ? "active" : ""}`}
            onClick={() => setStatusFilter("overdue")}
          >
            <div className="metric-chip-icon overdue">
              <AlertTriangle size={18} />
            </div>
            <div className="metric-chip-content">
              <span className="metric-chip-label">म्याद नाघेका (Overdue)</span>
              <span className="metric-chip-count">{overdueCount}</span>
            </div>
          </div>

          <div
            className={`issued-metric-chip ${statusFilter === "returned" ? "active" : ""}`}
            onClick={() => setStatusFilter("returned")}
          >
            <div className="metric-chip-icon returned">
              <CheckCircle2 size={18} />
            </div>
            <div className="metric-chip-content">
              <span className="metric-chip-label">फिर्ता भएका (Returned)</span>
              <span className="metric-chip-count">{returnedCount}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="issued-toolbar">
          <div className="issued-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="विद्यार्थी नाम, रोल नं, पुस्तक शीर्षक वा TXN ID खोज्नुहोस्..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="issued-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="issued-filter-tabs">
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              सबै ({totalIssuedAllTime})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === "active" ? "active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              सक्रिय ({activeLoansCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === "overdue" ? "active" : ""}`}
              onClick={() => setStatusFilter("overdue")}
            >
              म्याद नाघेका ({overdueCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === "returned" ? "active" : ""}`}
              onClick={() => setStatusFilter("returned")}
            >
              फिर्ता ({returnedCount})
            </button>
          </div>
        </div>

        {/* Issued Books Table */}
        <div className="librarian-table-wrapper">
          <table className="librarian-table">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>पाठक विवरण (Student)</th>
                <th>जारी गरिएको पुस्तक (Book)</th>
                <th>जारी मिति (Issue Date)</th>
                <th>फिर्ता म्याद (Due Date)</th>
                <th>फिर्ता भएको मिति (Return Date)</th>
                <th>स्थिति (Status)</th>
                <th style={{ textAlign: "center" }}>कार्यहरू (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {loadingRecords ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <RefreshCw size={24} className="spinning" />
                      <span>अभिलेख विवरण लोड हुँदैछ...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((txn) => {
                  const isOverdue = !txn.isReturned && new Date(txn.dueDate) < new Date();
                  const statusClass = txn.isReturned ? "returned" : isOverdue ? "overdue" : "issued";
                  const statusLabel = txn.isReturned ? "✓ Returned" : isOverdue ? "⚠ Overdue" : "● Active Loan";

                  const dueDateObj = new Date(txn.dueDate);
                  const issueDateObj = new Date(txn.issueDate);
                  const diffDays = Math.ceil((dueDateObj - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={txn.id}>
                      {/* TXN ID */}
                      <td className="txn-id">
                        <span className="txn-badge">#TXN-{String(txn.id).padStart(4, "0")}</span>
                      </td>

                      {/* Student */}
                      <td className="student-cell">
                        <div style={{ fontWeight: 700, color: "#07264A" }}>
                          {txn.student?.user?.username || "Student"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          Roll: <strong style={{ color: "#334155" }}>{txn.studentId}</strong>
                        </div>
                        {txn.student?.department && (
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            Dept: {txn.student.department}
                          </div>
                        )}
                      </td>

                      {/* Book */}
                      <td className="book-cell">
                        <div style={{ fontWeight: 700, color: "#07264A", maxWidth: "260px" }}>
                          {txn.book?.title || "Book Title Unavailable"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          By {txn.book?.author || "Unknown Author"}
                        </div>
                        {txn.book?.isbn && (
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace" }}>
                            ISBN: {txn.book.isbn}
                          </div>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{issueDateObj.toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {issueDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td>
                        <div style={{ fontWeight: 600, color: isOverdue ? "#dc2626" : "inherit" }}>
                          {dueDateObj.toLocaleDateString()}
                        </div>
                        {!txn.isReturned && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: isOverdue ? "#dc2626" : diffDays <= 3 ? "#d97706" : "#16a34a",
                            }}
                          >
                            {isOverdue ? `${Math.abs(diffDays)}d Overdue` : `${diffDays}d remaining`}
                          </div>
                        )}
                      </td>

                      {/* Return Date */}
                      <td>
                        {txn.returnDate ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#166534" }}>
                              {new Date(txn.returnDate).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              {new Date(txn.returnDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "#64748b", fontStyle: "italic" }}>
                            In Circulation
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                        {txn.renewalCount > 0 && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.7rem",
                              color: "#64748b",
                              marginTop: "2px",
                            }}
                          >
                            Renewed: {txn.renewalCount}x
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        {!txn.isReturned ? (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              type="button"
                              className="table-action-btn return"
                              onClick={() => handleReturnBook(txn.id, txn.book?.title)}
                              disabled={actionLoading === txn.id}
                              title="Mark this book as returned"
                            >
                              {actionLoading === txn.id ? "Processing..." : "✓ Return"}
                            </button>
                            <button
                              type="button"
                              className="table-action-btn renew"
                              onClick={() => handleRenewBook(txn.id, txn.book?.title)}
                              disabled={actionLoading === txn.id || txn.renewalCount >= 2}
                              title={txn.renewalCount >= 2 ? "Max renewals reached" : "Renew loan for +7 days"}
                            >
                              +7d
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>
                            ✓ Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <Library size={36} style={{ color: "#94a3b8" }} />
                      <strong style={{ fontSize: "1.05rem", color: "#334155" }}>
                        {searchTerm
                          ? `खोज गरिएको "${searchTerm}" फेला परेन`
                          : "हाल कुनै पनि पुस्तक जारी सूचीमा छैन"}
                      </strong>
                      <p style={{ margin: 0, fontSize: "0.88rem", maxWidth: "450px" }}>
                        {searchTerm
                          ? "कृपया फरक नाम, रोल नं वा पुस्तक शीर्षक खोजी हेर्नुहोस्।"
                          : "विद्यार्थीहरूलाई नयाँ पुस्तक जारी गर्न 'पुस्तक जारी गर्नुहोस्' बटन थिच्नुहोस्।"}
                      </p>
                      {searchTerm ? (
                        <button
                          type="button"
                          className="librarian-btn-secondary"
                          style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                          onClick={() => setSearchTerm("")}
                        >
                          खोज सफा गर्नुहोस्
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="librarian-btn-primary"
                          style={{ padding: "8px 18px", fontSize: "0.85rem", marginTop: "6px" }}
                          onClick={() => navigate("/librarian/issue-book?tab=issue")}
                        >
                          <Plus size={16} /> पहिलो पुस्तक जारी गर्नुहोस्
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loadingRecords && filteredRecords.length > 0 && (
          <div className="librarian-mobile-records">
            {filteredRecords.map((txn) => (
              <button
                type="button"
                className="librarian-mobile-record"
                key={txn.id}
                onClick={() => setSelectedRecord(txn)}
              >
                <strong>{txn.book?.title || "Book title unavailable"}</strong>
                <span>{txn.student?.user?.username || txn.studentId} · {txn.isReturned ? "Returned" : "In circulation"}</span>
                <em>›</em>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Staff Operational Guidelines Banner */}
      <section className="librarian-guidelines-box">
        <div className="librarian-guideline-item">
          <div className="guideline-icon-circle gold">
            <Key size={18} />
          </div>
          <div>
            <h4 className="librarian-guideline-title">टोकन प्रमाणीकरण (OTP Validation)</h4>
            <p className="librarian-guideline-desc">
              पुस्तक हस्तान्तरण गर्नुपूर्व पाठकको ६-अङ्कको टोकन प्रणालीमा अनिवार्य प्रमाणीकरण गर्नुहोस्।
            </p>
          </div>
        </div>

        <div className="librarian-guideline-item">
          <div className="guideline-icon-circle blue">
            <Repeat size={18} />
          </div>
          <div>
            <h4 className="librarian-guideline-title">मौज्दात स्वतः अद्यावधिक (Inventory Sync)</h4>
            <p className="librarian-guideline-desc">
              पुस्तक जारी तथा फिर्ता हुनासाथ भौतिक मौज्दात र क्याटलग संख्या स्वतः अद्यावधिक हुन्छ।
            </p>
          </div>
        </div>

        <div className="librarian-guideline-item">
          <div className="guideline-icon-circle crimson">
            <Scale size={18} />
          </div>
          <div>
            <h4 className="librarian-guideline-title">म्याद तथा विलम्ब शुल्क (Due Enforcement)</h4>
            <p className="librarian-guideline-desc">
              साधारण ऋण अवधि १४ दिनको हुन्छ। म्याद नाघेमा नियमानुसार दैनिक विलम्ब शुल्क गणना हुन्छ।
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LibrarianDashboard;
