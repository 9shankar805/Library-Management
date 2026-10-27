import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Landmark,
  BookmarkCheck,
  CheckSquare,
  Repeat,
  Library,
  ScanBarcode,
  Layers,
  BarChart3,
  ClipboardCheck,
  ShoppingCart,
  ScrollText,
  Bell,
  Scale
} from "lucide-react";
import NotificationBell from "../../../components/NotificationBell";
import { NepalGovEmblem } from "../../../components/NepalGovEmblem";
import "../styles/LibrarianNavbar.css";

const LibrarianNavbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("libraryToken");
      localStorage.removeItem("libraryUser");
    }
    navigate("/", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    document.body.classList.toggle("librarian-sidebar-open", sidebarOpen);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("librarian-sidebar-open");
    };
  }, [sidebarOpen]);

  const navigationLinks = [
    { to: "/librarian-dashboard", label: "ड्यासबोर्ड (Dashboard)", icon: Landmark },
    { to: "/librarian/reservations", label: "आरक्षण (Reservations)", icon: BookmarkCheck },
    { to: "/librarian/verify-token", label: "प्रमाणीकरण (Verify)", icon: CheckSquare },
    { to: "/librarian/issue-book?tab=issue", label: "सर्कुलेसन (Issue/Return)", icon: Repeat },
    { to: "/librarian/update-stock", label: "ग्रन्थ सूची (Catalog)", icon: Library },
    { to: "/librarian/rfid-audit", label: "बारकोड (RFID & Barcode)", icon: ScanBarcode },
    { to: "/librarian/shelf-map", label: "दराज नक्सा (Shelf Map)", icon: Layers },
    { to: "/librarian/analytics", label: "तथ्याङ्क (Analytics)", icon: BarChart3 },
    { to: "/librarian/inventory-audit", label: "मौज्दात (Audit)", icon: ClipboardCheck },
    { to: "/librarian/procurement", label: "खरिद (Procurement)", icon: ShoppingCart },
    { to: "/librarian/audit-logs", label: "लेखापरीक्षण (Audit Logs)", icon: ScrollText },
    { to: "/librarian/jobs", label: "कार्य प्रणाली (Jobs)", icon: Bell },
  ];

  return (
    <header className="librarian-app-header">
      <div className="librarian-navbar-container">
        <button
          type="button"
          className="librarian-menu-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open librarian navigation"
          aria-expanded={sidebarOpen}
          aria-controls="librarian-mobile-sidebar"
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : "L"}
        </button>

        <Link to="/librarian-dashboard" className="librarian-brand-logo">
          <div className="librarian-brand-icon-box" style={{ background: "transparent" }}>
            <NepalGovEmblem width={36} height={36} />
          </div>
          <div className="librarian-brand-text">
            <span className="librarian-brand-title">नेपाल सरकार · केशर पुस्तकालय</span>
            <span className="librarian-brand-subtitle">Kaiser Library Operations Portal · klib.gov.np</span>
          </div>
        </Link>

        <nav className="librarian-nav-links">
          <Link
            to="/librarian/reservations"
            className={`librarian-nav-link ${isActive("/librarian/reservations") ? "active" : ""}`}
          >
            आरक्षण (Reservations)
          </Link>
          <Link
            to="/librarian/verify-token"
            className={`librarian-nav-link ${isActive("/librarian/verify-token") ? "active" : ""}`}
          >
            प्रमाणीकरण (Verify)
          </Link>
          <Link
            to="/librarian/issue-book?tab=issue"
            className={`librarian-nav-link ${isActive("/librarian/issue-book") ? "active" : ""}`}
          >
            सर्कुलेसन (Issue/Return)
          </Link>
          <Link
            to="/librarian/update-stock"
            className={`librarian-nav-link ${isActive("/librarian/update-stock") ? "active" : ""}`}
          >
            ग्रन्थ सूची (Stock)
          </Link>
          <Link
            to="/librarian/analytics"
            className={`librarian-nav-link ${isActive("/librarian/analytics") ? "active" : ""}`}
          >
            तथ्याङ्क (Analytics)
          </Link>
          <Link
            to="/librarian/inventory-audit"
            className={`librarian-nav-link ${isActive("/librarian/inventory-audit") ? "active" : ""}`}
          >
            मौज्दात (Audit)
          </Link>
          <Link
            to="/librarian/procurement"
            className={`librarian-nav-link ${isActive("/librarian/procurement") ? "active" : ""}`}
          >
            खरिद (Procurement)
          </Link>
          <Link
            to="/librarian/audit-logs"
            className={`librarian-nav-link ${isActive("/librarian/audit-logs") ? "active" : ""}`}
          >
            लेखापरीक्षण (Audit Logs)
          </Link>
          <Link
            to="/librarian/jobs"
            className={`librarian-nav-link ${isActive("/librarian/jobs") ? "active" : ""}`}
          >
            कार्य (Jobs)
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <NotificationBell userRole="librarian" />
          <div className="librarian-profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className="librarian-profile-trigger"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Open profile menu"
            >
              <div className="librarian-avatar-icon">
                {user?.username ? user.username.charAt(0).toUpperCase() : "L"}
              </div>
              <span className="librarian-profile-trigger-name">
                {user?.username || user?.email?.split("@")[0] || "पुस्तकालय अधिकृत"}
              </span>
              <span className="librarian-profile-caret">▾</span>
            </button>
            {profileOpen && (
              <div className="librarian-profile-dropdown" role="menu">
                <div className="librarian-profile-name">
                  <div style={{ fontWeight: 800 }}>{user?.username || "पुस्तकालय अधिकृत"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>
                    {user?.email || "librarian@klib.gov.np"}
                  </div>
                  <div className="librarian-role-tag" style={{ marginTop: "4px" }}>
                    नेपाल सरकार · अधिकृत
                  </div>
                </div>
                <button
                  type="button"
                  className="librarian-profile-action librarian-profile-logout"
                  role="menuitem"
                  onClick={handleLogoutClick}
                >
                  सुरक्षित बाहिरिनुहोस् (Logout)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`librarian-sidebar-backdrop ${sidebarOpen ? "is-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="librarian-mobile-sidebar"
        className={`librarian-mobile-sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label="Librarian navigation"
        aria-hidden={!sidebarOpen}
        inert={sidebarOpen ? undefined : ""}
      >
        <div className="librarian-sidebar-top">
          <div className="librarian-sidebar-profile">
            <div className="librarian-sidebar-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : "L"}
            </div>
            <div>
              <strong>{user?.username || user?.email?.split("@")[0] || "पुस्तकालय अधिकृत"}</strong>
              <span>केशर पुस्तकालय · अधिकृत</span>
            </div>
          </div>
          <button
            type="button"
            className="librarian-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>
        <nav className="librarian-sidebar-nav">
          <span className="librarian-sidebar-label">LIBRARY OPERATIONS · ग्रन्थालय सेवा</span>
          {navigationLinks.map(({ to, label, icon: IconComponent }) => (
            <Link
              key={to}
              to={to}
              className={`librarian-sidebar-link ${isActive(to.split("?")[0]) ? "active" : ""}`}
            >
              <span className="librarian-sidebar-link-icon" aria-hidden="true">
                <IconComponent size={16} />
              </span>
              {label}
            </Link>
          ))}
          <Link
            to="/librarian/fines"
            className="librarian-sidebar-link"
          >
            <span className="librarian-sidebar-link-icon" aria-hidden="true">
              <Scale size={16} />
            </span>
            शुल्क तथा जरिवाना (Fines & Ledger)
          </Link>
        </nav>
        <button type="button" className="librarian-sidebar-logout" onClick={handleLogoutClick}>
          सुरक्षित बाहिरिनुहोस् (Log out)
        </button>
      </aside>
    </header>
  );
};

export default LibrarianNavbar;
