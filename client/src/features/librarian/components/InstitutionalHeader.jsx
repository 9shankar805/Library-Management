import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Landmark,
  Menu,
  Search,
  Plus,
  Bell,
  CircleHelp,
  ChevronDown,
  User,
  LogOut,
  ArrowRight,
  BookCopy,
  ScanBarcode,
  ShoppingCart,
  ClipboardCheck
} from "lucide-react";
import NotificationBell from "../../../components/NotificationBell";
import "../styles/InstitutionalHeader.css";

const ROUTE_TITLES = {
  "/librarian-dashboard": "केन्द्रीय ड्यासबोर्ड (Dashboard Overview)",
  "/librarian/update-stock": "ग्रन्थ सूची तथा मौज्दात (Book Catalog & Copies)",
  "/librarian/shelf-map": "दराज तथा र्याक नक्सा (Shelf & Rack Navigator)",
  "/librarian/rfid-audit": "बारकोड तथा आरएफआईडी डेस्क (Barcode & RFID Desk)",
  "/librarian/issue-book": "सर्कुलेसन: जारी तथा फिर्ता (Issue, Return & Renewal Desk)",
  "/librarian/reservations": "अग्रिम आरक्षण सूची (Smart Reservation Queue)",
  "/librarian/members": "पाठक तथा सदस्य पञ्जीकरण (Member Registry)",
  "/librarian/fines": "शुल्क तथा जरिवाना अभिलेख (Fines & Revenue Ledger)",
  "/librarian/analytics": "तथ्याङ्क तथा प्रतिवेदन (Circulation Analytics & Reports)",
  "/librarian/inventory-audit": "मौज्दात परीक्षण (Stock Audits & Verification)",
  "/librarian/procurement": "सार्वजनिक खरिद तथा बजेट (Acquisition & Budgets)",
  "/librarian/jobs": "कार्य तथा सूचना प्रणाली (Background Jobs & Reminders)",
  "/librarian/roles": "अधिकार नियन्त्रण (Access Control & Roles)",
  "/librarian/settings": "पुस्तकालय नीति तथा सेटिङ (Library Policies & Directives)",
  "/librarian/audit-logs": "महालेखापरीक्षण लग (Immutable Audit Logs)",
  "/librarian/system-health": "प्रणाली स्वास्थ्य तथा टेलिमेट्री (System Telemetry)",
  "/librarian/ai-assistant": "एआई ग्रन्थ सहायक (AI Library Assistant)",
  "/librarian/recommendations": "ग्रन्थ सिफारिश प्रणाली (Smart Recommendations)"
};

const InstitutionalHeader = ({ user, onLogout, onOpenMobile, onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const quickRef = useRef(null);
  const userRef = useRef(null);
  const helpRef = useRef(null);

  const currentPath = location.pathname;
  const pageTitle = ROUTE_TITLES[currentPath] || "केशर पुस्तकालय व्यवस्थापन (Kaiser Library)";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!quickRef.current?.contains(e.target)) setQuickCreateOpen(false);
      if (!userRef.current?.contains(e.target)) setUserMenuOpen(false);
      if (!helpRef.current?.contains(e.target)) setHelpOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="institutional-header">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="header-left">
        <button
          type="button"
          className="header-mobile-toggle"
          onClick={onOpenMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-breadcrumbs">
          <span className="breadcrumb-root" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Landmark size={15} style={{ color: "#C59B27" }} />
            <span>नेपाल सरकार · केशर पुस्तकालय</span>
          </span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{pageTitle}</span>
        </div>
      </div>

      {/* Center: Global Search Input */}
      <div className="header-center">
        <button
          type="button"
          className="header-search-bar"
          onClick={onOpenSearch}
          title="Search books, members, accession tags (Ctrl + K)"
        >
          <Search size={16} className="search-icon" />
          <span className="search-placeholder">द्रुत खोज (Search catalog, accession, members...)</span>
          <span className="search-shortcut-badge">
            <kbd>Ctrl</kbd> <kbd>K</kbd>
          </span>
        </button>
      </div>

      {/* Right: Quick Actions, Notifications, User */}
      <div className="header-right">
        {/* Quick Create Dropdown */}
        <div className="header-dropdown-container" ref={quickRef}>
          <button
            type="button"
            className="btn-quick-create"
            onClick={() => setQuickCreateOpen((prev) => !prev)}
            aria-expanded={quickCreateOpen}
          >
            <Plus size={16} />
            <span className="quick-create-label">द्रुत कार्य (Action)</span>
            <ChevronDown size={14} />
          </button>

          {quickCreateOpen && (
            <div className="quick-create-menu">
              <div
                className="quick-menu-item"
                onClick={() => {
                  setQuickCreateOpen(false);
                  navigate("/librarian/issue-book?tab=issue");
                }}
              >
                <ScanBarcode size={16} className="item-icon" />
                <div>
                  <strong>पुस्तक वितरण (Issue Book)</strong>
                  <span>बारकोड वा पाठक परिचयमार्फत पुस्तक जारी</span>
                </div>
              </div>
              <div
                className="quick-menu-item"
                onClick={() => {
                  setQuickCreateOpen(false);
                  navigate("/librarian/update-stock");
                }}
              >
                <BookCopy size={16} className="item-icon" />
                <div>
                  <strong>ग्रन्थ सूची तथा मौज्दात (Catalog)</strong>
                  <span>भौतिक पुस्तक प्रतिलिपि तथा वर्गीकरण</span>
                </div>
              </div>
              <div
                className="quick-menu-item"
                onClick={() => {
                  setQuickCreateOpen(false);
                  navigate("/librarian/procurement");
                }}
              >
                <ShoppingCart size={16} className="item-icon" />
                <div>
                  <strong>नयाँ खरिद माग (Procurement)</strong>
                  <span>सार्वजनिक खरिद ऐन अनुसार खरिद माग</span>
                </div>
              </div>
              <div
                className="quick-menu-item"
                onClick={() => {
                  setQuickCreateOpen(false);
                  navigate("/librarian/inventory-audit");
                }}
              >
                <ClipboardCheck size={16} className="item-icon" />
                <div>
                  <strong>मौज्दात अडिट (Verification)</strong>
                  <span>दराज तथा र्याक भौतिक प्रमाणीकरण</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Center */}
        <NotificationBell userRole="librarian" />

        {/* Help Menu */}
        <div className="header-dropdown-container" ref={helpRef}>
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setHelpOpen((prev) => !prev)}
            title="Help & System Info"
          >
            <CircleHelp size={18} />
          </button>
          {helpOpen && (
            <div className="help-menu-dropdown">
              <h4>Central Library LMS</h4>
              <p>Institutional Library Management System v2.6.4</p>
              <div className="help-links">
                <Link to="/librarian/settings" onClick={() => setHelpOpen(false)}>
                  Library Policies & Rules
                </Link>
                <Link to="/librarian/system-health" onClick={() => setHelpOpen(false)}>
                  System Telemetry & Status
                </Link>
                <Link to="/librarian/ai-assistant" onClick={() => setHelpOpen(false)}>
                  Ask AI Assistant
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="header-dropdown-container" ref={userRef}>
          <button
            type="button"
            className="header-user-btn"
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            <div className="header-user-avatar">
              {(user?.username || user?.email || "L").charAt(0).toUpperCase()}
            </div>
            <span className="header-user-name">
              {user?.username || "Librarian"}
            </span>
            <ChevronDown size={14} className="user-chevron" />
          </button>

          {userMenuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-dropdown-header">
                <strong>{user?.username || "पुस्तकालय अधिकृत (Librarian)"}</strong>
                <span>{user?.email || "librarian@klib.gov.np"}</span>
                <span className="user-role-badge">
                  {user?.role ? `${user.role.toUpperCase()} · GAZETTED` : "LIBRARIAN · GAZETTED"}
                </span>
              </div>
              <div className="user-dropdown-divider" />
              <Link
                to="/librarian/settings"
                className="user-dropdown-link"
                onClick={() => setUserMenuOpen(false)}
              >
                <User size={15} /> Account Settings
              </Link>
              <Link
                to="/librarian/roles"
                className="user-dropdown-link"
                onClick={() => setUserMenuOpen(false)}
              >
                Role & Permissions
              </Link>
              <div className="user-dropdown-divider" />
              <button
                type="button"
                className="user-dropdown-logout"
                onClick={onLogout}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default InstitutionalHeader;
