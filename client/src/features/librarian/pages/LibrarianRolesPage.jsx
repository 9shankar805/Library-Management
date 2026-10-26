import React, { useState } from "react";
import {
  ShieldCheck,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  Lock,
  UserCheck
} from "lucide-react";
import "../styles/LibrarianRolesPage.css";

const PERMISSION_MATRIX = [
  { module: "Book Catalog & Copy Tracking", admin: true, librarian: true, assistant: true, student: "Read Only" },
  { module: "Physical Shelf & Wayfinding", admin: true, librarian: true, assistant: true, student: "View Only" },
  { module: "Barcode & RFID Circulation Desk", admin: true, librarian: true, assistant: true, student: false },
  { module: "Issue, Return & Renewals", admin: true, librarian: true, assistant: true, student: false },
  { module: "Smart Reservations & Waitlists", admin: true, librarian: true, assistant: true, student: "Self Only" },
  { module: "Student & Member Directory", admin: true, librarian: true, assistant: false, student: false },
  { module: "Fines Assessment & Collection", admin: true, librarian: true, assistant: false, student: "Pay Own" },
  { module: "Digital Library Repository", admin: true, librarian: true, assistant: true, student: true },
  { module: "AI Assistant & Recommendations", admin: true, librarian: true, assistant: true, student: true },
  { module: "Circulation Reports & CSV Export", admin: true, librarian: true, assistant: false, student: false },
  { module: "Physical Stock Audits & Write-Offs", admin: true, librarian: true, assistant: true, student: false },
  { module: "Acquisition & Procurement Approval", admin: true, librarian: true, assistant: false, student: "Request Only" },
  { module: "Immutable Audit Trail Records", admin: true, librarian: true, assistant: false, student: false },
  { module: "System Health & DB Backups", admin: true, librarian: false, assistant: false, student: false }
];

const LibrarianRolesPage = () => {
  return (
    <div className="roles-page">
      {/* Header */}
      <div className="roles-header">
        <div>
          <span className="roles-kicker">GOVERNANCE & ACCESS CONTROL</span>
          <h1>Multi-Level Access Control (4-Tier RBAC)</h1>
          <p>Role-based authorization policies, credential boundaries, and institutional privilege matrix.</p>
        </div>
      </div>

      {/* Role Tier Cards */}
      <div className="role-tiers-grid">
        <div className="role-tier-card admin">
          <div className="tier-header">
            <span className="tier-badge admin">Tier 1</span>
            <h3>Super Administrator</h3>
          </div>
          <p>Full system superuser. Manages database backups, server telemetry, system health, and role delegation.</p>
          <div className="tier-perm-list">
            <span>✓ Complete DB & Server Administration</span>
            <span>✓ Global Audit Log Inspection</span>
            <span>✓ Disaster Recovery & Backup Execution</span>
          </div>
        </div>

        <div className="role-tier-card librarian">
          <div className="tier-header">
            <span className="tier-badge librarian">Tier 2</span>
            <h3>Chief Librarian</h3>
          </div>
          <p>Full catalog administration, stock updates, fine collections, acquisition approvals, and staff oversight.</p>
          <div className="tier-perm-list">
            <span>✓ Book Catalog & Copy Status Management</span>
            <span>✓ Procurement Order Authorizations</span>
            <span>✓ Financial Ledger & Fine Settlements</span>
          </div>
        </div>

        <div className="role-tier-card assistant">
          <div className="tier-header">
            <span className="tier-badge assistant">Tier 3</span>
            <h3>Library Assistant</h3>
          </div>
          <p>Front-desk circulation operations, barcode/RFID scanning, shelf verification, and check-in/out.</p>
          <div className="tier-perm-list">
            <span>✓ Fast Issue, Return & Renewal Desk</span>
            <span>✓ Shelf Map Location Verification</span>
            <span>✓ Stock Audit Physical Scanning</span>
          </div>
        </div>

        <div className="role-tier-card student">
          <div className="tier-header">
            <span className="tier-badge student">Tier 4</span>
            <h3>Student / Member</h3>
          </div>
          <p>Personal library portal for catalog searching, reservations, digital e-books, and acquisition recommendations.</p>
          <div className="tier-perm-list">
            <span>✓ Multi-Facet Catalog Search</span>
            <span>✓ 48-Hour Waitlist Reservations</span>
            <span>✓ Digital Library PDF Access</span>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="perm-matrix-card">
        <div className="matrix-card-header">
          <Lock size={18} />
          <h3>Institutional Privilege Matrix</h3>
        </div>
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Functional Module</th>
              <th>Administrator</th>
              <th>Chief Librarian</th>
              <th>Library Assistant</th>
              <th>Student Member</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{row.module}</strong>
                </td>
                <td>
                  <span className="perm-yes">
                    <CheckCircle2 size={16} /> Full
                  </span>
                </td>
                <td>
                  {row.librarian ? (
                    <span className="perm-yes">
                      <CheckCircle2 size={16} /> Authorized
                    </span>
                  ) : (
                    <span className="perm-no">
                      <XCircle size={16} /> Restricted
                    </span>
                  )}
                </td>
                <td>
                  {row.assistant ? (
                    <span className="perm-yes">
                      <CheckCircle2 size={16} /> Allowed
                    </span>
                  ) : (
                    <span className="perm-no">
                      <XCircle size={16} /> Restricted
                    </span>
                  )}
                </td>
                <td>
                  {row.student === true ? (
                    <span className="perm-yes">
                      <CheckCircle2 size={16} /> Permitted
                    </span>
                  ) : row.student === false ? (
                    <span className="perm-no">
                      <XCircle size={16} /> No Access
                    </span>
                  ) : (
                    <span className="perm-limited">{row.student}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LibrarianRolesPage;
