
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/navbar";
import Footer from "../components/footer";

import "../css/mybugreports.css";
import "../css/loading.css";

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
).replace(/\/+$/, "");

const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_DESCRIPTIONS = {
  open: "Your report has been received and is waiting to be reviewed.",
  in_progress: "We're currently investigating this report.",
  resolved: "This issue has been fixed or otherwise resolved.",
  closed: "This report has been closed.",
};

const CATEGORY_LABELS = {
  ui: "UI",
  decklists: "Decklists",
  cards: "Cards",
  account: "Account",
  discord: "Discord",
  other: "Other",
};

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getStatusDescription(status) {
  return (
    STATUS_DESCRIPTIONS[status] ||
    "There is currently no additional status information."
  );
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "Other";
}

function getPriorityLabel(priority) {
  return PRIORITY_LABELS[priority] || priority || "Normal";
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getScreenshotUrl(screenshot) {
  if (!screenshot) {
    return "";
  }

  if (typeof screenshot === "string") {
    return screenshot.trim();
  }

  if (typeof screenshot === "object") {
    return String(
      screenshot.url ||
        screenshot.secure_url ||
        screenshot.secureUrl ||
        "",
    ).trim();
  }

  return "";
}

function MyBugReports() {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBug, setSelectedBug] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    const loadBugReports = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/user/bug-reports/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.error ||
              "Unable to load your bug reports.",
          );
        }

        if (cancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setBugReports(data);
        } else if (Array.isArray(data.results)) {
          setBugReports(data.results);
        } else if (Array.isArray(data.bug_reports)) {
          setBugReports(data.bug_reports);
        } else {
          setBugReports([]);
        }
      } catch (requestError) {
        console.error("Unable to load bug reports:", requestError);

        if (!cancelled) {
          setError(
            requestError.message ||
              "Unable to load your bug reports.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBugReports();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBugReports = useMemo(() => {
    if (filter === "all") {
      return bugReports;
    }

    return bugReports.filter((bug) => bug.status === filter);
  }, [bugReports, filter]);

  const counts = useMemo(() => {
    return {
      all: bugReports.length,
      open: bugReports.filter((bug) => bug.status === "open").length,
      in_progress: bugReports.filter(
        (bug) => bug.status === "in_progress",
      ).length,
      resolved: bugReports.filter(
        (bug) => bug.status === "resolved",
      ).length,
      closed: bugReports.filter(
        (bug) => bug.status === "closed",
      ).length,
    };
  }, [bugReports]);

  const closeDetails = () => {
    setSelectedBug(null);
  };

  const openScreenshot = (bug) => {
    const screenshotUrl = getScreenshotUrl(bug?.screenshot);

    if (!screenshotUrl) {
      return;
    }

    window.open(
      screenshotUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <>
      <Navbar />

      <main className="my-bug-reports-page">
        <div className="my-bug-reports-container">
          <section className="my-bug-reports-header">
            <div>
              <span className="my-bug-reports-eyebrow">
                TBOT SUPPORT
              </span>

              <h1>My Bug Reports</h1>

              <p>
                Track the bugs you've reported and see updates from
                the site owner.
              </p>
            </div>

            <div className="my-bug-reports-total">
              <strong>{counts.all}</strong>
              <span>
                {counts.all === 1 ? "Report" : "Reports"}
              </span>
            </div>
          </section>

          {!loading && !error && bugReports.length > 0 && (
            <section className="my-bug-reports-filters">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
                <span>{counts.all}</span>
              </button>

              <button
                type="button"
                className={filter === "open" ? "active" : ""}
                onClick={() => setFilter("open")}
              >
                Open
                <span>{counts.open}</span>
              </button>

              <button
                type="button"
                className={
                  filter === "in_progress" ? "active" : ""
                }
                onClick={() => setFilter("in_progress")}
              >
                In Progress
                <span>{counts.in_progress}</span>
              </button>

              <button
                type="button"
                className={filter === "resolved" ? "active" : ""}
                onClick={() => setFilter("resolved")}
              >
                Resolved
                <span>{counts.resolved}</span>
              </button>

              <button
                type="button"
                className={filter === "closed" ? "active" : ""}
                onClick={() => setFilter("closed")}
              >
                Closed
                <span>{counts.closed}</span>
              </button>
            </section>
          )}

          {loading && (
            <div className="my-bug-reports-loading">
              <div className="loading-spinner" />
              <p>Loading your bug reports...</p>
            </div>
          )}

          {!loading && error && (
            <section className="my-bug-reports-state my-bug-reports-error">
              <div className="my-bug-reports-state-icon">!</div>

              <h2>Unable to load reports</h2>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </section>
          )}

          {!loading &&
            !error &&
            bugReports.length === 0 && (
              <section className="my-bug-reports-state">
                <div className="my-bug-reports-state-icon">
                  ✓
                </div>

                <h2>No bug reports yet</h2>

                <p>
                  You haven't submitted any bug reports. If you
                  find something that isn't working correctly, use
                  <strong> Report a Bug </strong>
                  from the Website Info menu.
                </p>
              </section>
            )}

          {!loading &&
            !error &&
            bugReports.length > 0 &&
            filteredBugReports.length === 0 && (
              <section className="my-bug-reports-state">
                <div className="my-bug-reports-state-icon">
                  —
                </div>

                <h2>No reports in this category</h2>

                <p>
                  You don't have any bug reports with this status.
                </p>
              </section>
            )}

          {!loading &&
            !error &&
            filteredBugReports.length > 0 && (
              <section className="my-bug-reports-list">
                {filteredBugReports.map((bug) => {
                  const screenshotUrl = getScreenshotUrl(
                    bug.screenshot,
                  );

                  return (
                    <article
                      key={bug.id}
                      className="my-bug-report-card"
                    >
                      <div className="my-bug-report-card-top">
                        <div className="my-bug-report-card-title">
                          <span className="my-bug-report-number">
                            #{bug.id}
                          </span>

                          <h2>{bug.title}</h2>
                        </div>

                        <span
                          className={`my-bug-report-status status-${bug.status}`}
                        >
                          {getStatusLabel(bug.status)}
                        </span>
                      </div>

                      <div className="my-bug-report-meta">
                        <span>
                          <strong>Category:</strong>{" "}
                          {getCategoryLabel(bug.category)}
                        </span>

                        <span>
                          <strong>Priority:</strong>{" "}
                          {getPriorityLabel(bug.priority)}
                        </span>

                        <span>
                          <strong>Submitted:</strong>{" "}
                          {formatDate(bug.created_at)}
                        </span>
                      </div>

                      <p className="my-bug-report-description">
                        {bug.description}
                      </p>

                      <div className="my-bug-report-card-bottom">
                        <div className="my-bug-report-status-message">
                          <strong>
                            {getStatusLabel(bug.status)}
                          </strong>

                          <span>
                            {getStatusDescription(bug.status)}
                          </span>
                        </div>

                        <div className="my-bug-report-actions">

                          <button
                            type="button"
                            className="my-bug-report-button"
                            onClick={() =>
                              setSelectedBug(bug)
                            }
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
        </div>
      </main>

      {selectedBug && (
        <div
          className="my-bug-report-modal-overlay"
          onClick={closeDetails}
          role="presentation"
        >
          <div
            className="my-bug-report-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-bug-report-modal-title"
          >
            <div className="my-bug-report-modal-header">
              <div>
                <span className="my-bug-report-modal-eyebrow">
                  BUG REPORT #{selectedBug.id}
                </span>

                <h2 id="my-bug-report-modal-title">
                  {selectedBug.title}
                </h2>
              </div>

              <button
                type="button"
                className="my-bug-report-modal-close"
                onClick={closeDetails}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="my-bug-report-modal-status">
              <span
                className={`my-bug-report-status status-${selectedBug.status}`}
              >
                {getStatusLabel(selectedBug.status)}
              </span>

              <p>
                {getStatusDescription(selectedBug.status)}
              </p>
            </div>

            <div className="my-bug-report-detail-grid">
              <div>
                <span>Category</span>
                <strong>
                  {getCategoryLabel(selectedBug.category)}
                </strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>
                  {getPriorityLabel(selectedBug.priority)}
                </strong>
              </div>

              <div>
                <span>Submitted</span>
                <strong>
                  {formatDate(selectedBug.created_at)}
                </strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>
                  {formatDate(selectedBug.updated_at)}
                </strong>
              </div>
            </div>

            <div className="my-bug-report-detail-section">
              <h3>Description</h3>

              <div className="my-bug-report-description-box">
                {selectedBug.description}
              </div>
            </div>

            {selectedBug.page_url && (
              <div className="my-bug-report-detail-section">
                <h3>Reported From</h3>

                <a
                  href={selectedBug.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="my-bug-report-page-url"
                >
                  {selectedBug.page_url}
                </a>
              </div>
            )}

            {getScreenshotUrl(selectedBug.screenshot) && (
              <div className="my-bug-report-detail-section">
                <div className="my-bug-report-detail-heading">
                  <h3>Screenshot</h3>
                </div>

                <div className="my-bug-report-screenshot">
                  <img
                    src={getScreenshotUrl(
                      selectedBug.screenshot,
                    )}
                    alt={`Screenshot for bug report #${selectedBug.id}`}
                  />
                </div>
              </div>
            )}

            {selectedBug.admin_notes && (
              <div className="my-bug-report-admin-notes">
                <div className="my-bug-report-admin-notes-icon">
                  ✓
                </div>

                <div>
                  <span>Response from TBOT</span>

                  <p>{selectedBug.admin_notes}</p>
                </div>
              </div>
            )}

            <div className="my-bug-report-modal-footer">
              <button
                type="button"
                onClick={closeDetails}
                className="my-bug-report-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default MyBugReports;
