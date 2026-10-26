import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationBell.css";

const NOTIF_ICONS = {
  DUE_REMINDER: "📅",
  OVERDUE_ALERT: "⚠️",
  RESERVATION_READY: "🎉",
  RECEIPT: "🧾",
  GENERAL: "📢"
};

export default function NotificationBell({ userRole = "student" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailReminders: true,
    inAppAlerts: true,
    overdueAlerts: true,
    reservationAlerts: true
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  // Load preferences from API
  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      const data = await res.json();
      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (e) {
      console.error("Error fetching preferences:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowPreferences(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (e) {
      console.error("Mark read error:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  };

  const handleTogglePreference = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error("Toggle preference error:", e);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="View notifications"
      >
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>
              <span>Notifications</span>
              {unreadCount > 0 && <span className="notif-unread-pill">{unreadCount} new</span>}
            </h4>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-header-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all notifications as read"
                >
                  ✓ Read All
                </button>
              )}
              <button
                type="button"
                className="notif-header-btn"
                onClick={() => setShowPreferences(!showPreferences)}
                title="Notification Preferences"
              >
                ⚙
              </button>
            </div>
          </div>

          {/* Preferences Subpanel */}
          {showPreferences && (
            <div className="notif-pref-panel">
              <div className="notif-pref-title">
                <span>Alert Preferences</span>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Live Sync</span>
              </div>
              <div className="notif-pref-row">
                <span>Email Due Reminders</span>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.emailReminders}
                    onChange={() => handleTogglePreference("emailReminders")}
                  />
                  <span className="notif-slider" />
                </label>
              </div>
              <div className="notif-pref-row">
                <span>In-App Popups & Badges</span>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.inAppAlerts}
                    onChange={() => handleTogglePreference("inAppAlerts")}
                  />
                  <span className="notif-slider" />
                </label>
              </div>
              <div className="notif-pref-row">
                <span>Overdue Warnings</span>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.overdueAlerts}
                    onChange={() => handleTogglePreference("overdueAlerts")}
                  />
                  <span className="notif-slider" />
                </label>
              </div>
              <div className="notif-pref-row">
                <span>Reservation Pickup Alerts</span>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.reservationAlerts}
                    onChange={() => handleTogglePreference("reservationAlerts")}
                  />
                  <span className="notif-slider" />
                </label>
              </div>
            </div>
          )}

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "6px" }}>📭</span>
                <strong>No notifications yet</strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>
                  Due reminders, overdue alerts, and pickup notifications will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? "unread" : ""}`}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                >
                  <span className="notif-icon">{NOTIF_ICONS[n.type] || "📌"}</span>
                  <div className="notif-content">
                    <div className="notif-top-row">
                      <span className="notif-title">{n.title}</span>
                      <span className="notif-time">{formatRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className="notif-message">{n.message}</p>
                    <span className={`notif-tag ${n.type}`}>{n.type.replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
