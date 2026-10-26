import React, { useState, useEffect } from "react";
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Search,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  FileDown
} from "lucide-react";
import "../styles/LibrarianFinesPage.css";

const LibrarianFinesPage = () => {
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [collectModalFine, setCollectModalFine] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const loadFines = async () => {
    setLoading(true);
    try {
      const [finesRes, sumRes] = await Promise.all([
        fetch("/api/fines"),
        fetch("/api/analytics/fines-summary")
      ]);

      const [finesData, sumData] = await Promise.all([
        finesRes.json(),
        sumRes.json()
      ]);

      if (finesData.success) setFines(finesData.fines || []);
      if (sumData.success) setSummary(sumData);
    } catch (err) {
      console.error("Failed to load fines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFines();
  }, []);

  const handlePayFine = async (e) => {
    e.preventDefault();
    if (!collectModalFine) return;

    setPaymentSubmitting(true);
    try {
      const res = await fetch(`/api/fines/${collectModalFine.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: collectModalFine.amount,
          paymentMethod,
          transactionId: `TXN-${Date.now().toString().slice(-8)}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setReceiptData({
          fineId: collectModalFine.id,
          studentId: collectModalFine.studentId,
          amount: collectModalFine.amount,
          method: paymentMethod,
          date: new Date().toLocaleString(),
          bookTitle: collectModalFine.issuedBook?.book?.title || "Library Loan"
        });
        setCollectModalFine(null);
        await loadFines();
      } else {
        alert(data.message || "Payment recording failed.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const filteredFines = fines.filter((f) => {
    const isPaid = f.isPaid || f.status === "PAID";
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && isPaid) ||
      (statusFilter === "UNPAID" && !isPaid);

    const q = search.toLowerCase();
    const matchSearch =
      f.studentId?.toLowerCase().includes(q) ||
      f.issuedBook?.book?.title?.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  return (
    <div className="fines-page">
      {/* Header */}
      <div className="fines-header">
        <div>
          <span className="fines-kicker">FINANCIAL DESK</span>
          <h1>Fines & Fee Management</h1>
          <p>Overdue assessment ledger, settlement transactions, fee waivers, and digital cash receipts.</p>
        </div>
        <button
          type="button"
          className="btn-export-fines"
          onClick={() => window.open("/api/analytics/export-csv?type=fines", "_blank")}
        >
          <FileDown size={16} /> Export Fines CSV
        </button>
      </div>

      {/* Financial Health Tiles */}
      <div className="fines-kpi-grid">
        <div className="fines-kpi-card">
          <div className="fines-kpi-icon amber">
            <Wallet size={20} />
          </div>
          <div>
            <div className="fines-kpi-val">₹{summary?.totalAssessed ?? "0.00"}</div>
            <div className="fines-kpi-label">Total Overdue Assessed</div>
          </div>
        </div>
        <div className="fines-kpi-card">
          <div className="fines-kpi-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="fines-kpi-val">₹{summary?.totalPaid ?? "0.00"}</div>
            <div className="fines-kpi-label">Fines Collected ({summary?.collectionRate ?? "100%"})</div>
          </div>
        </div>
        <div className="fines-kpi-card">
          <div className="fines-kpi-icon red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="fines-kpi-val">₹{summary?.totalUnpaid ?? "0.00"}</div>
            <div className="fines-kpi-label">Outstanding Balance</div>
          </div>
        </div>
        <div className="fines-kpi-card">
          <div className="fines-kpi-icon indigo">
            <Receipt size={20} />
          </div>
          <div>
            <div className="fines-kpi-val">{summary?.paidCount ?? 0} settled</div>
            <div className="fines-kpi-label">Accounts Fully Cleared</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="fines-toolbar">
        <div className="fines-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Search by student roll number or book title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="fines-filter-chips">
          {["ALL", "UNPAID", "PAID"].map((st) => (
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
      </div>

      {/* Fines Table */}
      <div className="fines-table-card">
        <table className="fines-table">
          <thead>
            <tr>
              <th>Fine ID</th>
              <th>Student Roll No</th>
              <th>Book Title / Loan</th>
              <th>Overdue Days</th>
              <th>Assessed Amount</th>
              <th>Status</th>
              <th>Date Assessed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px" }}>
                  <div className="fines-spinner" />
                  <p style={{ marginTop: "12px", color: "#68738A", fontSize: "0.85rem" }}>
                    Loading financial records...
                  </p>
                </td>
              </tr>
            ) : filteredFines.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#68738A" }}>
                  No fine records found for current filter.
                </td>
              </tr>
            ) : (
              filteredFines.map((f) => {
                const isPaid = f.isPaid || f.status === "PAID";
                return (
                  <tr key={f.id}>
                    <td><strong>#{f.id}</strong></td>
                    <td>
                      <div className="student-cell">
                        <strong>{f.studentId}</strong>
                        <span>{f.student?.user?.username || "Student"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="book-cell">
                        {f.issuedBook?.book?.title || "Overdue Loan Record"}
                      </div>
                    </td>
                    <td>
                      <span className="overdue-days-tag">
                        {Math.max(1, Math.round(Number(f.amount) / 5))} days
                      </span>
                    </td>
                    <td>
                      <strong className="amount-text">₹{Number(f.amount).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`fine-status-badge ${isPaid ? "paid" : "unpaid"}`}>
                        {isPaid ? "PAID" : "UNPAID"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.78rem", color: "#68738A" }}>
                        {new Date(f.issueDate || f.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      {isPaid ? (
                        <button
                          type="button"
                          className="btn-print-receipt"
                          onClick={() => setReceiptData({
                            fineId: f.id,
                            studentId: f.studentId,
                            amount: f.amount,
                            method: f.payments?.[0]?.paymentMethod || "ONLINE",
                            date: new Date(f.updatedAt || f.createdAt).toLocaleString(),
                            bookTitle: f.issuedBook?.book?.title || "Library Loan"
                          })}
                        >
                          <Receipt size={14} /> Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-collect-fine"
                          onClick={() => setCollectModalFine(f)}
                        >
                          Collect ₹{Number(f.amount).toFixed(2)}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Collect Payment Modal */}
      {collectModalFine && (
        <div className="fines-modal-backdrop" onClick={() => setCollectModalFine(null)}>
          <div className="fines-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fines-modal-header">
              <h3>Collect Overdue Fine</h3>
              <button type="button" onClick={() => setCollectModalFine(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePayFine} className="fines-modal-body">
              <div className="fine-payment-callout">
                <div>
                  <span className="callout-label">Student Roll No</span>
                  <strong>{collectModalFine.studentId}</strong>
                </div>
                <div>
                  <span className="callout-label">Due Fine</span>
                  <strong className="callout-amount">₹{Number(collectModalFine.amount).toFixed(2)}</strong>
                </div>
              </div>

              <div className="payment-method-selector">
                <span className="selector-title">Select Payment Mode:</span>
                <div className="method-options">
                  <label className={`method-card ${paymentMethod === "CASH" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="CASH"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                    />
                    <Banknote size={20} />
                    <span>Cash Desk</span>
                  </label>
                  <label className={`method-card ${paymentMethod === "UPI" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="UPI"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                    />
                    <Smartphone size={20} />
                    <span>UPI / QR</span>
                  </label>
                  <label className={`method-card ${paymentMethod === "CARD" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="CARD"
                      checked={paymentMethod === "CARD"}
                      onChange={() => setPaymentMethod("CARD")}
                    />
                    <CreditCard size={20} />
                    <span>Card / POS</span>
                  </label>
                </div>
              </div>

              <div className="fines-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCollectModalFine(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm-payment"
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? "Settling..." : `Confirm Payment of ₹${Number(collectModalFine.amount).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {receiptData && (
        <div className="fines-modal-backdrop" onClick={() => setReceiptData(null)}>
          <div className="fines-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <Receipt size={32} className="receipt-logo" />
              <h3>CENTRAL LIBRARY RECEIPT</h3>
              <span>Official Institutional Fee Voucher</span>
            </div>
            <div className="receipt-divider" />
            <div className="receipt-details-list">
              <div className="receipt-row">
                <span>Receipt / Fine No:</span>
                <strong>#REC-2026-{receiptData.fineId}</strong>
              </div>
              <div className="receipt-row">
                <span>Student Roll No:</span>
                <strong>{receiptData.studentId}</strong>
              </div>
              <div className="receipt-row">
                <span>Item Reference:</span>
                <strong>{receiptData.bookTitle}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Mode:</span>
                <strong>{receiptData.method}</strong>
              </div>
              <div className="receipt-row">
                <span>Transaction Date:</span>
                <strong>{receiptData.date}</strong>
              </div>
              <div className="receipt-divider" />
              <div className="receipt-total-row">
                <span>Total Amount Paid:</span>
                <strong className="receipt-total">₹{Number(receiptData.amount).toFixed(2)}</strong>
              </div>
            </div>
            <div className="receipt-stamp">
              ✓ PAYMENT VERIFIED & SETTLED
            </div>
            <div className="receipt-actions">
              <button
                type="button"
                className="btn-confirm-payment"
                onClick={() => {
                  window.print();
                }}
              >
                Print Receipt
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setReceiptData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianFinesPage;
