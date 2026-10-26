import React, { useState, useEffect } from "react";
import "../styles/LibrarianJobsPage.css";

export default function LibrarianJobsPage() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobLogs, setJobLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [runningJob, setRunningJob] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const fetchJobLogs = async () => {
    try {
      setLoadingLogs(true);
      const [jobsRes, emailsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/notifications/emails/logs"),
      ]);
      const [jobsData, emailsData] = await Promise.all([
        jobsRes.json(),
        emailsRes.json(),
      ]);

      if (jobsData.success) {
        setJobLogs(jobsData.logs || []);
      }
      if (emailsData.success) {
        setEmailLogs(emailsData.logs || []);
      }
    } catch (e) {
      console.error("Error loading logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchJobLogs();
  }, []);

  const handleRunJob = async (jobKey, jobTitle) => {
    setRunningJob(jobKey);
    setActionNotice(null);
    try {
      const res = await fetch("/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobKey }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({
          type: "success",
          text: `Job "${jobTitle}" completed successfully! Processed records updated in database.`,
        });
        await fetchJobLogs();
      } else {
        throw new Error(data.message || "Failed to execute job.");
      }
    } catch (err) {
      setActionNotice({ type: "error", text: err.message });
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="jobs-page-container">
      <header className="jobs-header">
        <span className="jobs-badge">Automation & Engine</span>
        <h2>Scheduled Background Jobs & Email Center</h2>
        <p>
          Automated cron daemon execution, due-date reminders, overdue fine calculations, 48-hour reservation expiry, waitlist promotion, and outbound digital receipts.
        </p>
      </header>

      {actionNotice && (
        <div
          style={{
            padding: "12px 18px",
            marginBottom: "24px",
            borderRadius: "10px",
            background: actionNotice.type === "success" ? "#dcfce7" : "#fee2e2",
            color: actionNotice.type === "success" ? "#166534" : "#991b1b",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {actionNotice.type === "success" ? "✓" : "⚠️"} {actionNotice.text}
        </div>
      )}

      {/* Triggerable Jobs Grid */}
      <div className="jobs-grid">
        <div className="job-card">
          <div>
            <div className="job-card-top">
              <div className="job-icon-box">📅</div>
              <span className="job-status-pill ACTIVE">Active (Cron)</span>
            </div>
            <h3>Due-Date Reminders</h3>
            <p>
              Scans active loans due in 1 to 3 days. Automatically dispatches polite warning emails and in-app alert badges to students before loans expire.
            </p>
            <div className="job-meta-row">
              <span><strong>Schedule:</strong> Daily at 08:00 AM</span>
              <span><strong>Channel:</strong> Email + In-App</span>
            </div>
          </div>
          <button
            type="button"
            className="job-run-btn"
            disabled={runningJob !== null}
            onClick={() => handleRunJob("due_reminders", "Due-Date Reminders")}
          >
            {runningJob === "due_reminders" ? "Executing..." : "⚡ Run Reminder Pass Now"}
          </button>
        </div>

        <div className="job-card">
          <div>
            <div className="job-card-top">
              <div className="job-icon-box">⚠️</div>
              <span className="job-status-pill ACTIVE">Active (Cron)</span>
            </div>
            <h3>Overdue Fines Engine</h3>
            <p>
              Scans unreturned loans past due date. Computes accumulated daily fines (@ ₹5/day), updates fine ledgers, and dispatches urgent overdue notices.
            </p>
            <div className="job-meta-row">
              <span><strong>Schedule:</strong> Midnight (00:00 AM)</span>
              <span><strong>Channel:</strong> Email + In-App</span>
            </div>
          </div>
          <button
            type="button"
            className="job-run-btn"
            disabled={runningJob !== null}
            onClick={() => handleRunJob("overdue_fines", "Overdue Fines Engine")}
          >
            {runningJob === "overdue_fines" ? "Executing..." : "⚡ Run Overdue Calculation Now"}
          </button>
        </div>

        <div className="job-card">
          <div>
            <div className="job-card-top">
              <div className="job-icon-box">🎉</div>
              <span className="job-status-pill ACTIVE">Active (Cron)</span>
            </div>
            <h3>48h Reservation Expiry & Waitlist</h3>
            <p>
              Checks unclaimed reservation hold tokens past 48 hours. Auto-cancels expired holds and immediately promotes the next student in the FIFO queue!
            </p>
            <div className="job-meta-row">
              <span><strong>Schedule:</strong> Every 30 Minutes</span>
              <span><strong>Policy:</strong> FIFO Queue Window</span>
            </div>
          </div>
          <button
            type="button"
            className="job-run-btn"
            disabled={runningJob !== null}
            onClick={() => handleRunJob("reservation_expiry", "Reservation Expiry & Waitlist")}
          >
            {runningJob === "reservation_expiry" ? "Executing..." : "⚡ Run Waitlist Promotion Now"}
          </button>
        </div>
      </div>

      {/* Execution Logs Card */}
      <div className="jobs-logs-card">
        <div className="jobs-tabs-bar">
          <button
            type="button"
            className={`jobs-tab ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            📋 Background Job Execution Logs ({jobLogs.length})
          </button>
          <button
            type="button"
            className={`jobs-tab ${activeTab === "emails" ? "active" : ""}`}
            onClick={() => setActiveTab("emails")}
          >
            📧 Outbound Email Dispatch Audit ({emailLogs.length})
          </button>
        </div>

        <div className="jobs-table-wrap">
          {activeTab === "jobs" ? (
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Job Name</th>
                  <th>Status</th>
                  <th>Processed Count</th>
                  <th>Details & Summary</th>
                  <th>Execution Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      Loading execution history...
                    </td>
                  </tr>
                ) : jobLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No background job runs recorded yet. Click one of the buttons above to trigger a run!
                    </td>
                  </tr>
                ) : (
                  jobLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <strong>{log.jobName}</strong>
                      </td>
                      <td>
                        <span className={`log-status-badge ${log.status}`}>{log.status}</span>
                      </td>
                      <td>
                        <strong>{log.processedCount}</strong> items
                      </td>
                      <td style={{ color: "#475569" }}>{log.details || "Completed without errors."}</td>
                      <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: "0.8rem" }}>
                        {new Date(log.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Recipient Email</th>
                  <th>Email Type</th>
                  <th>Subject Line</th>
                  <th>Delivery Channel</th>
                  <th>Dispatched At</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No outbound emails logged in this session yet. Run a reminder pass or issue/return a book!
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((mail) => (
                    <tr key={mail.id}>
                      <td>
                        <strong>{mail.to}</strong>
                      </td>
                      <td>
                        <span className="log-status-badge SUCCESS">{mail.type}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>{mail.subject}</td>
                      <td>
                        <code style={{ fontSize: "0.78rem" }}>{mail.deliveryChannel}</code>
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: "0.8rem" }}>
                        {new Date(mail.dispatchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
