import React from "react";
import { Route } from "react-router-dom";
import LibrarianDashboard from "../features/librarian/pages/LibrarianDashboard";
import LibrarianReservationsPage from "../features/librarian/pages/LibrarianReservationsPage";
import LibrarianVerifyTokenPage from "../features/librarian/pages/LibrarianVerifyTokenPage";
import LibrarianIssueBookPage from "../features/librarian/pages/LibrarianIssueBookPage";
import LibrarianUpdateStockPage from "../features/librarian/pages/LibrarianUpdateStockPage";
import LibrarianRfidAuditPage from "../features/librarian/pages/LibrarianRfidAuditPage";
import LibrarianShelfMapPage from "../features/librarian/pages/LibrarianShelfMapPage";
import LibrarianJobsPage from "../features/librarian/pages/LibrarianJobsPage";
import LibrarianAnalyticsPage from "../features/librarian/pages/LibrarianAnalyticsPage";
import LibrarianAuditSessionsPage from "../features/librarian/pages/LibrarianAuditSessionsPage";
import LibrarianProcurementPage from "../features/librarian/pages/LibrarianProcurementPage";
import LibrarianAuditLogsPage from "../features/librarian/pages/LibrarianAuditLogsPage";
import LibrarianMembersPage from "../features/librarian/pages/LibrarianMembersPage";
import LibrarianFinesPage from "../features/librarian/pages/LibrarianFinesPage";
import LibrarianSettingsPage from "../features/librarian/pages/LibrarianSettingsPage";
import LibrarianSystemHealthPage from "../features/librarian/pages/LibrarianSystemHealthPage";
import LibrarianAiAssistantPage from "../features/librarian/pages/LibrarianAiAssistantPage";
import LibrarianRecommendationsPage from "../features/librarian/pages/LibrarianRecommendationsPage";
import LibrarianRolesPage from "../features/librarian/pages/LibrarianRolesPage";

export const getLibrarianRoutes = (user) => [
  <Route
    key="librarian-dashboard"
    path="/librarian-dashboard"
    element={<LibrarianDashboard user={user} />}
  />,
  <Route
    key="librarian-reservations"
    path="/librarian/reservations"
    element={<LibrarianReservationsPage />}
  />,
  <Route
    key="librarian-verify-token"
    path="/librarian/verify-token"
    element={<LibrarianVerifyTokenPage />}
  />,
  <Route
    key="librarian-issue-book"
    path="/librarian/issue-book"
    element={<LibrarianIssueBookPage />}
  />,
  <Route
    key="librarian-update-stock"
    path="/librarian/update-stock"
    element={<LibrarianUpdateStockPage />}
  />,
  <Route
    key="librarian-rfid-audit"
    path="/librarian/rfid-audit"
    element={<LibrarianRfidAuditPage />}
  />,
  <Route
    key="librarian-shelf-map"
    path="/librarian/shelf-map"
    element={<LibrarianShelfMapPage />}
  />,
  <Route
    key="librarian-jobs"
    path="/librarian/jobs"
    element={<LibrarianJobsPage />}
  />,
  <Route
    key="librarian-analytics"
    path="/librarian/analytics"
    element={<LibrarianAnalyticsPage />}
  />,
  <Route
    key="librarian-inventory-audit"
    path="/librarian/inventory-audit"
    element={<LibrarianAuditSessionsPage />}
  />,
  <Route
    key="librarian-procurement"
    path="/librarian/procurement"
    element={<LibrarianProcurementPage />}
  />,
  <Route
    key="librarian-audit-logs"
    path="/librarian/audit-logs"
    element={<LibrarianAuditLogsPage />}
  />,
  <Route
    key="librarian-members"
    path="/librarian/members"
    element={<LibrarianMembersPage />}
  />,
  <Route
    key="librarian-fines"
    path="/librarian/fines"
    element={<LibrarianFinesPage />}
  />,
  <Route
    key="librarian-settings"
    path="/librarian/settings"
    element={<LibrarianSettingsPage />}
  />,
  <Route
    key="librarian-system-health"
    path="/librarian/system-health"
    element={<LibrarianSystemHealthPage />}
  />,
  <Route
    key="librarian-ai-assistant"
    path="/librarian/ai-assistant"
    element={<LibrarianAiAssistantPage />}
  />,
  <Route
    key="librarian-recommendations"
    path="/librarian/recommendations"
    element={<LibrarianRecommendationsPage />}
  />,
  <Route
    key="librarian-roles"
    path="/librarian/roles"
    element={<LibrarianRolesPage />}
  />,
];

export default getLibrarianRoutes;
