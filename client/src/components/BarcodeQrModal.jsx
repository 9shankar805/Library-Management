import React, { useState } from "react";
import "../styles/BarcodeQrModal.css";

/**
 * Deterministic pseudo-barcode pattern generator from string
 */
function generateBarcodePattern(text) {
  if (!text) text = "00000000";
  const bars = [];
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) % 1000007;
  }

  // Generate 48 bars with varying widths (1 to 4px)
  let rng = seed;
  for (let i = 0; i < 48; i++) {
    rng = (rng * 16807) % 2147483647;
    const width = 1 + (rng % 3);
    const isBlack = (i % 2 === 0);
    bars.push({ width, isBlack });
  }
  return bars;
}

/**
 * Deterministic 21x21 QR matrix generator from string
 */
function generateQrMatrix(text) {
  if (!text) text = "ACCESSION";
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  // Function to place 7x7 Finder patterns
  const placeFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[r0 + r][c0 + c] = true;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data fill simulation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 37 + text.charCodeAt(i)) % 999983;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      hash = (hash * 16807 + r * 13 + c) % 2147483647;
      matrix[r][c] = (hash % 3 === 0);
    }
  }

  return matrix;
}

const BarcodeQrModal = ({
  isOpen,
  onClose,
  data = {},
  mode = "view", // "view" | "scan"
  onScanComplete
}) => {
  const [activeTab, setActiveTab] = useState(mode === "scan" ? "scanner" : "barcode");
  const [manualInput, setManualInput] = useState("");
  const [scanStatus, setScanStatus] = useState("");

  if (!isOpen) return null;

  const title = data.title || "Book Title";
  const accessionNo = data.accessionNo || "ACC-2026-0101-01";
  const barcodeValue = data.barcode || "BC32350884-01";
  const rfidTag = data.rfidTag || "E280116060010101";
  const rollNo = data.rollNo || "";
  const displayCode = rollNo ? `STUDENT-${rollNo}` : accessionNo;

  const barcodeBars = generateBarcodePattern(barcodeValue);
  const qrMatrix = generateQrMatrix(displayCode);

  const handleSimulatedScan = (scannedText) => {
    setScanStatus(`Scanned: ${scannedText}`);
    setTimeout(() => {
      if (onScanComplete) {
        onScanComplete(scannedText);
      }
      onClose();
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="barcode-modal-backdrop" onClick={onClose}>
      <div className="barcode-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="barcode-modal-header">
          <div className="barcode-modal-title-wrap">
            <span className="barcode-modal-badge">
              {activeTab === "scanner" ? "📷 SCANNER" : "🏷️ PHYSICAL IDENTITY"}
            </span>
            <h3>{title}</h3>
            <p className="barcode-modal-sub">
              Accession: <strong>{accessionNo}</strong> | RFID: <code>{rfidTag}</code>
            </p>
          </div>
          <button className="barcode-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="barcode-modal-tabs">
          <button
            className={`barcode-tab-btn ${activeTab === "barcode" ? "active" : ""}`}
            onClick={() => setActiveTab("barcode")}
          >
            Barcode (Code-128)
          </button>
          <button
            className={`barcode-tab-btn ${activeTab === "qr" ? "active" : ""}`}
            onClick={() => setActiveTab("qr")}
          >
            QR Code Matrix
          </button>
          <button
            className={`barcode-tab-btn ${activeTab === "rfid" ? "active" : ""}`}
            onClick={() => setActiveTab("rfid")}
          >
            RFID Tag Data
          </button>
          <button
            className={`barcode-tab-btn scanner-tab-btn ${activeTab === "scanner" ? "active" : ""}`}
            onClick={() => setActiveTab("scanner")}
          >
            📷 Barcode Scanner
          </button>
        </div>

        <div className="barcode-modal-body">
          {activeTab === "barcode" && (
            <div className="barcode-view-pane">
              <div className="barcode-sticker">
                <div className="barcode-sticker-header">
                  <span>CENTRAL LIBRARY • NIT AP</span>
                  <span>{data.shelf ? `${data.shelf.section} / ${data.shelf.rackNumber}` : "PHYSICAL STOCK"}</span>
                </div>

                <div className="barcode-svg-container">
                  <svg width="280" height="80" viewBox="0 0 280 80" className="barcode-svg">
                    <rect width="280" height="80" fill="#ffffff" />
                    <g transform="translate(15, 8)">
                      {barcodeBars.reduce((acc, bar, idx) => {
                        const prevX = acc.currentX;
                        acc.currentX += bar.width * 2;
                        if (bar.isBlack) {
                          acc.elements.push(
                            <rect
                              key={idx}
                              x={prevX}
                              y="0"
                              width={bar.width * 2}
                              height="64"
                              fill="#111827"
                            />
                          );
                        }
                        return acc;
                      }, { currentX: 0, elements: [] }).elements}
                    </g>
                  </svg>
                  <p className="barcode-digits">*{barcodeValue}*</p>
                </div>

                <div className="barcode-sticker-footer">
                  <span>ACC: {accessionNo}</span>
                  <span>{data.condition || "Condition: Good"}</span>
                </div>
              </div>

              <div className="barcode-action-row">
                <button className="barcode-btn-secondary" onClick={() => navigator.clipboard.writeText(barcodeValue)}>
                  📋 Copy Barcode
                </button>
                <button className="barcode-btn-primary" onClick={handlePrint}>
                  🖨️ Print Label Sticker
                </button>
              </div>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="qr-view-pane">
              <div className="qr-card">
                <div className="qr-svg-wrapper">
                  <svg viewBox="0 0 21 21" width="180" height="180" className="qr-svg">
                    <rect width="21" height="21" fill="#ffffff" />
                    {qrMatrix.map((row, r) =>
                      row.map((cell, c) =>
                        cell ? (
                          <rect
                            key={`${r}-${c}`}
                            x={c}
                            y={r}
                            width="1"
                            height="1"
                            fill="#0f172a"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
                <div className="qr-info">
                  <h4>Digital Accession QR</h4>
                  <p className="qr-payload">{displayCode}</p>
                  <span className="qr-tip">Scan using student mobile app for instant shelf checkout</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rfid" && (
            <div className="rfid-view-pane">
              <div className="rfid-chip-card">
                <div className="rfid-antenna-icon">📡</div>
                <div className="rfid-chip-details">
                  <h4>ISO/IEC 18000-6C Gen2 EPC</h4>
                  <div className="rfid-field">
                    <label>EPC Memory (Hex):</label>
                    <code>{rfidTag}</code>
                  </div>
                  <div className="rfid-field">
                    <label>Frequency Band:</label>
                    <span>UHF 860 - 960 MHz</span>
                  </div>
                  <div className="rfid-field">
                    <label>Assigned Shelf Coordinate:</label>
                    <span>{data.shelf ? `${data.shelf.section} • Rack ${data.shelf.rackNumber} • ${data.shelf.shelfTier}` : "Pending Placement"}</span>
                  </div>
                  <div className="rfid-field">
                    <label>Security Gate Status:</label>
                    <span className={`rfid-status-badge ${data.status === "ISSUED" ? "unlocked" : "locked"}`}>
                      {data.status === "ISSUED" ? "🟢 Check-out Cleared (Alarm Bypass)" : "🔒 Library Armed (Alarm Active)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scanner" && (
            <div className="scanner-view-pane">
              <div className="scanner-camera-viewport">
                <div className="scanner-laser-line"></div>
                <div className="scanner-reticle">
                  <span className="reticle-tl"></span>
                  <span className="reticle-tr"></span>
                  <span className="reticle-bl"></span>
                  <span className="reticle-br"></span>
                </div>
                <p className="scanner-camera-label">Point camera or laser scanner at book barcode</p>
              </div>

              {scanStatus && (
                <div className="scanner-status-toast">{scanStatus}</div>
              )}

              <div className="scanner-quick-simulate">
                <p className="simulate-label">⚡ Fast Sample Barcode Simulation (One-Click):</p>
                <div className="simulate-pills">
                  <button
                    type="button"
                    className="sim-pill"
                    onClick={() => handleSimulatedScan(barcodeValue)}
                  >
                    Current Copy ({barcodeValue})
                  </button>
                  <button
                    type="button"
                    className="sim-pill"
                    onClick={() => handleSimulatedScan("21CS001")}
                  >
                    Student ID: 21CS001
                  </button>
                  <button
                    type="button"
                    className="sim-pill"
                    onClick={() => handleSimulatedScan("BC32350884-02")}
                  >
                    Copy #2 (BC32350884-02)
                  </button>
                </div>
              </div>

              <div className="scanner-manual-row">
                <input
                  type="text"
                  placeholder="Or enter barcode / accession manually..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="scanner-manual-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualInput.trim()) {
                      handleSimulatedScan(manualInput.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  className="barcode-btn-primary"
                  onClick={() => {
                    if (manualInput.trim()) {
                      handleSimulatedScan(manualInput.trim());
                    }
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeQrModal;
