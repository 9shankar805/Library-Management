import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import StudentNavbar from "../components/StudentNavbar";
import AiLibraryAssistant from "../../../components/AiLibraryAssistant";
import { dummyStudentUser } from "../data/studentData";
import "../styles/StudentDashboard.css";

/*
|--------------------------------------------------------------------------
| TEMPORARY DASHBOARD DATA
|--------------------------------------------------------------------------
| This data is only for the UI prototype.
| Later, these values will come from the backend API.
*/

const formatReservationToken = (token) => {
  if (token === null || token === undefined || token === "") return "";
  const numericToken = String(token).replace(/^TOK-/i, "");
  return `TOK-${numericToken}`;
};

const normalizeReservation = (reservation) => ({
  id: reservation.id,
  token: formatReservationToken(reservation.token),
  book: {
    ...reservation.book,
    category: reservation.book?.category?.name || reservation.book?.category || "Reserved title",
    copies: 1,
  },
  bookedOn: reservation.reservedDate,
  reservedDate: reservation.reservedDate,
  expiresAt: reservation.expiresAt,
  remainingMs: reservation.remainingMs,
  formattedRemaining: reservation.formattedRemaining,
  queuePosition: reservation.queuePosition,
  status: reservation.status?.status || "Reserved",
  isExpired: reservation.isExpired || false,
});

const StudentDashboard = ({ user, onLogout }) => {
  /*
  |--------------------------------------------------------------------------
  | EXISTING STUDENT MODULE STATE
  |--------------------------------------------------------------------------
  | These are kept because other student routes may currently depend on them.
  | We can move catalogue-specific logic into its own page later.
  */

  const [searchTerm, setSearchTerm] = useState("");
  const [profileUserUpdates, setProfileUserUpdates] = useState({});
  const [issuanceNoticeBook, setIssuanceNoticeBook] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsError, setRequestsError] = useState("");
  const [requestingBookId, setRequestingBookId] = useState(null);
  const [catalogBooks, setCatalogBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ borrowed: 0, overdue: 0, pendingFine: 0, finePaid: 0 });
  const [reservationQuota, setReservationQuota] = useState({ totalUsedToday: 0, totalDailyLimit: 5, totalRemainingToday: 0 });
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("title");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/discovery/recommendations?studentId=21CS001")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.recommendations)) {
          setRecommendedBooks(data.recommendations);
        }
      })
      .catch((err) => console.error("Error loading recommendations:", err));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CURRENT USER
  |--------------------------------------------------------------------------
  */

  const storedUser = (() => {
    try {
      const stored = localStorage.getItem("libraryUser");

      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })();

  const currentUser = {
    ...dummyStudentUser,
    ...storedUser,
    ...user,
    ...profileUserUpdates,
  };

  const loadReservationQuota = async (studentId) => {
    if (!studentId) return;

    try {
      const quotaResponse = await fetch(`/api/reservations/quota/${encodeURIComponent(studentId)}`);
      const quotaData = await quotaResponse.json();

      if (!quotaResponse.ok) {
        throw new Error(quotaData.message || "Could not load reservation quota.");
      }

      const quota = quotaData.quota || {};
      setReservationQuota({
        totalUsedToday: Number(quota.totalUsedToday || 0),
        totalDailyLimit: Number(quota.totalDailyLimit || 5),
        totalRemainingToday: Number(quota.totalRemainingToday || 0),
      });
    } catch (quotaError) {
      setRequestsError((prev) => prev || quotaError.message);
    }
  };

  useEffect(() => {
    const rollNo = currentUser.roll_no || currentUser.rollNo;
    if (!rollNo) return;

    const loadReservations = async () => {
      try {
        await fetch("/api/reservations/check-expired", { method: "POST" });
      } catch (expiryError) {
        console.warn("Reservation expiry check failed:", expiryError);
      }

      try {
        const response = await fetch(`/api/reservations?studentId=${encodeURIComponent(rollNo)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load your reservations.");
        setRequests((data.reservations || []).map(normalizeReservation));
      } catch (loadError) {
        setRequestsError(loadError.message);
      }

      await loadReservationQuota(rollNo);
    };

    loadReservations();
    const refreshTimer = window.setInterval(loadReservations, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [currentUser.rollNo, currentUser.roll_no]);

  useEffect(() => {
    const rollNo = currentUser.roll_no || currentUser.rollNo;
    if (!rollNo) return;

    const loadStudentSummary = async () => {
      try {
        const response = await fetch(`/api/students/${encodeURIComponent(rollNo)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load your library summary.");

        const issuedBooks = data.student.issuedBooks || [];
        const fines = data.student.fines || [];
        const now = Date.now();
        setBorrowedBooks(issuedBooks.map((issuedBook) => ({
          id: issuedBook.id,
          title: issuedBook.book?.title || "Book unavailable",
          author: issuedBook.book?.author || "Unknown author",
          copies: 1,
          issueDate: new Date(issuedBook.issueDate).toLocaleDateString(),
          dueDate: new Date(issuedBook.dueDate).toLocaleDateString(),
        })));
        setDashboardStats({
          borrowed: issuedBooks.length,
          overdue: issuedBooks.filter((issuedBook) => new Date(issuedBook.dueDate).getTime() < now).length,
          pendingFine: fines.filter((fine) => !fine.isPaid).reduce((total, fine) => total + Number(fine.amount), 0),
          finePaid: fines.filter((fine) => fine.isPaid).reduce((total, fine) => total + Number(fine.amount), 0),
        });
      } catch (loadError) {
        setRequestsError(loadError.message);
      }
    };

    loadStudentSummary();
  }, [currentUser.rollNo, currentUser.roll_no]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/books?limit=8&sortBy=title&order=asc");
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load the library catalog.");
        setCatalogBooks(data.books || []);
      } catch (loadError) {
        setRequestsError(loadError.message);
      }
    };

    loadCatalog();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DEPARTMENT BOOK DATA
  |--------------------------------------------------------------------------
  | Kept for the existing student catalogue routes.
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | EXISTING BOOK SEARCH / FILTER / SORT
  |--------------------------------------------------------------------------
  */

  const filteredBooks = catalogBooks.filter((book) =>
    `${book.title} ${book.author} ${book.category?.name || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const categories = [
    "All",
    ...new Set(filteredBooks.map((book) => book.category?.name || "Uncategorized")),
  ];

  const visibleBooks = useMemo(
    () =>
      filteredBooks
        .filter(
          (book) =>
            category === "All" || (book.category?.name || "Uncategorized") === category,
        )
        .sort((firstBook, secondBook) =>
          (sortBy === "category" ? firstBook.category?.name || "" : firstBook[sortBy])
            .localeCompare(sortBy === "category" ? secondBook.category?.name || "" : secondBook[sortBy]),
        ),
    [category, filteredBooks, sortBy],
  );

  /*
  |--------------------------------------------------------------------------
  | REQUEST BOOK
  |--------------------------------------------------------------------------
  */

  const requestBook = async (book) => {
    const rollNo = currentUser.roll_no || currentUser.rollNo;

    if (!rollNo) {
      setRequestsError("Your student roll number is not available. Please sign in again.");
      return;
    }
    if (reservationQuota.totalRemainingToday <= 0) {
      setRequestsError("Daily reservation limit reached. You can make up to 5 requests per day.");
      return;
    }
    if (requestingBookId === book.id) return;

    setRequestingBookId(book.id);
    setRequestsError("");
    try {
      const response = await fetch("/api/reservations", {
        body: JSON.stringify({ studentId: rollNo, bookId: book.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) await loadReservationQuota(rollNo);
        throw new Error(data.message || "Could not reserve this book.");
      }

      const reservation = normalizeReservation(data.reservation);
      setRequests((current) => [...current, reservation]);
      setReservationQuota((current) => ({
        ...current,
        totalUsedToday: current.totalUsedToday + 1,
        totalRemainingToday: Math.max(0, current.totalRemainingToday - 1),
      }));
      setRequestsError("");
      setIssuanceNoticeBook({ book, token: formatReservationToken(data.token || reservation.token) });
      await loadReservationQuota(rollNo);
    } catch (requestError) {
      setRequestsError(requestError.message);
    } finally {
      setRequestingBookId(null);
    }
  };

  const cancelReservation = async (reservationId) => {
    const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
      method: "PATCH",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not cancel the reservation.");

    const rollNo = currentUser.roll_no || currentUser.rollNo;
    setRequests((current) => current.map((request) => (
      request.id === reservationId
        ? { ...request, status: data.reservation?.status?.status || "Cancelled" }
        : request
    )));

    if (rollNo) {
      await loadReservationQuota(rollNo);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CHECK WHETHER CURRENT ROUTE IS DASHBOARD HOME
  |--------------------------------------------------------------------------
  */

  const isDashboardHome =
    location.pathname === "/student-dashboard";

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  */

  return (
    <div className="student-dashboard-shell">

      {/* =========================================================
          NAVBAR
      ========================================================== */}

      <StudentNavbar
        user={currentUser}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchResults={filteredBooks}
        requestedBooks={requests}
        onRequestBook={requestBook}
        requestingBookId={requestingBookId}
        dailyQuotaReached={reservationQuota.totalRemainingToday <= 0}
        onLogout={onLogout}
      />

      {requestsError && <div className="student-api-error" role="alert">{requestsError}</div>}

      {issuanceNoticeBook && (
        <>
          <button className="issuance-notice-backdrop" type="button" aria-label="Close issuance notice" onClick={() => setIssuanceNoticeBook(null)} />
          <section className="issuance-notice" role="dialog" aria-modal="true" aria-labelledby="booking-notice-title">
            <div className="issuance-notice-icon" aria-hidden="true">✓</div>
            <div className="issuance-notice-copy">
              <span className="student-kicker">BOOKING CONFIRMED</span>
              <h2 id="booking-notice-title"><span >"</span>{issuanceNoticeBook.book.title}<span >"---</span> booking confirmed</h2>
              <p>Show token <strong>{issuanceNoticeBook.token}</strong> to the librarian within 30 minutes. After the deadline, the request will be treated as failed.</p>
            </div>
            <button className="issuance-notice-close" type="button" onClick={() => setIssuanceNoticeBook(null)}>Got it</button>
          </section>
        </>
      )}


      {/* =========================================================
          DASHBOARD HOME
      ========================================================== */}

      {isDashboardHome ? (
        <main className="student-dashboard-content">

          {/* =====================================================
              WELCOME SECTION
          ====================================================== */}

          <section className="student-welcome">
            <p className="student-kicker">
              🏛️ नेपाल सरकार · शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय · केशर पुस्तकालय (KAISER LIBRARY)
            </p>

            <h1>
              स्वागतम् (Welcome),{" "}
              {currentUser.username || "Student"} 👋
            </h1>

            <p>
              केसर महल, कान्तिपथ, काठमाडौं · अनलाइन सूचीपत्र (OPAC), पुस्तक आरक्षण तथा ई-पुस्तकालय पोर्टल
            </p>

            <div style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "8px", background: "#fef3c7", color: "#92400e", border: "1.5px solid #fde68a", borderRadius: "999px", padding: "8px 16px", fontWeight: 700 }}>
              <span>📌 दैनिक पुस्तक आरक्षण कोटा:</span>
              <strong>{reservationQuota.totalUsedToday}/{reservationQuota.totalDailyLimit} पुस्तकहरू</strong>
            </div>
          </section>


          {/* =====================================================
              OVERDUE ALERT
          ====================================================== */}

          {dashboardStats.overdue > 0 && (
            <section className="dashboard-alert">

              <div className="dashboard-alert-icon">
                !
              </div>

              <div className="dashboard-alert-content">

                <h3>
                  You have {dashboardStats.overdue} overdue book
                  {dashboardStats.overdue > 1 ? "s" : ""}
                </h3>

                <p>
                  Please check your borrowed books and return
                  overdue items to avoid additional fines.
                </p>

              </div>

            

            </section>
          )}


          {/* =====================================================
              STATISTICS
          ====================================================== */}

          <section className="student-stats">

            {/* -------------------------------------------------
                BORROWED BOOKS
            -------------------------------------------------- */}

            <article className="stat-card">

              <div className="stat-card-top">

                <span className="stat-card-label">
                  BORROWED BOOKS
                </span>

                <span
                  className="stat-card-icon"
                  aria-hidden="true"
                >
                  📚
                </span>

              </div>

              <h2>
                {dashboardStats.borrowed}
              </h2>

              <p>
                Currently borrowed
              </p>

            </article>


            {/* -------------------------------------------------
                OVERDUE BOOKS
            -------------------------------------------------- */}

            <article
              className={`stat-card ${
                dashboardStats.overdue > 0
                  ? "stat-card-warning"
                  : ""
              }`}
            >

              <div className="stat-card-top">

                <span className="stat-card-label">
                  OVERDUE BOOKS
                </span>

                <span
                  className="stat-card-icon"
                  aria-hidden="true"
                >
                  ⚠
                </span>

              </div>

              <h2>
                {dashboardStats.overdue}
              </h2>

              <p>
                Requires attention
              </p>

            </article>


            {/* -------------------------------------------------
                PENDING FINE
            -------------------------------------------------- */}

            <article className="stat-card">

              <div className="stat-card-top">

                <span className="stat-card-label">
                  PENDING FINE
                </span>

                <span
                  className="stat-card-icon"
                  aria-hidden="true"
                >
                  ₹
                </span>

              </div>

              <h2>
                ₹{dashboardStats.pendingFine}
              </h2>

              <p>
                Currently unpaid
              </p>

            </article>


            {/* -------------------------------------------------
                FINE PAID
            -------------------------------------------------- */}

            <article className="stat-card">

              <div className="stat-card-top">

                <span className="stat-card-label">
                  FINE PAID
                </span>

                <span
                  className="stat-card-icon"
                  aria-hidden="true"
                >
                  ✓
                </span>

              </div>

              <h2>
                ₹{dashboardStats.finePaid}
              </h2>

              <p>
                Total paid
              </p>

            </article>

          </section>


          {/* =====================================================
              CURRENTLY BORROWED BOOKS
          ====================================================== */}

          <section className="borrowed-books-section">

            {/* -------------------------------------------------
                SECTION HEADER
            -------------------------------------------------- */}

            <div className="section-heading">

              <div>

                <p className="student-kicker">
                  MY LIBRARY
                </p>

                <h2>
                  Currently Borrowed Books
                </h2>

                <p className="section-description">
                  Books currently issued to your account.
                </p>

              </div>


              <button
                type="button"
                className="view-all-button"
                onClick={() =>
                  navigate("/student-dashboard/loans")
                }
              >
                View All →
              </button>

            </div>


            {/* =================================================
                BOOK LIST
            ================================================== */}

            {borrowedBooks.length > 0 ? (
              <>

                <div className="borrowed-books-table">

                  {/* ------------------------------------------------
                      TABLE HEADER
                  ------------------------------------------------- */}

                  <div className="borrowed-books-header">

                    <span>
                      Title
                    </span>

                    <span>
                      Author
                    </span>

                    <span>
                      No. of Copies
                    </span>

                    <span>
                      Issue Date
                    </span>

                    <span>
                      Due Date
                    </span>

                  </div>


                  {/* ------------------------------------------------
                      BOOK ROWS
                  ------------------------------------------------- */}

                  {borrowedBooks.map((book) => (

                    <div
                      className="borrowed-book-row"
                      key={book.id}
                    >

                      {/* TITLE */}

                      <div className="book-title-cell">

                        <div className="book-thumbnail">
                          {book.title.charAt(0)}
                        </div>

                        <div>

                          <strong>
                            {book.title}
                          </strong>

                        </div>

                      </div>


                      {/* AUTHOR */}

                      <span className="book-author-cell">
                        {book.author}
                      </span>


                      {/* NUMBER OF COPIES */}

                      <span>
                        {book.copies}
                      </span>


                      {/* ISSUE DATE */}

                      <span>
                        {book.issueDate}
                      </span>


                      {/* DUE DATE */}

                      <span className="due-date-cell">
                        {book.dueDate}
                      </span>

                    </div>

                  ))}

                </div>


                {/* =================================================
                    TABLE FOOTER
                ================================================== */}

                <div className="borrowed-books-footer">

                  <span>
                    Showing {borrowedBooks.length} of 9
                    borrowed books
                  </span>

           

                </div>

              </>

            ) : (

              /* =================================================
                 EMPTY STATE
              ================================================== */

              <div className="borrowed-books-empty">

                <div className="empty-state-icon">
                  📚
                </div>

                <h3>
                  No borrowed books
                </h3>

                <p>
                  You currently don't have any books
                  checked out.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/student-dashboard/books")
                  }
                >
                  Browse Books
                </button>

              </div>

            )}

          </section>

          {/* =======================================================
              PERSONALIZED RECOMMENDATIONS (AI & BORROWING HISTORY)
          ======================================================== */}
          {recommendedBooks.length > 0 && (
            <section style={{ marginTop: "32px", background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                    AI & INTEREST ENGINE
                  </span>
                  <h3 style={{ margin: "6px 0 2px", fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                    Recommended For You
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                    Tailored using your borrowing history, academic department, and peer trends.
                  </p>
                </div>
                <button
                  type="button"
                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                  onClick={() => navigate("/student-dashboard/books")}
                >
                  View All &rarr;
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {recommendedBooks.slice(0, 4).map((book) => (
                  <div
                    key={book.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px",
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        {book.badge || "Curated Pick"}
                      </span>
                      <h4 style={{ margin: "8px 0 4px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
                        {book.title}
                      </h4>
                      <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "#64748b" }}>
                        By {book.author}
                      </p>
                      <p style={{ margin: "0 0 12px", fontSize: "0.76rem", color: "#0284c7", fontStyle: "italic" }}>
                        💡 {book.reason}
                      </p>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "10px" }}>
                        📍 {book.shelfLocation}
                      </div>
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer"
                        }}
                        onClick={() => navigate("/student-dashboard/books")}
                      >
                        Request / Locate &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>

      ) : (

        /* =======================================================
           CHILD ROUTES
        ======================================================== */

        <Outlet
          context={{
            currentUser,
            onUserUpdated: setProfileUserUpdates,
            filteredBooks,
            requests,
            requestBook,
            requestingBookId,
            cancelReservation,
            searchTerm,
            reservationQuota,
          }}
        />

      )}

      {/* Floating AI Library Assistant */}
      <AiLibraryAssistant />

    </div>
  );
};

export default StudentDashboard;
