import React, { useState, useEffect } from "react";
import BarcodeQrModal from "../../../components/BarcodeQrModal";
import "../styles/LibrarianRfidAuditPage.css";

const LibrarianRfidAuditPage = () => {
  const [shelves, setShelves] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [singleTagInput, setSingleTagInput] = useState("");
  const [singleScanResult, setSingleScanResult] = useState(null);
  const [activeBarcodeModal, setActiveBarcodeModal] = useState(null);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchShelves();
  }, []);

  const fetchShelves = async () => {
    try {
      const res = await fetch("/api/shelves");
      const data = await res.json();
      if (data.success && data.shelves) {
        setShelves(data.shelves);
        if (data.shelves.length > 0) {
          setSelectedShelfId(String(data.shelves[0].id));
        }
      }
    } catch (err) {
      console.error("Error fetching shelves:", err);
    }
  };

  const handleRunBulkAudit = async () => {
    if (!selectedShelfId) return;
    setLoading(true);
    setFeedback({ text: "", type: "" });

    try {
      // 1. Fetch expected copies for the selected shelf
      const shelfRes = await fetch(`/api/shelves/${selectedShelfId}`);
      const shelfData = await shelfRes.json();
      const allCopies = shelfData.shelf?.copies || [];

      // 2. Simulate UHF RFID reader antenna reading 95% of expected tags + occasional misplaced tag
      const scannedTags = allCopies
        .filter((_, idx) => idx % 7 !== 0) // Leave ~14% missing for realistic inventory discrepancy
        .map((c) => c.rfidTag);

      // Add a simulated misplaced tag from another shelf if available
      scannedTags.push("E280116060010401");

      const res = await fetch("/api/rfid/bulk-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelfId: parseInt(selectedShelfId, 10),
          scannedTags,
          conductedBy: "Librarian Alice"
        })
      });

      const data = await res.json();
      if (data.success) {
        setAuditResult(data);
        setFeedback({
          text: `Audit complete for ${data.shelf.section} (${data.shelf.rackNumber}). Reconciliation rate: ${data.metrics.reconciliationRate}`,
          type: "success"
        });
      } else {
        setFeedback({ text: data.message || "Audit failed.", type: "error" });
      }
    } catch (err) {
      setFeedback({ text: "Error conducting RFID audit.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleTagScan = async (e) => {
    e?.preventDefault();
    if (!singleTagInput.trim()) return;

    try {
      const res = await fetch("/api/rfid/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: singleTagInput.trim() })
      });
      const data = await res.json();
      if (data.success && data.copies && data.copies.length > 0) {
        setSingleScanResult(data.copies[0]);
        setFeedback({ text: `Recognized Tag: ${data.copies[0].accessionNo}`, type: "success" });
      } else {
        setSingleScanResult(null);
        setFeedback({ text: `Tag not found in library inventory.`, type: "error" });
      }
    } catch (err) {
      setFeedback({ text: "Single scan failed.", type: "error" });
    }
  };

  return (
    <div className="rfid-audit-page-container">
      <div className="rfid-header-banner">
        <div>
          <span className="rfid-badge">📡 UHF RFID & ACCESSION AUDIT DESK</span>
          <h2>Automated Inventory Audit & RFID Scanner</h2>
          <p>Scan individual books or execute high-speed multi-tag shelf audits to reconcile physical stock.</p>
        </div>
      </div>

      {feedback.text && (
        <div className={`rfid-toast-msg ${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      {/* Audit control & Single Scan row */}
      <div className="rfid-controls-grid">
        {/* Bulk Shelf Audit Controller */}
        <div className="rfid-control-card">
          <div className="card-top-icon">🏷️</div>
          <h3>Rapid Shelf-Rack Audit</h3>
          <p className="card-desc">Select a physical shelf bay to execute simultaneous multi-tag reconciliation.</p>

          <div className="shelf-select-wrapper">
            <label>Select Shelf Rack to Audit:</label>
            <select
              value={selectedShelfId}
              onChange={(e) => {
                setSelectedShelfId(e.target.value);
                setAuditResult(null);
              }}
              className="rfid-select"
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  Floor {s.floor} — {s.section} (Rack {s.rackNumber}, {s.shelfTier}) • {s.totalCopiesCount} copies
                </option>
              ))}
            </select>
          </div>

          <button
            className="rfid-primary-btn"
            onClick={handleRunBulkAudit}
            disabled={loading}
          >
            {loading ? "Scanning UHF Waves..." : "⚡ Execute Bulk RFID Rack Scan"}
          </button>
        </div>

        {/* Single Tag / Barcode Scanner */}
        <div className="rfid-control-card">
          <div className="card-top-icon">🔍</div>
          <h3>Single Copy Tag / Barcode Lookup</h3>
          <p className="card-desc">Type or scan an individual EPC RFID tag or barcode to retrieve exact copy metadata.</p>

          <form onSubmit={handleSingleTagScan} className="single-scan-form">
            <input
              type="text"
              placeholder="e.g., E280116060010101 or BC32350884-01"
              value={singleTagInput}
              onChange={(e) => setSingleTagInput(e.target.value)}
              className="rfid-input"
            />
            <button type="submit" className="rfid-secondary-btn">
              Lookup
            </button>
          </form>

          {singleScanResult && (
            <div className="single-copy-result-card">
              <div className="copy-result-header">
                <strong>{singleScanResult.book?.title}</strong>
                <span className={`status-tag ${singleScanResult.status.toLowerCase()}`}>
                  {singleScanResult.status}
                </span>
              </div>
              <div className="copy-result-details">
                <span>Accession: <code>{singleScanResult.accessionNo}</code></span>
                <span>Barcode: <code>{singleScanResult.barcode}</code></span>
                <span>Location: Floor {singleScanResult.shelf?.floor}, {singleScanResult.shelf?.section} ({singleScanResult.shelf?.rackNumber})</span>
              </div>
              <button
                className="sticker-btn"
                onClick={() => setActiveBarcodeModal(singleScanResult)}
              >
                🏷️ View Barcode / QR Label
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Reconciliation Results */}
      {auditResult && (
        <div className="audit-results-section">
          <div className="audit-metrics-row">
            <div className="metric-box total">
              <span className="metric-val">{auditResult.metrics.totalExpected}</span>
              <span className="metric-lbl">Expected on Shelf</span>
            </div>
            <div className="metric-box present">
              <span className="metric-val">{auditResult.metrics.presentCount}</span>
              <span className="metric-lbl">Present (Scanned)</span>
            </div>
            <div className="metric-box missing">
              <span className="metric-val">{auditResult.metrics.missingCount}</span>
              <span className="metric-lbl">Missing Discrepancies</span>
            </div>
            <div className="metric-box misplaced">
              <span className="metric-val">{auditResult.metrics.misplacedCount}</span>
              <span className="metric-lbl">Misplaced Books</span>
            </div>
            <div className="metric-box rate">
              <span className="metric-val">{auditResult.metrics.reconciliationRate}</span>
              <span className="metric-lbl">Reconciliation Rate</span>
            </div>
          </div>

          <div className="audit-discrepancy-tables">
            {/* Misplaced Books */}
            {auditResult.misplacedCopies.length > 0 && (
              <div className="discrepancy-card warning">
                <h4>⚠️ Misplaced Copies Detected on this Shelf ({auditResult.misplacedCopies.length})</h4>
                <p className="discrepancy-desc">These books were scanned here, but belong to another section.</p>
                <div className="discrepancy-table-wrap">
                  <table className="rfid-table">
                    <thead>
                      <tr>
                        <th>Accession No</th>
                        <th>Book Title</th>
                        <th>Correct Assigned Shelf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditResult.misplacedCopies.map((m, i) => (
                        <tr key={i}>
                          <td><code>{m.accessionNo}</code></td>
                          <td>{m.title}</td>
                          <td><span className="highlight-pill">{m.assignedShelf}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Missing Copies */}
            {auditResult.missingCopies.length > 0 && (
              <div className="discrepancy-card danger">
                <h4>❌ Missing Copies Unaccounted on Shelf ({auditResult.missingCopies.length})</h4>
                <p className="discrepancy-desc">Expected in this bay but not detected by RFID reader antenna.</p>
                <div className="discrepancy-table-wrap">
                  <table className="rfid-table">
                    <thead>
                      <tr>
                        <th>Accession No</th>
                        <th>Book Title</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditResult.missingCopies.map((c) => (
                        <tr key={c.id}>
                          <td><code>{c.accessionNo}</code></td>
                          <td>{c.title}</td>
                          <td><span className="status-tag danger">{c.status}</span></td>
                          <td>
                            <button
                              className="report-missing-btn"
                              onClick={() => setFeedback({ text: `Reported ${c.accessionNo} as missing. Flagged for floor sweep.`, type: "success" })}
                            >
                              🚩 Flag for Sweep
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Present Verified Copies */}
            <div className="discrepancy-card success">
              <h4>✅ Verified Present Copies ({auditResult.presentCopies.length})</h4>
              <div className="discrepancy-table-wrap">
                <table className="rfid-table">
                  <thead>
                    <tr>
                      <th>Accession No</th>
                      <th>Title</th>
                      <th>Condition</th>
                      <th>Status</th>
                      <th>Barcode Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditResult.presentCopies.map((c) => (
                      <tr key={c.id}>
                        <td><code>{c.accessionNo}</code></td>
                        <td>{c.title}</td>
                        <td>{c.condition}</td>
                        <td><span className="status-tag success">{c.status}</span></td>
                        <td>
                          <button
                            className="label-action-btn"
                            onClick={() => setActiveBarcodeModal({
                              title: c.title,
                              accessionNo: c.accessionNo,
                              barcode: `BC${c.accessionNo.replace(/[^0-9]/g, "").slice(-8)}-01`,
                              rfidTag: `E280116060${String(c.id).padStart(6, "0")}`,
                              shelf: auditResult.shelf
                            })}
                          >
                            🏷️ Sticker
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode/QR Modal */}
      {activeBarcodeModal && (
        <BarcodeQrModal
          isOpen={!!activeBarcodeModal}
          onClose={() => setActiveBarcodeModal(null)}
          data={activeBarcodeModal}
        />
      )}
    </div>
  );
};

export default LibrarianRfidAuditPage;
