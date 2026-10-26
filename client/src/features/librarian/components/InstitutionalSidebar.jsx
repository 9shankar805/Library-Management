import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  BookCopy,
  MapPinned,
  ScanBarcode,
  ArrowLeftRight,
  BookmarkCheck,
  Users,
  Wallet,
  FileText,
  Sparkles,
  Compass,
  ChartNoAxesCombined,
  ClipboardCheck,
  ShoppingCart,
  Bell,
  ShieldCheck,
  Settings2,
  ScrollText,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown
} from "lucide-react";
import "../styles/InstitutionalSidebar.css";

const NAVIGATION_GROUPS = [
  {
    group: "Overview",
    items: [
      { to: "/librarian-dashboard", label: "Dashboard", icon: LayoutDashboard }
    ]
  },
  {
    group: "Library",
    items: [
      { to: "/librarian/update-stock", label: "Book Catalog", icon: BookCopy },
      { to: "/librarian/shelf-map", label: "Shelf & Rack Navigator", icon: MapPinned },
      { to: "/librarian/rfid-audit", label: "Barcode & RFID Desk", icon: ScanBarcode },
      { to: "/librarian/issue-book?tab=issue", label: "Issue & Return", icon: ArrowLeftRight },
      { to: "/librarian/reservations", label: "Reservations", icon: BookmarkCheck },
      { to: "/librarian/members", label: "Students & Members", icon: Users },
      { to: "/librarian/fines", label: "Fines & Payments", icon: Wallet },
      { to: "/student-dashboard/digital-library", label: "Digital Library", icon: FileText }
    ]
  },
  {
    group: "Intelligence",
    items: [
      { to: "/librarian/ai-assistant", label: "AI Library Assistant", icon: Sparkles },
      { to: "/librarian/recommendations", label: "Recommendations", icon: Compass },
      { to: "/librarian/analytics", label: "Analytics & Reports", icon: ChartNoAxesCombined }
    ]
  },
  {
    group: "Operations",
    items: [
      { to: "/librarian/inventory-audit", label: "Inventory Audits", icon: ClipboardCheck },
      { to: "/librarian/procurement", label: "Procurement & Budgets", icon: ShoppingCart },
      { to: "/librarian/jobs", label: "Jobs & Notifications", icon: Bell }
    ]
  },
  {
    group: "Administration",
    items: [
      { to: "/librarian/roles", label: "User & Role Access", icon: ShieldCheck },
      { to: "/librarian/settings", label: "Settings & Policies", icon: Settings2 },
      { to: "/librarian/audit-logs", label: "Audit Logs", icon: ScrollText },
      { to: "/librarian/system-health", label: "System Health", icon: Activity }
    ]
  }
];

const InstitutionalSidebar = ({ user, onLogout, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
  const location = useLocation();

  const isActive = (path) => {
    const basePath = path.split("?")[0];
    return location.pathname === basePath;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />}

      <aside className={`institutional-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-logo-icon">
            <BookOpen size={22} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-title">Central Library</span>
              <span className="brand-subtitle">Smart Institutional LMS</span>
            </div>
          )}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Institution Workspace Selector */}
        {!collapsed && (
          <div className="workspace-selector">
            <span className="workspace-label">CAMPUS NODE</span>
            <div className="workspace-box">
              <div className="workspace-dot" />
              <span className="workspace-name">NIT Andhra Pradesh</span>
              <ChevronDown size={14} className="workspace-chevron" />
            </div>
          </div>
        )}

        {/* Grouped Navigation */}
        <div className="sidebar-nav-container">
          {NAVIGATION_GROUPS.map((sec) => (
            <div key={sec.group} className="nav-group-section">
              {!collapsed && <span className="nav-group-heading">{sec.group}</span>}
              <div className="nav-items-list">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-item-link ${active ? "active" : ""}`}
                      onClick={() => mobileOpen && onCloseMobile()}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="nav-item-icon">
                        <Icon size={18} />
                      </span>
                      {!collapsed && <span className="nav-item-label">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile at Bottom */}
        <div className="sidebar-user-footer">
          <div className="user-avatar-circle">
            {(user?.username || user?.email || "L").charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="user-profile-info">
              <span className="user-profile-name">{user?.username || "Librarian"}</span>
              <span className="user-profile-role">
                {user?.role ? user.role.toUpperCase() : "STAFF"}
              </span>
            </div>
          )}
          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={onLogout}
            title="Sign out of library management"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default InstitutionalSidebar;
