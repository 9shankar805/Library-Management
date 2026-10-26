import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
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
  "/librarian-dashboard": "Dashboard Overview",
  "/librarian/update-stock": "Book Catalog & Copies",
  "/librarian/shelf-map": "Shelf & Rack Navigator",
  "/librarian/rfid-audit": "Barcode & RFID Circulation Desk",
  "/librarian/issue-book": "Issue, Return & Renewal Desk",
  "/librarian/reservations": "Smart Reservation Queue",
  "/librarian/members": "Students & Member Registry",
  "/librarian/fines": "Fines & Payments Ledger",
  "/librarian/analytics": "Circulation Analytics & Reports",
  "/librarian/inventory-audit": "Stock Audits & Verification",
  "/librarian/procurement": "Book Acquisition & Budgets",
  "/librarian/jobs": "Background Jobs & Reminders",
  "/librarian/roles": "Multi-Level Access Control",
  "/librarian/settings": "Settings & Library Policies",
  "/librarian/audit-logs": "Immutable Audit Logs",
  "/librarian/system-health": "Infrastructure & Telemetry",
  "/librarian/ai-assistant": "AI Library Assistant",
  "/librarian/recommendations": "Recommendation Intelligence"
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
  const pageTitle = ROUTE_TITLES[currentPath] || "Central Library Management";

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
          <span className="breadcrumb-root">Portal</span>
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
          <span className="search-placeholder">Quick search catalog, accession IDs, members...</span>
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
            <span className="quick-create-label">Quick Action</span>
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
                  <strong>Issue Book to Member</strong>
                  <span>Check out copy using barcode or ID</span>
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
                  <strong>Catalog & Stock Update</strong>
                  <span>Manage physical accession copies</span>
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
                  <strong>New Purchase Order</strong>
                  <span>Acquisition request & budgets</span>
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
                  <strong>Start Stock Verification</strong>
                  <span>Scan shelf racks and reconcile</span>
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
                <strong>{user?.username || "Librarian Staff"}</strong>
                <span>{user?.email || "staff@nitandhra.ac.in"}</span>
                <span className="user-role-badge">
                  {user?.role ? user.role.toUpperCase() : "LIBRARIAN"}
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
