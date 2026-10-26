import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ShelfNavModal from "../../../components/ShelfNavModal";
import BarcodeQrModal from "../../../components/BarcodeQrModal";

const normalizeBook = (book) => {
  const availability = book.availabilities?.reduce(
    (total, item) => total + (item.availableCopies || 0),
    0,
  ) || 0;

  return {
    ...book,
    availableCopies: availability,
    categoryName: book.category?.name || "Uncategorized",
    departmentName: book.department?.name || "General",
  };
};

const BrowseBooksPage = () => {
  const { requests, requestBook, requestingBookId, reservationQuota = { totalRemainingToday: 0 } } = useOutletContext();
  const dailyQuotaReached = reservationQuota.totalRemainingToday <= 0;
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [floor, setFloor] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [navBook, setNavBook] = useState(null);
  const [barcodeModalData, setBarcodeModalData] = useState(null);
  const [showAcquisitionModal, setShowAcquisitionModal] = useState(false);
  const [acqForm, setAcqForm] = useState({
    title: "",
    author: "",
    isbn: "",
    department: "Computer Science & Engineering",
    notes: ""
  });
  const [acqSubmitting, setAcqSubmitting] = useState(false);
  const [acqSuccess, setAcqSuccess] = useState(false);

  const handleOpenBarcode = async (book) => {
    try {
      const res = await fetch(`/api/books/${book.id}/copies`);
      const data = await res.json();
      const firstCopy = data.copies && data.copies[0];
      setBarcodeModalData({
        title: book.title,
        accessionNo: firstCopy ? firstCopy.accessionNo : `ACC-2026-${String(book.id).padStart(4, "0")}-01`,
        barcode: firstCopy ? firstCopy.barcode : `BC-${book.isbn || book.id}`,
        rfidTag: firstCopy ? firstCopy.rfidTag : `E280116060${String(book.id).padStart(6, "0")}`,
      });
    } catch {
      setBarcodeModalData({
        title: book.title,
        accessionNo: `ACC-2026-${String(book.id).padStart(4, "0")}-01`,
        barcode: `BC-${book.isbn || book.id}`,
        rfidTag: `E280116060${String(book.id).padStart(6, "0")}`,
      });
    }
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesResponse, departmentsResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/departments"),
        ]);
        if (!categoriesResponse.ok || !departmentsResponse.ok) throw new Error("The catalog filters could not be loaded.");

        const [categoriesData, departmentsData] = await Promise.all([
          categoriesResponse.json(),
          departmentsResponse.json(),
        ]);
        setCategories(categoriesData.categories || []);
        setDepartments(departmentsData.departments || []);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      limit: "24",
      order: "asc",
      sortBy: sortBy,
    });
    if (searchTerm.trim()) query.set("q", searchTerm.trim());
    if (categoryId !== "all") query.set("categoryId", categoryId);
    if (departmentId !== "all") query.set("departmentId", departmentId);
    if (floor !== "all") query.set("floor", floor);
    if (availableOnly) query.set("availableOnly", "true");

    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/discovery/search?${query.toString()}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "The library catalog could not be loaded.");
        setBooks((data.books || []).map(normalizeBook));
        setError("");
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadBooks();
    return () => controller.abort();
  }, [categoryId, departmentId, floor, availableOnly, sortBy, searchTerm]);

  const visibleBooks = books;

  const isRequested = (book) => (requests || []).some(
    (request) => request?.book?.id === book.id && ["Requested", "Booked", "Reserved", "Waitlisted"].includes(request.status),
  );

  return (
    <main className="browse-books-page">
      <section className="browse-books-search-panel">
        <div className="browse-books-search-copy">
          <p className="student-kicker">DISCOVERY ENGINE</p>
          <h1>Advanced Library Search</h1>
          <p>Search by title, author, ISBN, subject, department, floor & exact shelf location.</p>
        </div>
        <div className="browse-books-toolbar" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="browse-books-search-bar" style={{ width: "100%" }}>
            <span className="browse-books-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            </span>
            <span className="sr-only">Search the library catalog</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, author, ISBN, or keyword..."
              type="search"
              enterKeyHint="search"
            />
            {searchTerm && (
              <button type="button" className="browse-books-clear" onClick={() => setSearchTerm("")} aria-label="Clear search">
                Clear
              </button>
            )}
          </label>
          <div className="browse-books-filters" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }} aria-label="Filter books">
            <label className="browse-books-filter">
              <span>Subject / Category</span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="browse-books-filter">
              <span>Department</span>
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="all">All departments</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </label>
            <label className="browse-books-filter">
              <span>Floor</span>
              <select value={floor} onChange={(event) => setFloor(event.target.value)}>
                <option value="all">All Floors</option>
                <option value="1">Floor 1 (CS, Math, Tech)</option>
                <option value="2">Floor 2 (Mech, Civil, EEE)</option>
                <option value="3">Floor 3 (Literature & Journals)</option>
              </select>
            </label>
            <label className="browse-books-filter">
              <span>Sort By</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="relevance">Default</option>
                <option value="title">Title (A-Z)</option>
                <option value="author">Author (A-Z)</option>
                <option value="publishedYear">Year (Newest)</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "#334155", fontWeight: "500", padding: "6px 10px", background: "#f1f5f9", borderRadius: "6px" }}>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              In Stock Only
            </label>
            <button
              type="button"
              className="browse-books-reset"
              onClick={() => {
                setCategoryId("all");
                setDepartmentId("all");
                setFloor("all");
                setAvailableOnly(false);
                setSortBy("relevance");
                setSearchTerm("");
              }}
              disabled={categoryId === "all" && departmentId === "all" && floor === "all" && !availableOnly && !searchTerm}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="browse-books-recommendations">
        <div className="browse-books-heading">
          <div>
            <p className="student-kicker">CURATED COLLECTION</p>
            <h2>Recommended books</h2>
            <p className="browse-books-section-note">Explore titles selected from the library collection.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="browse-books-reset"
              style={{ borderColor: "#0284c7", color: "#0284c7", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setShowAcquisitionModal(true);
                setAcqSuccess(false);
              }}
            >
              ➕ Request New Book Acquisition
            </button>
            <span className="browse-books-result-count">{isLoading ? "Loading..." : `${visibleBooks.length} ${visibleBooks.length === 1 ? "title" : "titles"}`}</span>
          </div>
        </div>

        {error && <div className="browse-books-message">{error}</div>}
        {!isLoading && !error && visibleBooks.length === 0 && <div className="browse-books-message">No books match your search and filters.</div>}
        <div className="book-grid browse-books-grid">
          {visibleBooks.map((book) => (
            <article className="book-card" key={book.id}>
              <div className="book-cover">{book.title.charAt(0)}</div>
              <div className="book-card-content">
                <span className="book-category">{book.categoryName}</span>
                <h3>{book.title}</h3>
                <p>By {book.author}</p>
                <div className="browse-book-meta">
                  <span>{book.departmentName}</span>
                  <strong>{book.availableCopies} available</strong>
                </div>
                {(book.locationSummary || book.shelf) && (
                  <div style={{ fontSize: "0.78rem", color: "#0284c7", background: "#f0f9ff", padding: "3px 8px", borderRadius: "6px", display: "inline-block", marginTop: "4px", border: "1px solid #bae6fd" }}>
                    📍 {book.locationSummary || `Floor ${book.shelf?.floor} · ${book.shelf?.section} (${book.shelf?.rackNumber})`}
                  </div>
                )}
                <div className="browse-book-actions">
                  <button className="browse-book-details" type="button" onClick={() => setSelectedBook(book)}>
                    View details
                  </button>
                  <button
                    className="browse-book-details"
                    type="button"
                    style={{ borderColor: "#0284c7", color: "#0284c7" }}
                    onClick={() => setNavBook(book)}
                    title="Find shelf and rack on floor map"
                  >
                    📍 Locate
                  </button>
                  <button className="book-button" type="button" disabled={dailyQuotaReached || !book.availableCopies || isRequested(book) || requestingBookId === book.id} onClick={() => requestBook(book)}>
                    {requestingBookId === book.id ? "Requesting..." : isRequested(book) ? "Requested" : dailyQuotaReached ? "Daily limit reached" : book.availableCopies ? "Request book" : "Unavailable"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedBook && (
        <div className="book-details-dialog" role="dialog" aria-modal="true" aria-label={`${selectedBook.title} details`}>
          <div className="book-details-dialog-header">
            <div>
              <span className="student-kicker">BOOK RECORD</span>
              <h2>{selectedBook.title}</h2>
            </div>
            <button type="button" aria-label="Close book details" onClick={() => setSelectedBook(null)}>×</button>
          </div>
          <p className="book-details-author">By {selectedBook.author}</p>
          {selectedBook.description && <p className="book-details-description">{selectedBook.description}</p>}
          <div className="book-details-grid">
            <div><span>Book ID</span><strong>{selectedBook.id}</strong></div>
            <div><span>ISBN</span><strong>{selectedBook.isbn || "Not available"}</strong></div>
            <div><span>Published</span><strong>{selectedBook.publishedYear || "Not available"}</strong></div>
            <div><span>Available copies</span><strong>{selectedBook.availableCopies}</strong></div>
            <div><span>Category</span><strong>{selectedBook.categoryName}</strong></div>
            <div><span>Department</span><strong>{selectedBook.departmentName}</strong></div>
            <div><span>Shelf</span><strong>{selectedBook.availabilities?.[0]?.shelf?.section || "Not assigned"}</strong></div>
            <div><span>Rack</span><strong>{selectedBook.availabilities?.[0]?.shelf?.rackNumber || "Not assigned"}</strong></div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="book-button"
              style={{ background: "#0284c7", margin: 0, padding: "8px 16px" }}
              onClick={() => setNavBook(selectedBook)}
            >
              📍 Open Shelf Map (Building, Floor, Rack)
            </button>
            <button
              type="button"
              className="browse-book-details"
              style={{ margin: 0, padding: "8px 16px", borderColor: "#0f766e", color: "#0f766e" }}
              onClick={() => handleOpenBarcode(selectedBook)}
            >
              🏷️ Physical Barcodes & RFID Info
            </button>
          </div>
        </div>
      )}

      {/* Shelf Navigation Modal */}
      <ShelfNavModal
        isOpen={Boolean(navBook)}
        book={navBook || {}}
        onClose={() => setNavBook(null)}
      />

      {/* Barcode / QR Identity Modal */}
      <BarcodeQrModal
        isOpen={Boolean(barcodeModalData)}
        data={barcodeModalData || {}}
        mode="view"
        onClose={() => setBarcodeModalData(null)}
      />

      {/* Book Acquisition Request Modal */}
      {showAcquisitionModal && (
        <div className="book-details-dialog-backdrop" onClick={() => setShowAcquisitionModal(false)}>
          <div className="book-details-dialog" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="book-details-dialog-header">
              <div>
                <span className="student-kicker">COLLECTION DEVELOPMENT</span>
                <h2>Recommend Book for Library Acquisition</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setShowAcquisitionModal(false)}>×</button>
            </div>

            {acqSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🎉</div>
                <h3 style={{ color: "#0f172a", marginBottom: "6px" }}>Purchase Recommendation Submitted!</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
                  Your request has been forwarded to the Central Library acquisition desk for budget review and supplier ordering.
                </p>
                <button
                  type="button"
                  className="book-button"
                  onClick={() => setShowAcquisitionModal(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAcqSubmitting(true);
                  try {
                    const res = await fetch("/api/procurement/requests", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(acqForm)
                    });
                    const data = await res.json();
                    if (data.success) {
                      setAcqSuccess(true);
                      setAcqForm({ title: "", author: "", isbn: "", department: "Computer Science & Engineering", notes: "" });
                    } else {
                      alert(data.message || "Failed to submit request.");
                    }
                  } catch (err) {
                    alert("Submission error: " + err.message);
                  } finally {
                    setAcqSubmitting(false);
                  }
                }}
                style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                  Book Title *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Designing Distributed Systems"
                    value={acqForm.title}
                    onChange={(e) => setAcqForm({ ...acqForm, title: e.target.value })}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                  Author(s) *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brendan Burns"
                    value={acqForm.author}
                    onChange={(e) => setAcqForm({ ...acqForm, author: e.target.value })}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                  ISBN (Optional)
                  <input
                    type="text"
                    placeholder="e.g. 9781491983645"
                    value={acqForm.isbn}
                    onChange={(e) => setAcqForm({ ...acqForm, isbn: e.target.value })}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                  Department / Course
                  <select
                    value={acqForm.department}
                    onChange={(e) => setAcqForm({ ...acqForm, department: e.target.value })}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Management Studies">Management Studies</option>
                    <option value="Applied Sciences">Applied Sciences</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                  Justification / Purpose
                  <textarea
                    rows={2}
                    placeholder="Why should the library purchase this book? (e.g. Core textbook for CS304 syllabus)"
                    value={acqForm.notes}
                    onChange={(e) => setAcqForm({ ...acqForm, notes: e.target.value })}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="browse-book-details"
                    onClick={() => setShowAcquisitionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="book-button"
                    disabled={acqSubmitting}
                  >
                    {acqSubmitting ? "Submitting..." : "Submit Recommendation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default BrowseBooksPage;
