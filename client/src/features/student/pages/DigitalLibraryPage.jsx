import React, { useState, useEffect } from "react";
import "../styles/DigitalLibraryPage.css";

const RESOURCE_TYPES = [
  { key: "ALL", label: "All Repository Resources" },
  { key: "EBOOK", label: "📖 E-Books" },
  { key: "NOTES", label: "📝 Lecture Notes" },
  { key: "THESIS", label: "🎓 Theses & Dissertations" },
  { key: "RESEARCH_PAPER", label: "📄 Research Papers" },
];

export default function DigitalLibraryPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [previewResource, setPreviewResource] = useState(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (activeType !== "ALL") query.set("type", activeType);
      if (departmentFilter !== "ALL") query.set("department", departmentFilter);
      if (searchTerm.trim()) query.set("search", searchTerm.trim());

      const res = await fetch(`/api/digital-resources?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (e) {
      console.error("Error loading digital resources:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [activeType, departmentFilter, searchTerm]);

  return (
    <div className="digital-page-container">
      <header className="digital-header">
        <span className="digital-badge">Digital Repository</span>
        <h1>NIT Andhra Digital Library</h1>
        <p>
          Open-access academic digital repository for curriculum textbooks, departmental lecture handouts, peer-reviewed research papers, and student M.Tech/Ph.D. dissertations.
        </p>
      </header>

      {/* Toolbar: Search, Type Tabs & Department Filter */}
      <div className="digital-toolbar">
        <div className="digital-type-tabs">
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`digital-tab-btn ${activeType === t.key ? "active" : ""}`}
              onClick={() => setActiveType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <div className="digital-search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search title, author, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              background: "#ffffff",
              outline: "none",
            }}
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science & Engineering</option>
            <option value="Electrical">Electrical Engineering</option>
            <option value="Mechanical">Mechanical Engineering</option>
            <option value="Electronics">Electronics & Communication</option>
            <option value="Mathematics">Mathematics & Sciences</option>
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
          <span style={{ fontSize: "2rem" }}>🔄</span>
          <p style={{ marginTop: "12px" }}>Loading repository documents...</p>
        </div>
      ) : resources.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "2.5rem" }}>📭</span>
          <h3 style={{ margin: "12px 0 6px", color: "#0f172a" }}>No digital resources found</h3>
          <p style={{ color: "#64748b", margin: 0 }}>Try clearing your search query or switching resource tabs.</p>
        </div>
      ) : (
        <div className="digital-grid">
          {resources.map((res) => (
            <article key={res.id} className="digital-card">
              <div>
                <div className="digital-card-top">
                  <span className={`digital-type-badge ${res.type}`}>{res.type.replace(/_/g, " ")}</span>
                  <span className="digital-size-pill">📦 {res.fileSize || "PDF"}</span>
                </div>
                <h3>{res.title}</h3>
                <p className="digital-author">By {res.author}</p>
                <p className="digital-desc">{res.description || "Digital curriculum copy available for student reference."}</p>
              </div>

              <div>
                <div className="digital-card-meta">
                  <span>🏛️ {res.department || "General"}</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ Access: {res.accessRole}</span>
                </div>
                <div className="digital-actions">
                  <button
                    type="button"
                    className="digital-btn secondary"
                    onClick={() => setPreviewResource(res)}
                  >
                    👁️ Document Info
                  </button>
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="digital-btn primary"
                  >
                    📥 Open / Read &rarr;
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Preview Info Modal */}
      {previewResource && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
          }}
          onClick={() => setPreviewResource(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className={`digital-type-badge ${previewResource.type}`}>{previewResource.type}</span>
                <h2 style={{ margin: "8px 0 4px", fontSize: "1.3rem", color: "#0f172a" }}>{previewResource.title}</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>By {previewResource.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.6, background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              {previewResource.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0", fontSize: "0.85rem" }}>
              <div>Department: <strong>{previewResource.department}</strong></div>
              <div>File Size: <strong>{previewResource.fileSize}</strong></div>
              <div>Access Tier: <strong>{previewResource.accessRole}</strong></div>
              <div>Uploaded By: <strong>{previewResource.uploadedBy}</strong></div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="digital-btn secondary"
                onClick={() => setPreviewResource(null)}
              >
                Close
              </button>
              <a
                href={previewResource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="digital-btn primary"
              >
                📥 Open Full Digital Document &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
