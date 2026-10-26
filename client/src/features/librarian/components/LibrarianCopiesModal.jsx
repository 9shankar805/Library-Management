import React, { useState, useEffect } from "react";
import BarcodeQrModal from "../../../components/BarcodeQrModal";
import "../styles/LibrarianCopiesModal.css";

export default function LibrarianCopiesModal({ isOpen, onClose, book, onStockChanged }) {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shelves, setShelves] = useState([]);
  const [selectedBarcodeCopy, setSelectedBarcodeCopy] = useState(null);

  // Form states for new copy
  const [accessionNo, setAccessionNo] = useState("");
  const [barcode, setBarcode] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [shelfId, setShelfId] = useState("");
  const [addingCopy, setAddingCopy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCopies = async () => {
    if (!book) return;
    try {
      setLoading(true);
      const [copiesRes, shelfRes] = await Promise.all([
        fetch(`/api/books/${book.id}/copies`),
        fetch("/api/shelves"),
      ]);
      const [copiesData, shelfData] = await Promise.all([
        copiesRes.json(),
        shelfRes.json(),
      ]);

      if (copiesData.success) {
        setCopies(copiesData.copies || []);
      }
      if (shelfData.success) {
        setShelves(shelfData.shelves || []);
        if (shelfData.shelves.length > 0 && !shelfId) {
          setShelfId(shelfData.shelves[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading copies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && book) {
      loadCopies();
      const nextSeq = String(Math.floor(100 + Math.random() * 900));
      setAccessionNo(`ACC-2026-${String(book.id).padStart(4, "0")}-${nextSeq}`);
      setBarcode(`BC${book.isbn || book.id}-${nextSeq}`);
      setRfidTag(`E280116060${String(book.id).padStart(4, "0")}${nextSeq}`);
      setErrorMsg("");
    }
  }, [isOpen, book]);

  if (!isOpen || !book) return null;

  const handleAddCopy = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setAddingCopy(true);
    try {
      const res = await fetch(`/api/books/${book.id}/copies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessionNo: accessionNo.trim(),
          barcode: barcode.trim(),
          rfidTag: rfidTag.trim(),
          condition,
          shelfId: shelfId ? Number(shelfId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not register copy.");
      }
      await loadCopies();
      if (onStockChanged) onStockChanged();

      // Reset sequence
      const nextSeq = String(Math.floor(100 + Math.random() * 900));
      setAccessionNo(`ACC-2026-${String(book.id).padStart(4, "0")}-${nextSeq}`);
      setBarcode(`BC${book.isbn || book.id}-${nextSeq}`);
      setRfidTag(`E280116060${String(book.id).padStart(4, "0")}${nextSeq}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create physical copy record.");
    } finally {
      setAddingCopy(false);
    }
  };

  const handleStatusChange = async (copyId, newStatus) => {
    try {
      const res = await fetch(`/api/copies/${copyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await loadCopies();
        if (onStockChanged) onStockChanged();
      }
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  const handleConditionChange = async (copyId, newCondition) => {
    try {
      const res = await fetch(`/api/copies/${copyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition: newCondition }),
      });
      const data = await res.json();
      if (data.success) {
        await loadCopies();
      }
    } catch (e) {
      console.error("Condition update error:", e);
    }
  };

  return (
    <div className="copies-modal-backdrop" onClick={onClose}>
      <div className="copies-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="copies-modal-header">
          <div className="copies-modal-title-wrap">
            <span style={{ fontSize: "0.75rem", background: "#38bdf8", color: "#082f49", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
              PHYSICAL ACCESSION & COPIES
            </span>
            <h3>{book.title}</h3>
            <p className="copies-modal-sub">
              By {book.author} · ISBN: <code>{book.isbn}</code> · Total in DB: <strong>{copies.length} copies</strong>
            </p>
          </div>
          <button className="copies-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="copies-modal-body">
          {/* Add Copy Section */}
          <form className="copies-add-box" onSubmit={handleAddCopy}>
            <div className="copies-add-title">
              <span>➕ Register New Physical Copy</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "#64748b" }}>
                (Creates unique Accession ID, Barcode & RFID EPC)
              </span>
            </div>
            {errorMsg && (
              <div style={{ color: "#b91c1c", fontSize: "0.82rem", marginBottom: "8px" }}>
                ⚠️ {errorMsg}
              </div>
            )}
            <div className="copies-form-row">
              <div className="copies-input-group">
                <label>Accession No.</label>
                <input
                  type="text"
                  required
                  value={accessionNo}
                  onChange={(e) => setAccessionNo(e.target.value)}
                />
              </div>
              <div className="copies-input-group">
                <label>Barcode ID</label>
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
              <div className="copies-input-group">
                <label>RFID EPC Tag</label>
                <input
                  type="text"
                  required
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                />
              </div>
            </div>

            <div className="copies-form-row">
              <div className="copies-input-group">
                <label>Shelf Location</label>
                <select value={shelfId} onChange={(e) => setShelfId(e.target.value)}>
                  {shelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      Floor {s.floor} - {s.section} ({s.rackNumber}, {s.shelfTier})
                    </option>
                  ))}
                </select>
              </div>
              <div className="copies-input-group">
                <label>Physical Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="GOOD">Good / Mint</option>
                  <option value="FAIR">Fair / Readable</option>
                  <option value="WORN">Worn / Binding Loose</option>
                  <option value="DAMAGED">Damaged / Page Tear</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" className="copies-add-btn" disabled={addingCopy}>
                  {addingCopy ? "Saving..." : "Add Physical Copy"}
                </button>
              </div>
            </div>
          </form>

          {/* Copies Table */}
          <div className="copies-table-wrap">
            <table className="copies-table">
              <thead>
                <tr>
                  <th>Accession No.</th>
                  <th>Barcode</th>
                  <th>Shelf Location</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      Loading physical copies...
                    </td>
                  </tr>
                ) : copies.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      No physical copies registered yet. Add one above!
                    </td>
                  </tr>
                ) : (
                  copies.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.accessionNo}</strong>
                      </td>
                      <td>
                        <code>{c.barcode}</code>
                      </td>
                      <td>
                        {c.shelf
                          ? `Fl ${c.shelf.floor} · ${c.shelf.section} (${c.shelf.rackNumber})`
                          : "General Stack"}
                      </td>
                      <td>
                        <select
                          value={c.condition}
                          onChange={(e) => handleConditionChange(c.id, e.target.value)}
                          style={{ fontSize: "0.78rem", padding: "2px 6px", borderRadius: "4px" }}
                        >
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="WORN">Worn</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="LOST">Lost</option>
                        </select>
                      </td>
                      <td>
                        <span className={`copies-status-badge ${c.status}`}>{c.status}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="copies-action-btn"
                          onClick={() => setSelectedBarcodeCopy(c)}
                          title="Generate Barcode / QR Sticker"
                        >
                          🏷️ Sticker
                        </button>
                        {c.status === "AVAILABLE" && (
                          <button
                            type="button"
                            className="copies-action-btn"
                            style={{ color: "#b91c1c" }}
                            onClick={() => handleStatusChange(c.id, "LOST")}
                            title="Mark as Lost"
                          >
                            Mark Lost
                          </button>
                        )}
                        {c.status === "LOST" && (
                          <button
                            type="button"
                            className="copies-action-btn"
                            style={{ color: "#15803d" }}
                            onClick={() => handleStatusChange(c.id, "AVAILABLE")}
                            title="Recover Copy"
                          >
                            Recover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Barcode & QR Sticker Modal */}
      {selectedBarcodeCopy && (
        <BarcodeQrModal
          isOpen={Boolean(selectedBarcodeCopy)}
          data={{
            title: book.title,
            accessionNo: selectedBarcodeCopy.accessionNo,
            barcode: selectedBarcodeCopy.barcode,
            rfidTag: selectedBarcodeCopy.rfidTag,
          }}
          mode="view"
          onClose={() => setSelectedBarcodeCopy(null)}
        />
      )}
    </div>
  );
}
