import { useState, useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import InstitutionalSidebar from "./features/librarian/components/InstitutionalSidebar";
import InstitutionalHeader from "./features/librarian/components/InstitutionalHeader";
import CommandPaletteModal from "./components/CommandPaletteModal";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function AppContent() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("libraryUser");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("libraryUser");
      }
    }
    return null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("libraryUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("libraryUser");
      }
    }
  }, []);

  // Global Ctrl+K / Cmd+K Command Palette Trigger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("libraryToken");
    localStorage.removeItem("libraryUser");
    setUser(null);
  };

  const isLibrarian = user?.role === "librarian" || location.pathname.startsWith("/librarian");
  const isStudentDashboard = location.pathname.startsWith("/student-dashboard");

  if (isLibrarian) {
    return (
      <div className={`institutional-layout-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <InstitutionalSidebar
          user={user}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="institutional-main-wrapper">
          <InstitutionalHeader
            user={user}
            onLogout={handleLogout}
            onOpenMobile={() => setMobileOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />
          <main className="institutional-page-body">
            <AppRoutes
              user={user}
              onAuthSuccess={handleAuthSuccess}
              onLogout={handleLogout}
            />
          </main>
          <footer className="institutional-footer">
            <span>© 2026 Central Library Management System · Campus Node: NIT Andhra Pradesh</span>
            <span>Enterprise Grade RBAC · Real-time Audit & Telemetry Active</span>
          </footer>
        </div>

        <CommandPaletteModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!isStudentDashboard && (
        <Navbar user={user} onLogout={handleLogout} />
      )}

      <main className="main-content">
        <AppRoutes
          user={user}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />
      </main>

      {!isStudentDashboard && (
        <footer className="app-footer">
          <div className="footer-content">
            <span>© 2026 Central Library Management System</span>
            <span>Secure Domain OTP & Role-Based Access Control</span>
          </div>
        </footer>
      )}

      <CommandPaletteModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

