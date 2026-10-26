import React, { useEffect, useState } from "react";
import "../styles/LibrarianProcurementPage.css";

const LibrarianProcurementPage = () => {
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionData, setActionData] = useState({
    status: "APPROVED",
    supplier: "Pearson Academic Education",
    budgetCode: "BUD-CSE-26",
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, budgetRes, supRes] = await Promise.all([
        fetch(`/api/procurement/requests${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`),
        fetch("/api/procurement/budgets"),
        fetch("/api/procurement/suppliers")
      ]);

      const [reqData, budgetData, supData] = await Promise.all([
        reqRes.json(),
        budgetRes.json(),
        supRes.json()
      ]);

      if (reqData.success) setRequests(reqData.requests || []);
      if (budgetData.success) setBudgets(budgetData.budgets || []);
      if (supData.success) setSuppliers(supData.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      const res = await fetch(`/api/procurement/requests/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedReq(null);
        await loadData();
      }
    } catch (err) {
      alert("Failed to update procurement request: " + err.message);
    }
  };

  return (
    <div className="procurement-page">
      {/* Header */}
      <div className="procurement-header">
        <div>
          <span className="procurement-kicker">ACQUISITION & PROCUREMENT</span>
          <h1>Book Acquisition & Budget Cockpit</h1>
          <p>Review student and faculty purchase requests, track departmental budgets, and manage supplier orders.</p>
        </div>
        <div className="procurement-tabs-nav">
          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            📋 Purchase Requests ({requests.length})
          </button>
          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "budgets" ? "active" : ""}`}
            onClick={() => setActiveTab("budgets")}
          >
            💳 Department Budgets
          </button>
          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "suppliers" ? "active" : ""}`}
            onClick={() => setActiveTab("suppliers")}
          >
            🏢 Approved Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Main Tab 1: Requests */}
      {activeTab === "requests" && (
        <div className="procurement-content-block">
          {/* Status Filter */}
          <div className="procurement-filters-row">
            <span>Filter Status:</span>
            {["ALL", "PENDING", "APPROVED", "ORDERED", "RECEIVED", "REJECTED"].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-chip ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="procurement-table-wrapper">
            <table className="procurement-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Title & Author</th>
                  <th>Department</th>
                  <th>Est. Cost</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Supplier / Budget</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "28px" }}>
                      No purchase requests found matching status "{statusFilter}".
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td><strong>#{r.id}</strong></td>
                      <td>
                        <div className="book-cell-title">{r.title}</div>
                        <div className="book-cell-meta">By {r.author} {r.isbn ? `· ISBN ${r.isbn}` : ""}</div>
                      </td>
                      <td>{r.department || "General"}</td>
                      <td><strong>₹{r.estimatedPrice ?? "1,200"}</strong></td>
                      <td>
                        <div>{r.requestedBy}</div>
                        <span className="role-tag-mini">{r.requesterRole}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                          {r.supplier || "—"}
                        </div>
                        {r.budgetCode && <span className="budget-tag">{r.budgetCode}</span>}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-proc-action"
                          onClick={() => {
                            setSelectedReq(r);
                            setActionData({
                              status: r.status === "PENDING" ? "APPROVED" : r.status,
                              supplier: r.supplier || "Pearson Academic Education",
                              budgetCode: r.budgetCode || "BUD-CSE-26",
                              notes: r.notes || ""
                            });
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Tab 2: Budgets */}
      {activeTab === "budgets" && (
        <div className="procurement-content-block">
          <div className="budgets-grid">
            {budgets.map((b) => (
              <div key={b.department} className="budget-card">
                <div className="budget-card-header">
                  <h3>{b.department}</h3>
                  <span className="budget-code-pill">{b.budgetCode}</span>
                </div>
                <div className="budget-card-metrics">
                  <div>
                    <span>Total Allocated</span>
                    <strong>₹{b.totalBudget.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Spent to Date</span>
                    <strong style={{ color: "#0284c7" }}>₹{b.spent.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Remaining Balance</span>
                    <strong style={{ color: "#16a34a" }}>₹{b.remaining.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="budget-progress-container">
                  <div className="progress-labels">
                    <span>Budget Utilized</span>
                    <strong>{b.utilization}</strong>
                  </div>
                  <div className="budget-bar">
                    <div className="budget-bar-fill" style={{ width: b.utilization }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab 3: Suppliers */}
      {activeTab === "suppliers" && (
        <div className="procurement-content-block">
          <div className="suppliers-grid">
            {suppliers.map((s) => (
              <div key={s.id} className="supplier-card">
                <div className="supplier-header">
                  <h3>{s.name}</h3>
                  <span className="rating-pill">⭐ {s.rating}</span>
                </div>
                <div className="supplier-meta">
                  <p>📧 {s.email}</p>
                  <p>📞 {s.phone}</p>
                  <p>⏱️ Average Delivery: <strong>{s.leadTime}</strong></p>
                </div>
                <div className="supplier-footer">
                  <span className="verified-supplier-tag">✓ Approved Academic Publisher</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage / Update Status Modal */}
      {selectedReq && (
        <div className="proc-modal-backdrop" onClick={() => setSelectedReq(null)}>
          <div className="proc-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="proc-modal-header">
              <h3>Manage Purchase Request #{selectedReq.id}</h3>
              <button type="button" onClick={() => setSelectedReq(null)}>×</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="proc-modal-body">
              <div className="req-summary-callout">
                <strong>{selectedReq.title}</strong>
                <p>By {selectedReq.author} · Est: ₹{selectedReq.estimatedPrice}</p>
              </div>

              <label>
                <span>Update Lifecycle Status</span>
                <select
                  value={actionData.status}
                  onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED (Authorized by Librarian)</option>
                  <option value="ORDERED">ORDERED (PO dispatched to vendor)</option>
                  <option value="RECEIVED">RECEIVED (Accessioned into physical stacks)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>

              <label>
                <span>Vendor / Supplier</span>
                <select
                  value={actionData.supplier}
                  onChange={(e) => setActionData({ ...actionData, supplier: e.target.value })}
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>{sup.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Department Budget Code</span>
                <input
                  type="text"
                  value={actionData.budgetCode}
                  onChange={(e) => setActionData({ ...actionData, budgetCode: e.target.value })}
                />
              </label>

              <label>
                <span>Notes & Remarks</span>
                <textarea
                  rows={2}
                  value={actionData.notes}
                  onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                />
              </label>

              <div className="proc-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setSelectedReq(null)}>
                  Cancel
                </button>
                <button type="submit" className="audit-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianProcurementPage;
