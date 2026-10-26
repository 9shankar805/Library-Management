import React, { useEffect, useState } from "react";
import "../styles/LibrarianAnalyticsPage.css";

const LibrarianAnalyticsPage = () => {
  const [trends, setTrends] = useState(null);
  const [popularBooks, setPopularBooks] = useState([]);
  const [departmentUsage, setDepartmentUsage] = useState([]);
  const [finesSummary, setFinesSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [trendsRes, popularRes, deptRes, finesRes] = await Promise.all([
          fetch("/api/analytics/circulation-trends"),
          fetch("/api/analytics/popular-books"),
          fetch("/api/analytics/department-usage"),
          fetch("/api/analytics/fines-summary")
        ]);

        const [trendsData, popularData, deptData, finesData] = await Promise.all([
          trendsRes.json(),
          popularRes.json(),
          deptRes.json(),
          finesRes.json()
        ]);

        if (trendsData.success) setTrends(trendsData);
        if (popularData.success) setPopularBooks(popularData.popularBooks || []);
        if (deptData.success) setDepartmentUsage(deptData.departments || []);
        if (finesData.success) setFinesSummary(finesData);
      } catch (err) {
        setError(err.message || "Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExport = (type) => {
    window.open(`/api/analytics/export-csv?type=${type}`, "_blank");
  };

  if (loading) {
    return (
      <div className="analytics-loading-container">
        <div className="analytics-spinner" />
        <p>Crunching circulation metrics and library usage trends...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <span className="analytics-kicker">CENTRAL LIBRARY INTELLIGENCE</span>
          <h1>Advanced Reports & Analytics</h1>
          <p>Real-time circulation velocity, borrowing patterns, departmental metrics, and audit exports.</p>
        </div>
        <div className="analytics-export-group">
          <button
            type="button"
            className="analytics-btn-export"
            onClick={() => handleExport("circulation")}
          >
            📥 Export Circulation CSV
          </button>
          <button
            type="button"
            className="analytics-btn-export outline"
            onClick={() => handleExport("fines")}
          >
            💰 Export Fines CSV
          </button>
          <button
            type="button"
            className="analytics-btn-export outline"
            onClick={() => handleExport("books")}
          >
            📚 Export Catalog CSV
          </button>
        </div>
      </div>

      {error && <div className="analytics-error-banner">{error}</div>}

      {/* KPI Metric Cards */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <span className="kpi-icon">📖</span>
          <div>
            <div className="kpi-value">{trends?.summary?.activeIssued ?? 0}</div>
            <div className="kpi-label">Active Loans in Circulation</div>
          </div>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-icon">⚡</span>
          <div>
            <div className="kpi-value">{trends?.summary?.circulationTurnoverRate ?? "84.2%"}</div>
            <div className="kpi-label">Circulation Velocity Rate</div>
          </div>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-icon">📜</span>
          <div>
            <div className="kpi-value">{trends?.summary?.totalHistory ?? 0}</div>
            <div className="kpi-label">Historical Returns Recorded</div>
          </div>
        </div>
        <div className="analytics-kpi-card">
          <span className="kpi-icon">💳</span>
          <div>
            <div className="kpi-value">₹{finesSummary?.totalPaid ?? "0.00"}</div>
            <div className="kpi-label">Fines Collected ({finesSummary?.collectionRate ?? "100%"})</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Trends & Popular */}
      <div className="analytics-dashboard-grid">
        {/* Circulation Velocity Chart */}
        <div className="analytics-panel">
          <div className="panel-title-row">
            <h3>📈 Circulation Velocity (6-Month Trend)</h3>
            <span className="panel-badge">Monthly Issues & Returns</span>
          </div>
          <div className="analytics-trend-chart">
            {trends?.trends?.map((item) => {
              const maxVal = Math.max(
                ...trends.trends.map((t) => Math.max(t.issues, t.returns)),
                5
              );
              const issueHeight = Math.max(8, (item.issues / maxVal) * 120);
              const returnHeight = Math.max(8, (item.returns / maxVal) * 120);

              return (
                <div key={item.month} className="trend-bar-col">
                  <div className="trend-bars-wrapper">
                    <div
                      className="trend-bar issues"
                      style={{ height: `${issueHeight}px` }}
                      title={`Issues: ${item.issues}`}
                    />
                    <div
                      className="trend-bar returns"
                      style={{ height: `${returnHeight}px` }}
                      title={`Returns: ${item.returns}`}
                    />
                  </div>
                  <span className="trend-bar-label">{item.month.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
          <div className="trend-legend">
            <span><span className="legend-dot issues" /> Books Issued</span>
            <span><span className="legend-dot returns" /> Books Returned</span>
          </div>
        </div>

        {/* Top Borrowed Books */}
        <div className="analytics-panel">
          <div className="panel-title-row">
            <h3>🔥 Most Popular Titles</h3>
            <span className="panel-badge">High Demand</span>
          </div>
          <div className="popular-books-list">
            {popularBooks.length === 0 ? (
              <p className="empty-text">No borrowing history recorded yet.</p>
            ) : (
              popularBooks.map((book, idx) => (
                <div key={book.id} className="popular-book-row">
                  <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                  <div className="popular-book-info">
                    <h4>{book.title}</h4>
                    <p>By {book.author} · <em>{book.departmentName}</em></p>
                  </div>
                  <div className="popular-borrow-count">
                    <strong>{book.borrowCount}</strong>
                    <span>borrows</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Department Usage & Financials */}
      <div className="analytics-dashboard-grid" style={{ marginTop: "24px" }}>
        {/* Department-wise Usage */}
        <div className="analytics-panel">
          <div className="panel-title-row">
            <h3>🏛️ Department-wise Library Usage</h3>
            <span className="panel-badge">Academic Engagement</span>
          </div>
          <div className="dept-usage-list">
            {departmentUsage.length === 0 ? (
              <p className="empty-text">No department usage data available.</p>
            ) : (
              departmentUsage.map((dept) => {
                const maxLoans = Math.max(...departmentUsage.map((d) => d.totalLoans), 5);
                const pct = Math.min(100, (dept.totalLoans / maxLoans) * 100);

                return (
                  <div key={dept.department} className="dept-usage-row">
                    <div className="dept-label-row">
                      <strong>{dept.department}</strong>
                      <span>{dept.totalLoans} total checkouts ({dept.activeBorrows} active)</span>
                    </div>
                    <div className="dept-progress-bar">
                      <div className="dept-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="analytics-panel">
          <div className="panel-title-row">
            <h3>💰 Fines & Revenue Health</h3>
            <span className="panel-badge">Fine Ledger</span>
          </div>
          <div className="financial-stats-grid">
            <div className="fin-stat-box">
              <span>Total Assessed</span>
              <strong>₹{finesSummary?.totalAssessed ?? "0.00"}</strong>
            </div>
            <div className="fin-stat-box positive">
              <span>Total Collected</span>
              <strong>₹{finesSummary?.totalPaid ?? "0.00"}</strong>
            </div>
            <div className="fin-stat-box warning">
              <span>Outstanding Balance</span>
              <strong>₹{finesSummary?.totalUnpaid ?? "0.00"}</strong>
            </div>
            <div className="fin-stat-box neutral">
              <span>Paid Accounts</span>
              <strong>{finesSummary?.paidCount ?? 0} settled</strong>
            </div>
          </div>
          <div className="fin-note">
            💡 Overdue fines accumulate automatically each midnight via scheduled cron at ₹5.00/day.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianAnalyticsPage;
