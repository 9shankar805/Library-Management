import React, { useState } from "react";
import {
  Settings2,
  Building2,
  BookOpen,
  Clock,
  Wallet,
  Bell,
  CheckCircle2,
  Save,
  RotateCcw
} from "lucide-react";
import "../styles/LibrarianSettingsPage.css";

const LibrarianSettingsPage = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    libraryName: "Central Library",
    institutionName: "National Institute of Technology",
    campusLocation: "Tadepalligudem Campus, Andhra Pradesh",
    operatingHours: "08:00 AM – 10:00 PM (Monday – Saturday)",
    standardLoanDurationDays: 14,
    maxBooksPerStudent: 3,
    dailyOverdueFineRate: 5.00,
    reservationPickupWindowHours: 48,
    maxRenewalsAllowed: 2,
    enableAutomatedCron: true,
    enableEmailReminders: true,
    enableInAppAlerts: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div>
          <span className="settings-kicker">CONFIGURATION DESK</span>
          <h1>Library Policies & System Settings</h1>
          <p>Institutional circulation parameters, loan quotas, fine formulas, and automated background policies.</p>
        </div>
        {saved && (
          <div className="settings-saved-banner">
            <CheckCircle2 size={16} /> Configuration successfully saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="settings-form">
        {/* Institutional Profile */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Building2 size={20} className="card-icon" />
            <div>
              <h3>Institutional Information</h3>
              <span>Core organization identity and library stack location</span>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              <span>Library Name</span>
              <input
                type="text"
                value={settings.libraryName}
                onChange={(e) => setSettings({ ...settings, libraryName: e.target.value })}
              />
            </label>
            <label>
              <span>Institution / University</span>
              <input
                type="text"
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
              />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              <span>Campus Stack Location</span>
              <input
                type="text"
                value={settings.campusLocation}
                onChange={(e) => setSettings({ ...settings, campusLocation: e.target.value })}
              />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              <span>Operating Hours</span>
              <input
                type="text"
                value={settings.operatingHours}
                onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Circulation & Lending Policy */}
        <div className="settings-card">
          <div className="settings-card-header">
            <BookOpen size={20} className="card-icon" />
            <div>
              <h3>Circulation & Lending Quotas</h3>
              <span>Active loan limits, renewal thresholds, and student borrowing quotas</span>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              <span>Standard Loan Duration (Days)</span>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.standardLoanDurationDays}
                onChange={(e) => setSettings({ ...settings, standardLoanDurationDays: Number(e.target.value) })}
              />
            </label>
            <label>
              <span>Max Books per Student</span>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxBooksPerStudent}
                onChange={(e) => setSettings({ ...settings, maxBooksPerStudent: Number(e.target.value) })}
              />
            </label>
            <label>
              <span>Max Online Renewals Allowed</span>
              <input
                type="number"
                min="0"
                max="5"
                value={settings.maxRenewalsAllowed}
                onChange={(e) => setSettings({ ...settings, maxRenewalsAllowed: Number(e.target.value) })}
              />
            </label>
            <label>
              <span>Reservation Pickup Deadline (Hours)</span>
              <input
                type="number"
                min="12"
                max="120"
                value={settings.reservationPickupWindowHours}
                onChange={(e) => setSettings({ ...settings, reservationPickupWindowHours: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>

        {/* Fines & Financial Policy */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Wallet size={20} className="card-icon" />
            <div>
              <h3>Overdue Fines & Penalty Matrix</h3>
              <span>Automatic midnight fine calculation and daily assessment rate</span>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              <span>Daily Overdue Fine Rate (₹ per day)</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={settings.dailyOverdueFineRate}
                onChange={(e) => setSettings({ ...settings, dailyOverdueFineRate: Number(e.target.value) })}
              />
            </label>
            <div className="settings-policy-note">
              <strong>Calculation Rules:</strong> Overdue fine is evaluated at 00:00 UTC daily for all issued loans where <code>dueDate &lt; now()</code>. Unpaid fines require desk clearance before new checkouts are permitted.
            </div>
          </div>
        </div>

        {/* Automation & Notification Services */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Bell size={20} className="card-icon" />
            <div>
              <h3>Automations & Notifications</h3>
              <span>Background daemons, email dispatcher, and in-app alert relays</span>
            </div>
          </div>
          <div className="settings-toggles-list">
            <label className="toggle-row">
              <div>
                <strong>Automated Cron Runner Service</strong>
                <span>Executes background overdue checks, auto-expirations, and fine ledgering every 30 minutes.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAutomatedCron}
                onChange={(e) => setSettings({ ...settings, enableAutomatedCron: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <div>
                <strong>Email Due-Date Reminders</strong>
                <span>Dispatches 3-day advance notice HTML emails to registered student accounts.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableEmailReminders}
                onChange={(e) => setSettings({ ...settings, enableEmailReminders: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <div>
                <strong>In-App Notification Relays</strong>
                <span>Pushes unread notification badge alerts on navbar and student cockpit.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableInAppAlerts}
                onChange={(e) => setSettings({ ...settings, enableInAppAlerts: e.target.checked })}
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="settings-actions-footer">
          <button type="submit" className="btn-save-settings">
            <Save size={16} /> Save Policy Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default LibrarianSettingsPage;
