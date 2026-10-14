import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Navbar from "../../components/navbar.jsx";
import Footer from "../../components/footer.jsx";
import Seo from "../../components/seo.jsx";

import "../../css/profile/myBugReports.css";
import "../../css/loading.css";
import { API_BASE_URL } from "../../utils/api.js";

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
  if (!value) return "Unknown";

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
  if (!screenshot) return "";

  if (typeof screenshot === "string") {
    return screenshot.trim();
  }

  if (typeof screenshot === "object") {
    return String(
      screenshot.url || screenshot.secure_url || screenshot.secureUrl || "",
    ).trim();
  }

  return "";
}

function getBugReportsFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.bug_reports)) return data.bug_reports;

  return [];
}

function BugReportStatus({ status }) {
  return (
    <span className={`my-bug-report-status status-${status}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function BugReportFilters({ filter, counts, onFilterChange }) {
  const filters = [
    { value: "all", label: "All", count: counts.all },
    { value: "open", label: "Open", count: counts.open },
    {
      value: "in_progress",
      label: "In Progress",
      count: counts.in_progress,
    },
    { value: "resolved", label: "Resolved", count: counts.resolved },
    { value: "closed", label: "Closed", count: counts.closed },
  ];

  return (
    <section className="my-bug-reports-filters">
      {filters.map(({ value, label, count }) => (
        <button
          key={value}
          type="button"
          className={filter === value ? "active" : ""}
          aria-pressed={filter === value}
          onClick={() => onFilterChange(value)}
        >
          {label} <span>{count}</span>
        </button>
      ))}
    </section>
  );
}

function BugReportLoading() {
  return (
    <div className="my-bug-reports-loading">
      <div className="loading-spinner" />
      <p>Loading your bug reports...</p>
    </div>
  );
}

function BugReportEmptyState({ filtered, onRetry }) {
  if (filtered === "error") {
    return (
      <section className="my-bug-reports-state my-bug-reports-error">
        <div className="my-bug-reports-state-icon" aria-hidden="true">
          !
        </div>
        <h2>Unable to load reports</h2>
        <p>Unable to load your bug reports. Please try again.</p>
        <button type="button" onClick={onRetry}>
          Try Again
        </button>
      </section>
    );
  }

  const states = {
    empty: {
      icon: "✓",
      title: "No bug reports yet",
      description: (
        <>
          You haven't submitted any bug reports. If you find something that
          isn't working correctly, use <strong>Report a Bug</strong> from the
          Website Info menu.
        </>
      ),
    },
    filtered: {
      icon: "—",
      title: "No reports in this category",
      description: "You don't have any bug reports with this status.",
    },
  };

  const state = states[filtered] || states.empty;

  return (
    <section className="my-bug-reports-state">
      <div className="my-bug-reports-state-icon" aria-hidden="true">
        {state.icon}
      </div>
      <h2>{state.title}</h2>
      <p>{state.description}</p>
    </section>
  );
}

function BugReportCard({ bug, onViewDetails }) {
  return (
    <article className="my-bug-report-card">
      <div className="my-bug-report-card-top">
        <div className="my-bug-report-card-title">
          <span className="my-bug-report-number">#{bug.id}</span>
          <h2>{bug.title}</h2>
        </div>
        <BugReportStatus status={bug.status} />
      </div>

      <div className="my-bug-report-meta">
        <span>
          <strong>Category:</strong> {getCategoryLabel(bug.category)}
        </span>
        <span>
          <strong>Priority:</strong> {getPriorityLabel(bug.priority)}
        </span>
        <span>
          <strong>Submitted:</strong> {formatDate(bug.created_at)}
        </span>
      </div>

      <p className="my-bug-report-description">{bug.description}</p>

      <div className="my-bug-report-card-bottom">
        <div className="my-bug-report-status-message">
          <strong>{getStatusLabel(bug.status)}</strong>
          <span>{getStatusDescription(bug.status)}</span>
        </div>

        <div className="my-bug-report-actions">
          <button
            type="button"
            className="my-bug-report-button"
            onClick={() => onViewDetails(bug)}
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

function BugReportDetailsDialog({ bug, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !bug) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [bug]);



  if (!bug) return null;

  const screenshotUrl = getScreenshotUrl(bug.screenshot);

  return (
    <dialog
      ref={dialogRef}
      className="my-bug-report-modal-overlay"
      aria-labelledby="my-bug-report-modal-title"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="my-bug-report-modal">
        <div className="my-bug-report-modal-header">
          <div>
            <span className="my-bug-report-modal-eyebrow">
              BUG REPORT #{bug.id}
            </span>
            <h2 id="my-bug-report-modal-title">{bug.title}</h2>
          </div>

          <button
            type="button"
            className="my-bug-report-modal-close"
            onClick={onClose}
            aria-label="Close bug report details"
          >
            &times;
          </button>
        </div>

        <div className="my-bug-report-modal-status">
          <BugReportStatus status={bug.status} />
          <p>{getStatusDescription(bug.status)}</p>
        </div>

        <div className="my-bug-report-detail-grid">
          <div>
            <span>Category</span>
            <strong>{getCategoryLabel(bug.category)}</strong>
          </div>
          <div>
            <span>Priority</span>
            <strong>{getPriorityLabel(bug.priority)}</strong>
          </div>
          <div>
            <span>Submitted</span>
            <strong>{formatDate(bug.created_at)}</strong>
          </div>
          <div>
            <span>Last Updated</span>
            <strong>{formatDate(bug.updated_at)}</strong>
          </div>
        </div>

        <div className="my-bug-report-detail-section">
          <h3>Description</h3>
          <div className="my-bug-report-description-box">{bug.description}</div>
        </div>

        {bug.page_url && (
          <div className="my-bug-report-detail-section">
            <h3>Reported From</h3>
            <a
              href={bug.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="my-bug-report-page-url"
            >
              {bug.page_url}
            </a>
          </div>
        )}

        {screenshotUrl && (
          <div className="my-bug-report-detail-section">
            <div className="my-bug-report-detail-heading">
              <h3>Screenshot</h3>
            </div>
            <div className="my-bug-report-screenshot">
              <img
                src={screenshotUrl}
                alt={`Screenshot for bug report #${bug.id}`}
              />
            </div>
          </div>
        )}

        {bug.admin_notes && (
          <div className="my-bug-report-admin-notes">
            <div className="my-bug-report-admin-notes-icon" aria-hidden="true">
              ✓
            </div>
            <div>
              <span>Response from TBOT</span>
              <p>{bug.admin_notes}</p>
            </div>
          </div>
        )}

        <div className="my-bug-report-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="my-bug-report-button"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

function MyBugReports() {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBug, setSelectedBug] = useState(null);
  const [filter, setFilter] = useState("all");
  const [retryKey, setRetryKey] = useState(0);

  const loadBugReports = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/tbotapp/user/bug-reports/`,
        {
          method: "GET",
          credentials: "include",
          signal,
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
          data.detail || data.error || "Unable to load your bug reports.",
        );
      }

      setBugReports(getBugReportsFromResponse(data));
    } catch (requestError) {
      if (requestError.name === "AbortError") return;

      console.error("Unable to load bug reports:", requestError);
      setError(requestError.message || "Unable to load your bug reports.");
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadBugReports(controller.signal);

    return () => controller.abort();
  }, [loadBugReports, retryKey]);

  const filteredBugReports = useMemo(() => {
    if (filter === "all") return bugReports;

    return bugReports.filter((bug) => bug.status === filter);
  }, [bugReports, filter]);

  const counts = useMemo(() => {
    const result = {
      all: bugReports.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    bugReports.forEach((bug) => {
      if (Object.hasOwn(result, bug.status) && bug.status !== "all") {
        result[bug.status] += 1;
      }
    });

    return result;
  }, [bugReports]);

  const closeDetails = useCallback(() => {
    setSelectedBug(null);
  }, []);

  const retryLoading = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  let emptyStateType = null;

  if (!loading && error) {
    emptyStateType = "error";
  } else if (!loading && !error && bugReports.length === 0) {
    emptyStateType = "empty";
  } else if (
    !loading &&
    !error &&
    bugReports.length > 0 &&
    filteredBugReports.length === 0
  ) {
    emptyStateType = "filtered";
  }

  return (
    <>
      <Seo
        title="My Bug Reports - Tbot"
        description="View and track the bug reports you have submitted to the Tbot Plants vs. Zombies Heroes website."
        canonical="/my-bug-reports"
        noindex
      />

      <Navbar />

      <main className="my-bug-reports-page">
        <div className="my-bug-reports-container">
          <section className="my-bug-reports-header">
            <div>
              <span className="my-bug-reports-eyebrow">TBOT SUPPORT</span>
              <h1>My Bug Reports</h1>
              <p>
                Track the bugs you've reported and see updates from the site
                owner.
              </p>
            </div>

            <div className="my-bug-reports-total">
              <strong>{counts.all}</strong>{" "}
              <span>{counts.all === 1 ? "Report" : "Reports"}</span>
            </div>
          </section>

          {!loading && !error && bugReports.length > 0 && (
            <BugReportFilters
              filter={filter}
              counts={counts}
              onFilterChange={setFilter}
            />
          )}

          {loading && <BugReportLoading />}

          {emptyStateType && (
            <BugReportEmptyState
              filtered={emptyStateType}
              onRetry={retryLoading}
            />
          )}

          {!loading && !error && filteredBugReports.length > 0 && (
            <section className="my-bug-reports-list">
              {filteredBugReports.map((bug) => (
                <BugReportCard
                  key={bug.id}
                  bug={bug}
                  onViewDetails={setSelectedBug}
                />
              ))}
            </section>
          )}
        </div>
      </main>

      <BugReportDetailsDialog bug={selectedBug} onClose={closeDetails} />

      <Footer />
    </>
  );
}

export default MyBugReports;
