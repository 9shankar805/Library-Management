import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NepalGovEmblem, NepalFlag } from "./NepalGovEmblem";
import "../styles/Navbar.css";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [currentDateString, setCurrentDateString] = useState("");

  useEffect(() => {
    // Generate formatted Nepali Bikram Sambat & Gregorian display date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const engDate = now.toLocaleDateString('en-US', options);
    // 2026 AD corresponds to approx 2083 BS in Nepal
    const bsYear = now.getFullYear() + 57;
    setCurrentDateString(`वि.सं. ${bsYear} | ${engDate}`);
  }, []);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("libraryToken");
      localStorage.removeItem("libraryUser");
    }
    navigate("/", { replace: true });
  };

  const adjustFontSize = (delta) => {
    if (delta === 0) {
      setFontSizeMultiplier(1);
      document.documentElement.style.fontSize = "16px";
    } else {
      const next = Math.min(Math.max(fontSizeMultiplier + delta, 0.9), 1.15);
      setFontSizeMultiplier(next);
      document.documentElement.style.fontSize = `${16 * next}px`;
    }
  };

  const isActive = (path) => location.pathname === path;
  const dashboardPath = user?.role === "librarian" ? "/librarian-dashboard" : "/student-dashboard";

  return (
    <header className="klib-government-header">
      {/* 1. Top Government Utility Strip */}
      <div className="klib-top-bar">
        <div className="klib-top-container">
          <div className="klib-top-left">
            <span className="klib-gov-badge">🇳🇵 नेपाल सरकार · Ministry of Education, Science & Technology</span>
            <span className="klib-date-chip">📅 {currentDateString || "वि.सं. २०८३"}</span>
          </div>

          <div className="klib-top-right">
            <a href="tel:+97714411131" className="klib-contact-item">
              📞 +977-1-4411131
            </a>
            <a href="mailto:info@klib.gov.np" className="klib-contact-item">
              ✉️ info@klib.gov.np
            </a>
            <div className="klib-font-controls" title="Text Resizer">
              <button type="button" onClick={() => adjustFontSize(-0.05)} className="font-btn" title="Decrease font">A-</button>
              <button type="button" onClick={() => adjustFontSize(0)} className="font-btn reset" title="Default font">A</button>
              <button type="button" onClick={() => adjustFontSize(0.05)} className="font-btn" title="Increase font">A+</button>
            </div>
            <a
              href="https://klib.gov.np"
              target="_blank"
              rel="noreferrer"
              className="klib-portal-link"
              title="Visit official klib.gov.np"
            >
              klib.gov.np ↗
            </a>
          </div>
        </div>
      </div>

      {/* 2. Official Masthead (Government Emblem + Library Name) */}
      <div className="klib-masthead">
        <div className="klib-masthead-container">
          <Link to="/" className="klib-brand-box">
            <NepalGovEmblem width={76} height={76} className="klib-emblem" />
            <div className="klib-title-hierarchy">
              <span className="klib-org-parent">नेपाल सरकार | Government of Nepal</span>
              <span className="klib-ministry">शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय</span>
              <h1 className="klib-library-name">केशर पुस्तकालय <span className="klib-name-en">(Kaiser Library)</span></h1>
              <span className="klib-location">कान्तिपथ, काठमाडौं, नेपाल · Kantipath, Kathmandu</span>
            </div>
          </Link>

          <div className="klib-header-flag-box">
            <NepalFlag width={38} height={48} className="klib-flag" />
            <div className="klib-motto-box">
              <span className="klib-motto-np">ज्ञान नै शक्ति हो</span>
              <span className="klib-motto-en">Est. 1907 AD (Kaiser Mahal)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Government Navigation Bar */}
      <nav className="klib-navbar">
        <div className="klib-nav-container">
          <div className="klib-nav-links">
            <Link to="/" className={`klib-nav-item ${isActive("/") ? "active" : ""}`}>
              🏛️ गृहपृष्ठ (Home)
            </Link>

            <Link
              to="/student-dashboard/browse"
              className={`klib-nav-item ${isActive("/student-dashboard/browse") ? "active" : ""}`}
            >
              📖 पुस्तकालय सूचीपत्र (OPAC)
            </Link>

            <Link
              to="/student-dashboard/digital-library"
              className={`klib-nav-item ${isActive("/student-dashboard/digital-library") ? "active" : ""}`}
            >
              💻 ई-पुस्तकालय (E-Library)
            </Link>

            <Link
              to="/student-dashboard/alerts"
              className={`klib-nav-item ${isActive("/student-dashboard/alerts") ? "active" : ""}`}
            >
              📢 सूचना केन्द्र (Notices)
            </Link>

            {user && (
              <Link
                to={dashboardPath}
                className={`klib-nav-item ${isActive(dashboardPath) ? "active" : ""}`}
              >
                📊 {user.role === "librarian" ? "व्यवस्थापक पोर्टल (Librarian)" : "मेरो खाता (Student Portal)"}
              </Link>
            )}
          </div>

          <div className="klib-auth-actions">
            {user ? (
              <div className="klib-user-status">
                <div className="klib-avatar">
                  {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="klib-user-info">
                  <span className="klib-user-name">{user.username || user.email}</span>
                  <span className="klib-role-tag">{user.role}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="klib-logout-btn"
                  title="Sign out of portal"
                >
                  बहिर्गमन (Logout)
                </button>
              </div>
            ) : (
              <div className="klib-guest-actions">
                <Link to="/login" className="klib-signin-btn">
                  🔑 प्रवेश (Sign In)
                </Link>
                <Link to="/register" className="klib-register-btn">
                  सदस्यता दर्ता (Register)
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 4. Live Notice Bulletin Strip (सूचना Ticker) */}
      <div className="klib-notice-ticker">
        <div className="klib-ticker-container">
          <span className="ticker-badge">📢 सूचना / NOTICE</span>
          <div className="ticker-marquee">
            <span className="ticker-text">
              केसर पुस्तकालय (Kaiser Library), कान्तिपथ: अनलाइन सूचीपत्र (OPAC), ई-पुस्तकालय, ऐतिहासिक पाण्डुलिपि अभिलेख तथा RFID सर्कुलेसन सेवा सञ्चालनमा छ ।
            </span>
          </div>
          <span className="ticker-campus-badge">Kaiser Mahal Heritage Portal</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
