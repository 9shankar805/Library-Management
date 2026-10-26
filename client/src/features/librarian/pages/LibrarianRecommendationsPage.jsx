import React, { useState, useEffect } from "react";
import {
  Compass,
  Sparkles,
  BookOpen,
  MapPinned,
  Award,
  TrendingUp,
  Users,
  Search
} from "lucide-react";
import "../styles/LibrarianRecommendationsPage.css";

const LibrarianRecommendationsPage = () => {
  const [studentId, setStudentId] = useState("21CS001");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async (idToFetch) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/recommendations?studentId=${idToFetch || studentId}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations("21CS001");
  }, []);

  return (
    <div className="recs-page">
      {/* Header */}
      <div className="recs-header">
        <div>
          <span className="recs-kicker">INTELLIGENCE & DISCOVERY</span>
          <h1>Personalized Recommendation Engine</h1>
          <p>Collaborative and content-based recommendation scores matching reader borrowing history, course curriculum, and peer trends.</p>
        </div>
        <div className="recs-student-selector">
          <span>Student Context:</span>
          <select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              fetchRecommendations(e.target.value);
            }}
          >
            <option value="21CS001">21CS001 (John Student - CSE)</option>
            <option value="21ME045">21ME045 (Mechanical)</option>
            <option value="21EE012">21EE012 (EEE)</option>
          </select>
        </div>
      </div>

      {/* Summary Banner */}
      {data && (
        <div className="recs-summary-banner">
          <div className="recs-summary-left">
            <div className="recs-sparkle-box">
              <Sparkles size={24} />
            </div>
            <div>
              <h3>Curated Recommendations for {data.studentName}</h3>
              <p>Academic Program: <strong>{data.department}</strong> · Roll: <strong>{data.studentId}</strong></p>
            </div>
          </div>
          <div className="recs-count-badge">
            <strong>{data.totalRecommendations}</strong>
            <span>Recommended Titles</span>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="recs-grid">
        {loading ? (
          <div className="recs-loading-box">
            <div className="recs-spinner" />
            <p>Evaluating collaborative affinities & curriculum scores...</p>
          </div>
        ) : !data || data.recommendations?.length === 0 ? (
          <div className="recs-empty-box">
            <Compass size={32} />
            <p>No personalized recommendations available for this profile.</p>
          </div>
        ) : (
          data.recommendations.map((rec) => (
            <div key={rec.id} className="rec-card">
              <div className="rec-card-top">
                <span className={`rec-badge ${rec.badge.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Award size={12} /> {rec.badge}
                </span>
                <span className="rec-score-pill">
                  Score: <strong>{rec.score}/100</strong>
                </span>
              </div>

              <div className="rec-card-body">
                <div className="rec-cover-icon">
                  <BookOpen size={20} />
                </div>
                <div className="rec-info">
                  <h4>{rec.title}</h4>
                  <span className="rec-author">By {rec.author}</span>
                  <div className="rec-dept-category">
                    <span>{rec.categoryName}</span> · <em>{rec.departmentName}</em>
                  </div>
                </div>
              </div>

              <div className="rec-reason-callout">
                💡 {rec.reason}
              </div>

              <div className="rec-card-footer">
                <div className="rec-shelf-tag">
                  <MapPinned size={14} />
                  <span>{rec.shelfLocation}</span>
                </div>
                <span className="rec-avail-tag">
                  <strong>{rec.availableCopies}</strong> in stock
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LibrarianRecommendationsPage;
