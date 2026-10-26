import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  BookOpen,
  Wallet,
  Calendar,
  GraduationCap,
  Mail,
  Shield,
  X,
  RefreshCw,
  CheckCircle2,
  Clock
} from "lucide-react";
import "../styles/LibrarianMembersPage.css";

const LibrarianMembersPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenMember = async (student) => {
    setSelectedMember(student);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/students/${student.rollNo}`);
      const data = await res.json();
      if (data.success) {
        setMemberDetail(data.student);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const departments = Array.from(new Set(students.map((s) => s.department))).filter(Boolean);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchQuery =
      s.rollNo.toLowerCase().includes(q) ||
      s.user?.username?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);
    const matchDept = deptFilter === "ALL" || s.department === deptFilter;
    return matchQuery && matchDept;
  });

  return (
    <div className="members-page">
      {/* Page Header */}
      <div className="members-header">
        <div>
          <span className="members-kicker">MEMBERSHIP DIRECTORY</span>
          <h1>Students & Library Members</h1>
          <p>Institutional student registry, active circulation quotas, borrowing limits, and account history.</p>
        </div>
        <button type="button" className="members-btn-refresh" onClick={loadStudents}>
          <RefreshCw size={15} /> Refresh Directory
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="members-metrics-grid">
        <div className="members-metric-card">
          <div className="metric-icon-box indigo">
            <Users size={20} />
          </div>
          <div>
            <div className="metric-val">{students.length}</div>
            <div className="metric-label">Registered Members</div>
          </div>
        </div>
        <div className="members-metric-card">
          <div className="metric-icon-box green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="metric-val">{students.length}</div>
            <div className="metric-label">Active Good Standing</div>
          </div>
        </div>
        <div className="members-metric-card">
          <div className="metric-icon-box amber">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="metric-val">
              {students.reduce((sum, s) => sum + (s._count?.issuedBooks || 0), 0)}
            </div>
            <div className="metric-label">Total Active Loans</div>
          </div>
        </div>
        <div className="members-metric-card">
          <div className="metric-icon-box blue">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="metric-val">{departments.length}</div>
            <div className="metric-label">Academic Departments</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="members-toolbar">
        <div className="members-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Search by student name, roll number, or institutional email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="members-dept-select">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="members-table-card">
        <table className="members-table">
          <thead>
            <tr>
              <th>Member / Roll No</th>
              <th>Department</th>
              <th>Year</th>
              <th>Current Loans</th>
              <th>Reservations</th>
              <th>Fines</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px" }}>
                  <div className="members-spinner" />
                  <p style={{ marginTop: "12px", color: "#68738A", fontSize: "0.85rem" }}>
                    Loading member accounts...
                  </p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#68738A" }}>
                  No members matched your search and filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.rollNo}>
                  <td>
                    <div className="member-name-cell">
                      <div className="member-avatar">
                        {(s.user?.username || s.rollNo).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{s.user?.username || "Student"}</strong>
                        <span className="member-roll">{s.rollNo}</span>
                      </div>
                    </div>
                  </td>
                  <td>{s.department}</td>
                  <td>
                    <span className="year-pill">Year {s.yearOfStudy}</span>
                  </td>
                  <td>
                    <span className={`loan-count-badge ${s._count?.issuedBooks > 0 ? "active" : ""}`}>
                      {s._count?.issuedBooks || 0} / 3 books
                    </span>
                  </td>
                  <td>{s._count?.reservations || 0}</td>
                  <td>
                    {s._count?.fines > 0 ? (
                      <span className="fine-warning-pill">Pending Fine</span>
                    ) : (
                      <span className="fine-clean-pill">₹0.00</span>
                    )}
                  </td>
                  <td>
                    <span className="status-pill active">Active</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-member-details"
                      onClick={() => handleOpenMember(s)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="member-modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="member-modal-header">
              <div className="modal-title-row">
                <div className="member-modal-avatar">
                  {(selectedMember.user?.username || selectedMember.rollNo).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedMember.user?.username || "Student Account"}</h2>
                  <span>Roll Number: <strong>{selectedMember.rollNo}</strong> · {selectedMember.department}</span>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedMember(null)}>
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#68738A" }}>
                Loading circulation and borrowing records...
              </div>
            ) : (
              <div className="member-modal-content">
                {/* Profile Grid */}
                <div className="modal-info-grid">
                  <div className="info-box">
                    <Mail size={16} />
                    <div>
                      <span>Email</span>
                      <strong>{selectedMember.email}</strong>
                    </div>
                  </div>
                  <div className="info-box">
                    <GraduationCap size={16} />
                    <div>
                      <span>Year of Study</span>
                      <strong>Year {selectedMember.yearOfStudy}</strong>
                    </div>
                  </div>
                  <div className="info-box">
                    <BookOpen size={16} />
                    <div>
                      <span>Active Borrowed Books</span>
                      <strong>{memberDetail?.issuedBooks?.length || 0} of 3 allowed</strong>
                    </div>
                  </div>
                  <div className="info-box">
                    <Shield size={16} />
                    <div>
                      <span>Account Status</span>
                      <strong style={{ color: "#16845B" }}>Verified Good Standing</strong>
                    </div>
                  </div>
                </div>

                {/* Active Loans Section */}
                <div className="modal-section">
                  <h3>Currently Issued Books ({memberDetail?.issuedBooks?.length || 0})</h3>
                  {memberDetail?.issuedBooks?.length === 0 ? (
                    <p className="modal-empty-note">No active books currently borrowed.</p>
                  ) : (
                    <div className="modal-books-list">
                      {memberDetail?.issuedBooks?.map((loan) => (
                        <div key={loan.id} className="modal-book-row">
                          <BookOpen size={18} className="loan-book-icon" />
                          <div className="loan-book-details">
                            <strong>{loan.book?.title}</strong>
                            <span>By {loan.book?.author} · ISBN {loan.book?.isbn}</span>
                          </div>
                          <div className="loan-due-box">
                            <Clock size={14} />
                            <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Borrowing History */}
                <div className="modal-section">
                  <h3>Borrowing History ({memberDetail?.borrowHistories?.length || 0} past returns)</h3>
                  {memberDetail?.borrowHistories?.length === 0 ? (
                    <p className="modal-empty-note">No past returns recorded yet.</p>
                  ) : (
                    <div className="modal-history-list">
                      {memberDetail?.borrowHistories?.slice(0, 5).map((hist) => (
                        <div key={hist.id} className="modal-history-item">
                          <span>{hist.book?.title}</span>
                          <span className="history-date">
                            Returned {new Date(hist.returnDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianMembersPage;
