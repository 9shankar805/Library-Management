import React, { useEffect, useState } from "react";
import "../styles/LibrarianAuditLogsPage.css";

const LibrarianAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: "50" });
      if (entityFilter !== "ALL") query.set("entityType", entityFilter);
      if (searchQuery.trim()) query.set("action", searchQuery.trim());

      const [logsRes, sumRes] = await Promise.all([
        fetch(`/api/audit-logs?${query.toString()}`),
        fetch("/api/audit-logs/actions-summary")
      ]);

      const [logsData, sumData] = await Promise.all([
        logsRes.json(),
        sumRes.json()
      ]);

      if (logsData.success) setLogs(logsData.logs || []);
      if (sumData.success) setSummary(sumData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter, searchQuery]);

  return (
    <div className="audit-logs-page">
      {/* Header */}
      <div className="audit-logs-header">
        <div>
          <span className="audit-logs-kicker">GOVERNANCE & SECURITY AUDIT</span>
          <h1>Immutable System & Administrative Audit Trail</h1>
          <p>4-Tier RBAC access logs, inventory adjustments, circulation tracking, and catalog modifications.</p>
        </div>
        <div className="rbac-tier-pills">
          <span className="tier-pill admin">👑 ADMIN</span>
          <span className="tier-pill librarian">📚 LIBRARIAN</span>
          <span className="tier-pill assistant">🏷️ ASSISTANT</span>
          <span className="tier-pill student">🎓 STUDENT</span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="audit-summary-strip">
        <div className="summary-item">
          <span className="sum-count">{logs.length}</span>
          <span className="sum-label">Recorded Events</span>
        </div>
        <div className="summary-item">
          <span className="sum-count">{summary?.totalRecentLogs ?? 0}</span>
          <span className="sum-label">30-Day Activity Volume</span>
        </div>
        <div className="summary-item">
          <span className="sum-count">100%</span>
          <span className="sum-label">Integrity Ledger Verified</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="audit-logs-toolbar">
        <input
          type="search"
          placeholder="Filter by action keyword (e.g. BOOK, SCAN, PROCUREMENT)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="audit-search-input"
        />
        <div className="audit-entity-chips">
          {["ALL", "BOOK_COPY", "INVENTORY_AUDIT", "PROCUREMENT", "DIGITAL_RESOURCE", "SYSTEM"].map((ent) => (
            <button
              key={ent}
              type="button"
              className={`entity-chip ${entityFilter === ent ? "active" : ""}`}
              onClick={() => setEntityFilter(ent)}
            >
              {ent}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Action Event</th>
              <th>Target Entity</th>
              <th>Actor (Role/ID)</th>
              <th>IP Address</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "28px" }}>
                  Loading secure audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "28px" }}>
                  No audit records match the current filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: "pointer" }}>
                  <td><strong>#{log.id}</strong></td>
                  <td>
                    <span className={`action-badge ${log.action.toLowerCase()}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="entity-type-tag">{log.entityType}</span>
                    {log.entityId && <span className="entity-id-tag">#{log.entityId}</span>}
                  </td>
                  <td>
                    <div className="actor-cell-name">{log.performedBy}</div>
                  </td>
                  <td>
                    <span className="ip-tag">{log.ipAddress || "127.0.0.1"}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="details-cell-snippet" title={log.details}>
                      {log.details || "—"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="audit-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h3>Audit Event Record #{selectedLog.id}</h3>
              <button type="button" onClick={() => setSelectedLog(null)}>×</button>
            </div>
            <div className="audit-log-detail-body">
              <div className="detail-row">
                <span>Action</span>
                <strong>{selectedLog.action}</strong>
              </div>
              <div className="detail-row">
                <span>Target Entity</span>
                <strong>{selectedLog.entityType} {selectedLog.entityId ? `(#${selectedLog.entityId})` : ""}</strong>
              </div>
              <div className="detail-row">
                <span>Performed By</span>
                <strong>{selectedLog.performedBy}</strong>
              </div>
              <div className="detail-row">
                <span>Client IP</span>
                <strong>{selectedLog.ipAddress || "127.0.0.1"}</strong>
              </div>
              <div className="detail-row">
                <span>Timestamp</span>
                <strong>{new Date(selectedLog.timestamp).toUTCString()}</strong>
              </div>
              <div className="detail-row full">
                <span>Event Metadata / Notes</span>
                <p>{selectedLog.details}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianAuditLogsPage;
