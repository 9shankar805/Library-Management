import React, { useState, useEffect } from "react";
import "../styles/LibrarianRfidAuditPage.css";

const LibrarianShelfMapPage = () => {
  const [mapData, setMapData] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMap();
  }, []);

  const fetchMap = async () => {
    try {
      const res = await fetch("/api/shelves/map");
      const data = await res.json();
      if (data.success && data.floors) {
        setMapData(data.floors);
        const floorKey = `Floor 1`;
        if (data.floors[floorKey]?.shelves?.length > 0) {
          setSelectedShelf(data.floors[floorKey].shelves[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching map:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentFloorKey = `Floor ${selectedFloor}`;
  const currentFloorShelves = mapData ? (mapData[currentFloorKey]?.shelves || []) : [];

  return (
    <div className="rfid-audit-page-container">
      <div className="rfid-header-banner">
        <div>
          <span className="rfid-badge">🗺️ PHYSICAL INFRASTRUCTURE</span>
          <h2>Central Library Interactive Shelf & Floor Map</h2>
          <p>Real-time physical coordinate mapping across all 3 floors and 10 shelf sections.</p>
        </div>
      </div>

      {/* Floor selection tabs */}
      <div className="shelf-floor-tabs" style={{ borderRadius: "12px 12px 0 0", marginBottom: 0 }}>
        {[1, 2, 3].map((f) => (
          <button
            key={f}
            className={`shelf-floor-btn ${selectedFloor === f ? "active" : ""}`}
            onClick={() => {
              setSelectedFloor(f);
              const key = `Floor ${f}`;
              if (mapData && mapData[key]?.shelves?.length > 0) {
                setSelectedShelf(mapData[key].shelves[0]);
              }
            }}
          >
            Floor {f} Layout
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", background: "#ffffff", padding: "1.5rem", borderRadius: "0 0 16px 16px", border: "1px solid #e2e8f0" }}>
        {/* SVG Interactive Floor Plan */}
        <div style={{ background: "#0b1120", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            <span>🏛️ Central Library — Floor {selectedFloor} Blueprint</span>
            <span>Click any rack to inspect contents</span>
          </div>

          <svg viewBox="0 0 540 300" style={{ width: "100%", height: "auto" }}>
            {/* Building boundary */}
            <rect x="10" y="10" width="520" height="280" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />

            {/* Entrance & Help Desk */}
            <rect x="190" y="250" width="160" height="28" rx="6" fill="#0284c7" />
            <text x="270" y="268" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
              MAIN FLOORWAY ENTRANCE
            </text>

            {/* Walking guideline */}
            <line x1="270" y1="250" x2="270" y2="140" stroke="#38bdf8" strokeDasharray="4 4" strokeWidth="2" />

            {/* Shelves on this floor */}
            {currentFloorShelves.map((s, idx) => {
              const xPos = 50 + (idx * 115);
              const yPos = 80;
              const isSelected = selectedShelf?.id === s.id;

              return (
                <g
                  key={s.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedShelf(s)}
                >
                  <rect
                    x={xPos}
                    y={yPos}
                    width="95"
                    height="60"
                    rx="8"
                    fill={isSelected ? "#0284c7" : "#1e293b"}
                    stroke={isSelected ? "#38bdf8" : "#475569"}
                    strokeWidth={isSelected ? "3" : "1.5"}
                  />
                  <text
                    x={xPos + 47}
                    y={yPos + 26}
                    fill={isSelected ? "#ffffff" : "#f1f5f9"}
                    fontSize="13"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    Rack {s.rackNumber}
                  </text>
                  <text
                    x={xPos + 47}
                    y={yPos + 44}
                    fill={isSelected ? "#bae6fd" : "#94a3b8"}
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {s.totalCopies} copies
                  </text>

                  {isSelected && (
                    <circle cx={xPos + 47} cy={yPos - 10} r="6" fill="#ef4444" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Shelf Details Panel */}
        {selectedShelf && (
          <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0284c7", textTransform: "uppercase" }}>
              Active Shelf Selected
            </span>
            <h3 style={{ margin: "0.25rem 0 0.75rem 0", fontSize: "1.2rem", color: "#0f172a" }}>
              Rack {selectedShelf.rackNumber}
            </h3>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#475569" }}>
              {selectedShelf.section} • {selectedShelf.shelfTier}
            </p>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ flex: 1, background: "#ffffff", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>TOTAL STOCK</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>{selectedShelf.totalCopies}</div>
              </div>
              <div style={{ flex: 1, background: "#ffffff", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.7rem", color: "#16a34a" }}>AVAILABLE</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#16a34a" }}>{selectedShelf.availableCopies}</div>
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "0.5rem" }}>
              Titles in this Rack:
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.82rem", color: "#475569", lineHeight: 1.5, maxHeight: "180px", overflowY: "auto" }}>
              {selectedShelf.titlesStored?.map((t, i) => (
                <li key={i} style={{ marginBottom: "0.25rem" }}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianShelfMapPage;
