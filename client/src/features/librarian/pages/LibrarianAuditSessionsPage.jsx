import React, { useEffect, useState } from "react";
import "../styles/LibrarianAuditSessionsPage.css";

const LibrarianAuditSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    sessionName: "Section A Physical Stack Audit",
    conductedBy: "Librarian Desk",
    floor: "all"
  });
  const [writeOffModal, setWriteOffModal] = useState(null);
  const [writeOffReason, setWriteOffReason] = useState("");

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/inventory-audit/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        if (data.sessions?.length > 0 && !activeSession) {
          setActiveSession(data.sessions[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory-audit/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSessionData)
      });
      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        await loadSessions();
        setActiveSession(data.session);
      }
    } catch (err) {
      alert("Failed to create audit session: " + err.message);
    }
  };

  const handleScanCopy = async (e) => {
    e.preventDefault();
    if (!scanInput.trim() || !activeSession) return;

    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch(`/api/inventory-audit/sessions/${activeSession.id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanValue: scanInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setScanMessage({
          type: "success",
          text: `✅ Verified: ${data.copy.accessionNo} - "${data.copy.bookTitle}" (${data.copy.shelfLocation})`
        });
        setActiveSession((prev) => ({
          ...prev,
          totalScanned: data.sessionStats.totalScanned,
          totalMisplaced: data.sessionStats.totalMisplaced
        }));
        setScanInput("");
      } else {
        setScanMessage({ type: "error", text: data.message || "Unrecognized copy barcode/tag." });
      }
    } catch (err) {
      setScanMessage({ type: "error", text: "Scan failed: " + err.message });
    } finally {
      setIsScanning(false);
    }
  };

  const handleReconcile = async () => {
    if (!activeSession) return;
    if (!window.confirm(`Finalize and reconcile audit session "${activeSession.sessionName}"?`)) return;

    try {
      const res = await fetch(`/api/inventory-audit/sessions/${activeSession.id}/reconcile`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setActiveSession(data.session);
        await loadSessions();
      }
    } catch (err) {
      alert("Failed to reconcile: " + err.message);
    }
  };

  const handleWriteOff = async () => {
    if (!writeOffModal) return;
    try {
      const res = await fetch(`/api/inventory-audit/copies/${writeOffModal.id}/write-off`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writeOffReason, status: "DAMAGED" })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setWriteOffModal(null);
        setWriteOffReason("");
      }
    } catch (err) {
      alert("Write-off failed: " + err.message);
    }
  };

  return (
    <div className="audit-sessions-page">
      {/* Top Header */}
      <div className="audit-header">
        <div>
          <span className="audit-kicker">STOCK INTEGRITY & PHYSICAL VERIFICATION</span>
          <h1>Inventory Audit & Lost-Book Cockpit</h1>
          <p>Scan shelves, reconcile missing items, flag misplaced accession tags, and write off damaged books.</p>
        </div>
        <button
          type="button"
          className="audit-btn-primary"
          onClick={() => setShowNewModal(true)}
        >
          ➕ Start New Audit Session
        </button>
      </div>

      {/* Main Layout: Left Session List, Right Active Session Cockpit */}
      <div className="audit-layout-grid">
        {/* Left Column: Sessions List */}
        <div className="audit-panel sessions-list-panel">
          <h3>Audit Sessions History</h3>
          <div className="sessions-list">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`session-card-item ${activeSession?.id === s.id ? "active" : ""}`}
                onClick={() => setActiveSession(s)}
              >
                <div className="session-item-header">
                  <strong>{s.sessionName}</strong>
                  <span className={`session-badge ${s.status.toLowerCase()}`}>{s.status}</span>
                </div>
                <div className="session-item-meta">
                  <span>Conducted by: {s.conductedBy}</span>
                  <span>Date: {new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="session-item-counts">
                  <span>Expected: <strong>{s.totalExpected}</strong></span>
                  <span>Scanned: <strong style={{ color: "#16a34a" }}>{s.totalScanned}</strong></span>
                  <span>Missing: <strong style={{ color: "#e11d48" }}>{s.totalMissing}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Session Execution */}
        {activeSession ? (
          <div className="audit-panel session-workspace-panel">
            <div className="workspace-header">
              <div>
                <h2>{activeSession.sessionName}</h2>
                <span className="workspace-sub">
                  Conducted by {activeSession.conductedBy} · Status: <strong>{activeSession.status}</strong>
                </span>
              </div>
              {activeSession.status === "IN_PROGRESS" && (
                <button
                  type="button"
                  className="audit-btn-reconcile"
                  onClick={handleReconcile}
                >
                  ⚖️ Finalize & Reconcile Session
                </button>
              )}
            </div>

            {/* Quick Stat Tiles */}
            <div className="audit-stat-tiles">
              <div className="audit-stat-tile">
                <span className="tile-num">{activeSession.totalExpected}</span>
                <span className="tile-title">Expected Copies</span>
              </div>
              <div className="audit-stat-tile green">
                <span className="tile-num">{activeSession.totalScanned}</span>
                <span className="tile-title">Verified Scanned</span>
              </div>
              <div className="audit-stat-tile red">
                <span className="tile-num">{activeSession.totalMissing}</span>
                <span className="tile-title">Unaccounted / Missing</span>
              </div>
              <div className="audit-stat-tile orange">
                <span className="tile-num">{activeSession.totalMisplaced}</span>
                <span className="tile-title">Misplaced / Flagged</span>
              </div>
            </div>

            {/* Rapid Scanner Input */}
            <div className="audit-scanner-box">
              <h3>📡 Physical Scan Verification (Barcode / RFID / Accession No)</h3>
              <p>Type or barcode-scan any copy tag to match against library shelf database:</p>
              <form onSubmit={handleScanCopy} className="audit-scan-form">
                <input
                  type="text"
                  placeholder="Scan barcode (e.g. BC32350884-01 or ACC-2026-0101-01)..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  disabled={activeSession.status === "COMPLETED" || isScanning}
                />
                <button
                  type="submit"
                  disabled={activeSession.status === "COMPLETED" || isScanning}
                  className="audit-btn-scan"
                >
                  {isScanning ? "Scanning..." : "Verify Copy"}
                </button>
              </form>

              {/* Simulation Quick Clicks */}
              <div className="scanner-quick-chips">
                <span>Quick Test Tags:</span>
                <button
                  type="button"
                  onClick={() => setScanInput("ACC-2026-0101-01")}
                >
                  ACC-2026-0101-01
                </button>
                <button
                  type="button"
                  onClick={() => setScanInput("BC32350884-02")}
                >
                  BC32350884-02
                </button>
                <button
                  type="button"
                  onClick={() => setScanInput("E280116060010103")}
                >
                  RFID: E280116...
                </button>
              </div>

              {scanMessage && (
                <div className={`scan-alert ${scanMessage.type}`}>
                  {scanMessage.text}
                </div>
              )}
            </div>

            {/* Lost Book & Write Off Quick Action */}
            <div className="audit-discrepancy-box">
              <div className="box-header-row">
                <h3>🛠️ Lost & Damaged Stock Resolution</h3>
                <span className="box-badge">Maintenance Desk</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 12px" }}>
                Found a severely worn, damaged, or unrecoverable book copy? Mark status to preserve catalog accuracy.
              </p>
              <button
                type="button"
                className="audit-btn-writeoff"
                onClick={() => setWriteOffModal({ id: 1, accessionNo: "ACC-2026-0101-01" })}
              >
                📝 Report Damaged Copy / Write-Off
              </button>
            </div>
          </div>
        ) : (
          <div className="audit-panel session-workspace-panel empty">
            <p>Select an audit session from the list or start a new physical stock verification.</p>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div className="audit-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="audit-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h3>Start Physical Inventory Audit</h3>
              <button type="button" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSession} className="audit-modal-body">
              <label>
                <span>Audit Session Name</span>
                <input
                  type="text"
                  required
                  value={newSessionData.sessionName}
                  onChange={(e) => setNewSessionData({ ...newSessionData, sessionName: e.target.value })}
                />
              </label>
              <label>
                <span>Conducted By (Staff Name / Team)</span>
                <input
                  type="text"
                  required
                  value={newSessionData.conductedBy}
                  onChange={(e) => setNewSessionData({ ...newSessionData, conductedBy: e.target.value })}
                />
              </label>
              <label>
                <span>Physical Scope / Floor</span>
                <select
                  value={newSessionData.floor}
                  onChange={(e) => setNewSessionData({ ...newSessionData, floor: e.target.value })}
                >
                  <option value="all">Entire Central Library (All Floors)</option>
                  <option value="1">Floor 1 (CS, Math, Tech Stacks)</option>
                  <option value="2">Floor 2 (Mech, Civil, EEE Stacks)</option>
                  <option value="3">Floor 3 (Literature & Periodicals)</option>
                </select>
              </label>
              <div className="audit-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="audit-btn-primary">
                  Begin Audit Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write-off Modal */}
      {writeOffModal && (
        <div className="audit-modal-backdrop" onClick={() => setWriteOffModal(null)}>
          <div className="audit-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h3>Write Off Damaged Book Copy</h3>
              <button type="button" onClick={() => setWriteOffModal(null)}>×</button>
            </div>
            <div className="audit-modal-body">
              <p style={{ fontSize: "0.85rem", color: "#475569" }}>
                Retire copy <strong>{writeOffModal.accessionNo}</strong> from circulation due to physical deterioration or water/mold damage.
              </p>
              <label>
                <span>Reason for Write-Off</span>
                <textarea
                  rows={3}
                  placeholder="Describe damage (e.g., Missing pages 45-90, torn spine, water damage)..."
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                />
              </label>
              <div className="audit-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setWriteOffModal(null)}>
                  Cancel
                </button>
                <button type="button" className="audit-btn-danger" onClick={handleWriteOff}>
                  Confirm Damage Write-Off
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianAuditSessionsPage;
