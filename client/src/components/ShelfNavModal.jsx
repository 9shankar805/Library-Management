import React, { useState } from "react";
import "../styles/ShelfNavModal.css";

const ShelfNavModal = ({ isOpen, onClose, book = {}, shelf = null }) => {
  if (!isOpen) return null;

  const targetShelf = shelf || book.shelf || (book.availabilities && book.availabilities[0]?.shelf) || {
    id: 11,
    building: "Central Library",
    floor: 1,
    section: "Section A (CS & IT)",
    rackNumber: "A1",
    shelfTier: "Tier 1",
    coordinatesX: 120,
    coordinatesY: 80
  };

  const initialFloor = targetShelf.floor || 1;
  const [selectedFloor, setSelectedFloor] = useState(initialFloor);

  // Floor layout metadata
  const floorData = {
    1: {
      name: "Floor 1 — CS, IT & Digital Commons",
      racks: [
        { id: "A1", x: 80, y: 70, label: "Rack A1: Software & Web", target: targetShelf.rackNumber === "A1" && targetShelf.floor === 1 },
        { id: "A2", x: 180, y: 70, label: "Rack A2: Algorithms & AI", target: targetShelf.rackNumber === "A2" && targetShelf.floor === 1 },
        { id: "A3", x: 280, y: 70, label: "Rack A3: Systems & Networks", target: targetShelf.rackNumber === "A3" && targetShelf.floor === 1 },
      ]
    },
    2: {
      name: "Floor 2 — Engineering & Technology",
      racks: [
        { id: "B1", x: 80, y: 70, label: "Rack B1: Mechanical Systems", target: targetShelf.rackNumber === "B1" && targetShelf.floor === 2 },
        { id: "B2", x: 180, y: 70, label: "Rack B2: Thermal & Fluids", target: targetShelf.rackNumber === "B2" && targetShelf.floor === 2 },
        { id: "C1", x: 280, y: 70, label: "Rack C1: Electrical & Signals", target: targetShelf.rackNumber === "C1" && targetShelf.floor === 2 },
        { id: "D1", x: 380, y: 70, label: "Rack D1: Civil & Structures", target: targetShelf.rackNumber === "D1" && targetShelf.floor === 2 },
      ]
    },
    3: {
      name: "Floor 3 — Applied Sciences & Humanities",
      racks: [
        { id: "E1", x: 80, y: 70, label: "Rack E1: Mathematics & Physics", target: targetShelf.rackNumber === "E1" && targetShelf.floor === 3 },
        { id: "F1", x: 180, y: 70, label: "Rack F1: Management Studies", target: targetShelf.rackNumber === "F1" && targetShelf.floor === 3 },
        { id: "G1", x: 280, y: 70, label: "Rack G1: Literature & Fiction", target: targetShelf.rackNumber === "G1" && targetShelf.floor === 3 },
      ]
    }
  };

  const currentFloorInfo = floorData[selectedFloor] || floorData[1];
  const isTargetOnCurrentFloor = targetShelf.floor === selectedFloor;

  return (
    <div className="shelf-modal-backdrop" onClick={onClose}>
      <div className="shelf-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="shelf-modal-header">
          <div>
            <span className="shelf-modal-tag">📍 INDOOR SHELF GPS NAVIGATION</span>
            <h3>{book.title || "Library Shelf Coordinate Navigator"}</h3>
            <p className="shelf-modal-sub">
              {book.author ? `By ${book.author} • ` : ""}ISBN: {book.isbn || "9780132350884"}
            </p>
          </div>
          <button className="shelf-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Floor selection tabs */}
        <div className="shelf-floor-tabs">
          {[1, 2, 3].map((floorNum) => (
            <button
              key={floorNum}
              className={`shelf-floor-btn ${selectedFloor === floorNum ? "active" : ""}`}
              onClick={() => setSelectedFloor(floorNum)}
            >
              Floor {floorNum} {targetShelf.floor === floorNum ? "📍 (Book Here)" : ""}
            </button>
          ))}
        </div>

        <div className="shelf-modal-body">
          {/* Target location callout card */}
          <div className="shelf-location-summary-card">
            <div className="loc-badge-grid">
              <div className="loc-pill">
                <span className="pill-label">Building</span>
                <span className="pill-val">{targetShelf.building || "Central Library"}</span>
              </div>
              <div className="loc-pill highlight">
                <span className="pill-label">Floor</span>
                <span className="pill-val">Floor {targetShelf.floor || 1}</span>
              </div>
              <div className="loc-pill">
                <span className="pill-label">Section</span>
                <span className="pill-val">{targetShelf.section || "Section A"}</span>
              </div>
              <div className="loc-pill highlight-accent">
                <span className="pill-label">Rack</span>
                <span className="pill-val">Rack {targetShelf.rackNumber || "A1"}</span>
              </div>
              <div className="loc-pill">
                <span className="pill-label">Shelf Tier</span>
                <span className="pill-val">{targetShelf.shelfTier || "Tier 1"}</span>
              </div>
            </div>

            <div className="walking-directions">
              <span className="dir-icon">🧭</span>
              <p>
                <strong>Wayfinding Guide:</strong> Enter via Main Lobby, take Stairs/Elevator to <strong>Floor {targetShelf.floor}</strong>, follow the central aisle to <strong>{targetShelf.section}</strong>. Locate <strong>Rack {targetShelf.rackNumber}</strong> at <strong>{targetShelf.shelfTier}</strong>.
              </p>
            </div>
          </div>

          {/* Floor SVG Map */}
          <div className="shelf-map-wrapper">
            <div className="map-legend">
              <span className="legend-item"><span className="legend-box current-target"></span> Target Rack</span>
              <span className="legend-item"><span className="legend-box available-rack"></span> Other Racks</span>
              <span className="legend-item"><span className="legend-box circulation-desk"></span> Information Desk</span>
            </div>

            <svg viewBox="0 0 520 280" className="shelf-svg-map">
              {/* Floor background */}
              <rect x="10" y="10" width="500" height="260" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />

              {/* Entrance & Help Desk */}
              <rect x="180" y="240" width="160" height="24" rx="4" fill="#0284c7" />
              <text x="260" y="256" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                MAIN ENTRANCE & INFO DESK
              </text>

              {/* Walking Aisle Guideline */}
              <line x1="260" y1="240" x2="260" y2="130" stroke="#38bdf8" strokeDasharray="4 4" strokeWidth="2" />

              {/* Racks for this floor */}
              {currentFloorInfo.racks.map((r) => {
                const isTarget = r.target;
                return (
                  <g key={r.id} className={`rack-group ${isTarget ? "is-target" : ""}`}>
                    {/* Rack Body */}
                    <rect
                      x={r.x}
                      y={r.y}
                      width="70"
                      height="46"
                      rx="6"
                      fill={isTarget ? "#0284c7" : "#1e293b"}
                      stroke={isTarget ? "#38bdf8" : "#475569"}
                      strokeWidth={isTarget ? "3" : "1.5"}
                      className={isTarget ? "pulsing-rack" : ""}
                    />

                    {/* Rack Label */}
                    <text
                      x={r.x + 35}
                      y={r.y + 24}
                      fill={isTarget ? "#ffffff" : "#94a3b8"}
                      fontSize="12"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {r.id}
                    </text>
                    <text
                      x={r.x + 35}
                      y={r.y + 38}
                      fill={isTarget ? "#bae6fd" : "#64748b"}
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {isTarget ? "YOU ARE HERE" : "Shelf"}
                    </text>

                    {/* Target Pin Marker */}
                    {isTarget && (
                      <g transform={`translate(${r.x + 25}, ${r.y - 18})`}>
                        <circle cx="10" cy="10" r="10" fill="#ef4444" />
                        <text x="10" y="14" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">📍</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Title banner */}
              <text x="30" y="38" fill="#94a3b8" fontSize="12" fontWeight="600">
                {currentFloorInfo.name}
              </text>

              {!isTargetOnCurrentFloor && (
                <g transform="translate(140, 140)">
                  <rect x="0" y="0" width="240" height="36" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="120" y="22" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">
                    ⚠️ Book is located on Floor {targetShelf.floor}. Switch tabs to view.
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfNavModal;
