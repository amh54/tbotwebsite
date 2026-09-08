
import { useEffect, useMemo, useState } from "react";

import Footer from "../components/footer";

import "../css/adminbugreports.css";
import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(
    import.meta.env.VITE_API_BASE_URL || "",
  ).trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

let csrfToken = null;

const getCookie = (name) => {
  const cookies = document.cookie
    ? document.cookie.split(";")
    : [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(
        trimmed.slice(name.length + 1),
      );
    }
  }

  return null;
};

const ensureCsrfToken = async () => {
  const existingToken = getCookie("csrftoken");

  if (existingToken) {
    csrfToken = existingToken;
    return csrfToken;
  }

  const response = await fetch(
    `${API_BASE_URL}/tbotapp/csrf/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to initialize CSRF protection. Status ${response.status}.`,
    );
  }

  try {
    const data = await response.json();

    csrfToken =
      data?.csrfToken ||
      data?.csrf_token ||
      getCookie("csrftoken");
  } catch {
    csrfToken = getCookie("csrftoken");
  }

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Please refresh the page and try again.",
    );
  }

  return csrfToken;
};

const getApiErrorMessage = async (
  response,
  fallback,
) => {
  let message = fallback;

  try {
    const data = await response.json();

    if (data?.detail) {
      message += `: ${data.detail}`;
    } else if (data?.error) {
      message += `: ${data.error}`;
    } else if (
      data &&
      typeof data === "object"
    ) {
      const fieldMessages = Object.entries(data)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);

          return `${field}: ${text}`;
        })
        .join(" | ");

      if (fieldMessages) {
        message += `: ${fieldMessages}`;
      }
    }
  } catch {
    // Keep fallback.
  }

  return message;
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

const getReportId = (report) =>
  report?.id ??
  report?.report_id ??
  report?.reportId ??
  report?.bug_id ??
  report?.bugId;

const getReportTitle = (report) =>
  report?.title ||
  report?.subject ||
  report?.bug_title ||
  report?.bugTitle ||
  "Untitled Bug Report";

const getReportDescription = (report) =>
  report?.description ||
  report?.details ||
  report?.message ||
  report?.bug_description ||
  report?.bugDescription ||
  "";

const getReportCategory = (report) =>
  report?.category ||
  report?.type ||
  report?.bug_type ||
  report?.bugType ||
  "other";

const getReportStatus = (report) =>
  report?.status ||
  report?.state ||
  "open";

const getReporterName = (report) =>
  report?.discord_username ||
  report?.username ||
  report?.display_name ||
  report?.displayName ||
  report?.discordUsername ||
  report?.user?.username ||
  report?.user?.display_name ||
  report?.user?.displayName ||
  "Unknown User";

const getReporterAvatar = (report) =>
  report?.avatar ||
  report?.avatar_url ||
  report?.avatarUrl ||
  report?.discord_avatar ||
  report?.discordAvatar ||
  report?.user?.avatar ||
  report?.user?.avatar_url ||
  "";

/*
 * Handles all of these possible API formats:
 *
 * screenshot: "https://res.cloudinary.com/..."
 *
 * screenshot_url: "https://res.cloudinary.com/..."
 *
 * screenshot: {
 *   url: "https://res.cloudinary.com/..."
 * }
 *
 * screenshot: {
 *   secure_url: "https://res.cloudinary.com/..."
 * }
 *
 * screenshot: {
 *   screenshot_url: "https://res.cloudinary.com/..."
 * }
 */
const getScreenshotUrl = (report) => {
  const possibleScreenshot =
    report?.screenshot ??
    report?.screenshot_url ??
    report?.screenshotUrl ??
    report?.image ??
    report?.image_url ??
    report?.imageUrl ??
    report?.uploaded_image ??
    report?.uploadedImage ??
    null;

  if (!possibleScreenshot) {
    return "";
  }

  if (
    typeof possibleScreenshot === "string"
  ) {
    return possibleScreenshot.trim();
  }

  if (
    typeof possibleScreenshot === "object"
  ) {
    return (
      possibleScreenshot?.url ||
      possibleScreenshot?.secure_url ||
      possibleScreenshot?.secureUrl ||
      possibleScreenshot?.screenshot_url ||
      possibleScreenshot?.screenshotUrl ||
      possibleScreenshot?.image_url ||
      possibleScreenshot?.imageUrl ||
      ""
    );
  }

  return "";
};

const getCreatedDate = (report) =>
  report?.created_at ||
  report?.createdAt ||
  report?.submitted_at ||
  report?.submittedAt ||
  report?.date ||
  null;

const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeStatus = (status) => {
  const value = normalizeText(status);

  if (
    value === "in progress" ||
    value === "in_progress"
  ) {
    return "in_progress";
  }

  if (value === "resolved") {
    return "resolved";
  }

  if (value === "closed") {
    return "closed";
  }

  return "open";
};

const formatStatus = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "in_progress") {
    return "In Progress";
  }

  if (normalized === "resolved") {
    return "Resolved";
  }

  if (normalized === "closed") {
    return "Closed";
  }

  return "Open";
};

const formatCategory = (category) => {
  const value = normalizeText(category);

  if (!value) {
    return "Other";
  }

  return value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
};

function AdminBugReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [
    selectedScreenshot,
    setSelectedScreenshot,
  ] = useState(null);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  const [actionError, setActionError] =
    useState("");

  useEffect(() => {
    document.title = "Admin - Bug Reports";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error(
        "Unable to initialize CSRF:",
        err,
      );
    });
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/bugs/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            `Request failed with status ${response.status}`,
          );

        if (response.status === 401) {
          throw new Error(
            "You must be logged in with Discord to access the admin page.",
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to access bug reports.",
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.reports)
            ? data.reports
            : [];

      console.log(
        "ADMIN BUG REPORTS:",
        results,
      );

      results.forEach((report) => {
        console.log(
          "BUG REPORT SCREENSHOT:",
          getScreenshotUrl(report),
          report,
        );
      });

      setReports(results);
    } catch (err) {
      console.error(
        "Unable to load bug reports:",
        err,
      );

      setError(
        err.message ||
          "Unable to load bug reports right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = normalizeText(search);

    return reports.filter((report) => {
      const status = normalizeStatus(
        getReportStatus(report),
      );

      const searchText = [
        getReportTitle(report),
        getReportDescription(report),
        getReportCategory(report),
        getReporterName(report),
        report?.browser,
        report?.operating_system,
        report?.browser_name,
        report?.browserName,
        report?.device,
        report?.device_name,
        report?.deviceName,
        report?.os,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .join(" ");

      const matchesSearch =
        !query ||
        searchText.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    reports,
    search,
    statusFilter,
  ]);

  const counts = useMemo(() => {
    const result = {
      all: reports.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    reports.forEach((report) => {
      const status = normalizeStatus(
        getReportStatus(report),
      );

      if (
        result[status] !== undefined
      ) {
        result[status] += 1;
      }
    });

    return result;
  }, [reports]);

  const handleStatusChange = async (
    report,
    newStatus,
  ) => {
    const reportId = getReportId(report);

    if (
      reportId === undefined ||
      reportId === null
    ) {
      setActionError(
        "This bug report does not have a valid ID.",
      );
      return;
    }

    const normalizedStatus =
      normalizeStatus(newStatus);

    try {
      setUpdatingId(reportId);
      setActionError("");

      const token =
        await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/bugs/${reportId}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
          body: JSON.stringify({
            status: normalizedStatus,
          }),
        },
      );

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            `Unable to update bug report. Status ${response.status}`,
          );

        throw new Error(message);
      }

      let updatedReport = null;

      try {
        updatedReport =
          await response.json();
      } catch {
        updatedReport = null;
      }

      setReports(
        (currentReports) =>
          currentReports.map(
            (currentReport) => {
              const currentId =
                getReportId(
                  currentReport,
                );

              if (
                String(currentId) !==
                String(reportId)
              ) {
                return currentReport;
              }

              return (
                updatedReport || {
                  ...currentReport,
                  status:
                    normalizedStatus,
                }
              );
            },
          ),
      );

      setSelectedReport(
        (current) => {
          if (!current) {
            return current;
          }

          const currentId =
            getReportId(current);

          if (
            String(currentId) !==
            String(reportId)
          ) {
            return current;
          }

          return (
            updatedReport || {
              ...current,
              status:
                normalizedStatus,
            }
          );
        },
      );
    } catch (err) {
      console.error(
        "Unable to update bug report:",
        err,
      );

      setActionError(
        err.message ||
          "Unable to update bug report.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (report) => {
    const reportId = getReportId(report);

    if (
      reportId === undefined ||
      reportId === null
    ) {
      setActionError(
        "This bug report does not have a valid ID.",
      );
      return;
    }

    const title =
      getReportTitle(report);

    const confirmed =
      window.confirm(
        `Delete "${title}"?\n\nThis cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(reportId);
      setActionError("");

      const token =
        await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/bugs/${reportId}/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": token,
          },
        },
      );

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            `Unable to delete bug report. Status ${response.status}`,
          );

        throw new Error(message);
      }

      setReports(
        (currentReports) =>
          currentReports.filter(
            (currentReport) =>
              String(
                getReportId(
                  currentReport,
                ),
              ) !==
              String(reportId),
          ),
      );

      setSelectedReport(
        (current) => {
          if (!current) {
            return null;
          }

          return String(
            getReportId(current),
          ) === String(reportId)
            ? null
            : current;
        },
      );
    } catch (err) {
      console.error(
        "Unable to delete bug report:",
        err,
      );

      setActionError(
        err.message ||
          "Unable to delete bug report.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const closeDetails = () => {
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>
            Loading bug reports
          </h2>

          <p>
            Preparing the bug report
            dashboard and loading submitted
            reports.
          </p>

          <div className="loading-status">
            <span>
              Loading report data
            </span>

            <strong>
              Loading...
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-bugreports-page">
      <main className="admin-bugreports-content">
        <div className="admin-bugreports-topbar">
          <div>
            <span className="admin-bugreports-eyebrow">
              ADMINISTRATION
            </span>

            <h1>
              Bug Reports
            </h1>

            <p>
              Review, manage, and resolve
              bug reports submitted by the
              Tbot community.
            </p>
          </div>

          <div className="admin-bugreports-actions">
            <button
              type="button"
              className="admin-bugreports-back"
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
            >
              ← Admin
            </button>

            <button
              type="button"
              className="admin-bugreports-refresh"
              onClick={fetchReports}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-bugreports-error">
            <strong>
              Unable to load reports
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

        {actionError && (
          <div className="admin-bugreports-error">
            <strong>
              Action failed
            </strong>

            <span>
              {actionError}
            </span>

            <button
              type="button"
              onClick={() =>
                setActionError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {!error && (
          <>
            <section className="admin-bugreports-stats">
              <button
                type="button"
                className={
                  statusFilter === "all"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() =>
                  setStatusFilter("all")
                }
              >
                <span className="admin-bugreports-stat-label">
                  All Reports
                </span>

                <strong>
                  {counts.all}
                </strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "open"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() =>
                  setStatusFilter("open")
                }
              >
                <span className="admin-bugreports-stat-label">
                  Open
                </span>

                <strong>
                  {counts.open}
                </strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter ===
                  "in_progress"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() =>
                  setStatusFilter(
                    "in_progress",
                  )
                }
              >
                <span className="admin-bugreports-stat-label">
                  In Progress
                </span>

                <strong>
                  {counts.in_progress}
                </strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "resolved"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() =>
                  setStatusFilter(
                    "resolved",
                  )
                }
              >
                <span className="admin-bugreports-stat-label">
                  Resolved
                </span>

                <strong>
                  {counts.resolved}
                </strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "closed"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() =>
                  setStatusFilter("closed")
                }
              >
                <span className="admin-bugreports-stat-label">
                  Closed
                </span>

                <strong>
                  {counts.closed}
                </strong>
              </button>
            </section>

            <section className="admin-bugreports-toolbar">
              <div className="admin-bugreports-search">
                <span>
                  ⌕
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search reports, users, categories..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="admin-bugreports-status-filter"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="open">
                  Open
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>
            </section>

            <div className="admin-bugreports-results">
              <span>
                Showing{" "}
                <strong>
                  {filteredReports.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {reports.length}
                </strong>{" "}
                reports
              </span>
            </div>

            {filteredReports.length === 0 ? (
              <section className="admin-bugreports-empty">
                <div className="admin-bugreports-empty-icon">
                  ✓
                </div>

                <h2>
                  No bug reports found
                </h2>

                <p>
                  There are no reports
                  matching your current
                  search and filters.
                </p>

                {(search ||
                  statusFilter !==
                    "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter(
                        "all",
                      );
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </section>
            ) : (
              <section className="admin-bugreports-list">
                {filteredReports.map(
                  (report) => {
                    const reportId =
                      getReportId(report);

                    const title =
                      getReportTitle(
                        report,
                      );

                    const description =
                      getReportDescription(
                        report,
                      );

                    const category =
                      getReportCategory(
                        report,
                      );

                    const status =
                      normalizeStatus(
                        getReportStatus(
                          report,
                        ),
                      );

                    const screenshot =
                      getScreenshotUrl(
                        report,
                      );

                    const reporter =
                      getReporterName(
                        report,
                      );

                    const avatar =
                      getReporterAvatar(
                        report,
                      );

                    return (
                      <article
                        key={
                          reportId ??
                          `${title}-${getCreatedDate(
                            report,
                          )}`
                        }
                        className={`admin-bugreport-card status-${status}`}
                      >
                        <div className="admin-bugreport-card-accent" />

                        <div className="admin-bugreport-card-main">
                          <div className="admin-bugreport-card-header">
                            <div className="admin-bugreport-card-title">
                              <div className="admin-bugreport-card-meta">
                                <span className="admin-bugreport-category">
                                  {formatCategory(
                                    category,
                                  )}
                                </span>

                                <span
                                  className={`admin-bugreport-status status-${status}`}
                                >
                                  {formatStatus(
                                    status,
                                  )}
                                </span>
                              </div>

                              <h2>
                                {title}
                              </h2>

                              <div className="admin-bugreport-reporter">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    alt={
                                      reporter
                                    }
                                  />
                                ) : (
                                  <span className="admin-bugreport-avatar-fallback">
                                    {reporter
                                      .charAt(
                                        0,
                                      )
                                      .toUpperCase()}
                                  </span>
                                )}

                                <span>
                                  <strong>
                                    {reporter}
                                  </strong>

                                  <small>
                                    {formatDate(
                                      getCreatedDate(
                                        report,
                                      ),
                                    )}
                                  </small>
                                </span>
                              </div>
                            </div>

                            <div className="admin-bugreport-card-controls">
                              <select
                                value={
                                  status
                                }
                                disabled={
                                  updatingId !==
                                    null &&
                                  String(
                                    updatingId,
                                  ) ===
                                    String(
                                      reportId,
                                    )
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleStatusChange(
                                    report,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                aria-label={`Change status for ${title}`}
                              >
                                <option value="open">
                                  Open
                                </option>

                                <option value="in_progress">
                                  In Progress
                                </option>

                                <option value="resolved">
                                  Resolved
                                </option>

                                <option value="closed">
                                  Closed
                                </option>
                              </select>

                              <button
                                type="button"
                                className="admin-bugreport-delete"
                                disabled={
                                  deletingId !==
                                    null &&
                                  String(
                                    deletingId,
                                  ) ===
                                    String(
                                      reportId,
                                    )
                                }
                                onClick={() =>
                                  handleDelete(
                                    report,
                                  )
                                }
                              >
                                {deletingId !==
                                    null &&
                                String(
                                  deletingId,
                                ) ===
                                  String(
                                    reportId,
                                  )
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>

                          <div className="admin-bugreport-description">
                            {description ? (
                              <p>
                                {
                                  description
                                }
                              </p>
                            ) : (
                              <p className="empty-description">
                                No description
                                provided.
                              </p>
                            )}
                          </div>

                          <div className="admin-bugreport-footer">
                            <div className="admin-bugreport-details">
                              {report?.browser && (
                                <span>
                                  <strong>
                                    Browser:
                                  </strong>{" "}
                                  {
                                    report.browser
                                  }
                                </span>
                              )}

                              {report?.operating_system && (
                                <span>
                                  <strong>
                                    OS:
                                  </strong>{" "}
                                  {
                                    report.operating_system
                                  }
                                </span>
                              )}

                              {report?.page_url && (
                                <span>
                                  <strong>
                                    Page:
                                  </strong>{" "}
                                  {
                                    report.page_url
                                  }
                                </span>
                              )}
                            </div>

                            <div className="admin-bugreport-footer-actions">
                              {screenshot && (
                                <button
                                  type="button"
                                  className="admin-bugreport-screenshot-button"
                                  onClick={() =>
                                    setSelectedScreenshot(
                                      screenshot,
                                    )
                                  }
                                >
                                  ▣ View Screenshot
                                </button>
                              )}

                              <button
                                type="button"
                                className="admin-bugreport-view-button"
                                onClick={() =>
                                  setSelectedReport(
                                    report,
                                  )
                                }
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </section>
            )}
          </>
        )}
      </main>

      <Footer credits />

      {selectedReport && (
        <div
          className="admin-bugreport-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >
          <div className="admin-bugreport-modal">
            <div className="admin-bugreport-modal-header">
              <div>
                <span className="admin-bugreports-eyebrow">
                  BUG REPORT
                </span>

                <h2>
                  {getReportTitle(
                    selectedReport,
                  )}
                </h2>

                <p>
                  Submitted by{" "}
                  <strong>
                    {getReporterName(
                      selectedReport,
                    )}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="admin-bugreport-modal-close"
                onClick={closeDetails}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="admin-bugreport-modal-body">
              <div className="admin-bugreport-modal-status-row">
                <span
                  className={`admin-bugreport-status status-${normalizeStatus(
                    getReportStatus(
                      selectedReport,
                    ),
                  )}`}
                >
                  {formatStatus(
                    getReportStatus(
                      selectedReport,
                    ),
                  )}
                </span>

                <span>
                  {formatDate(
                    getCreatedDate(
                      selectedReport,
                    ),
                  )}
                </span>
              </div>

              <div className="admin-bugreport-detail-section">
                <span className="admin-bugreport-detail-label">
                  CATEGORY
                </span>

                <strong>
                  {formatCategory(
                    getReportCategory(
                      selectedReport,
                    ),
                  )}
                </strong>
              </div>

              <div className="admin-bugreport-detail-section">
                <span className="admin-bugreport-detail-label">
                  DESCRIPTION
                </span>

                <p>
                  {getReportDescription(
                    selectedReport,
                  ) ||
                    "No description provided."}
                </p>
              </div>

              <div className="admin-bugreport-detail-grid">
                {selectedReport?.browser && (
                  <div>
                    <span>
                      Browser
                    </span>

                    <strong>
                      {
                        selectedReport.browser
                      }
                    </strong>
                  </div>
                )}

                {selectedReport?.operating_system && (
                  <div>
                    <span>
                      Operating System
                    </span>

                    <strong>
                      {
                        selectedReport.operating_system
                      }
                    </strong>
                  </div>
                )}

                {selectedReport?.page_url && (
                  <div>
                    <span>
                      Page URL
                    </span>

                    <strong>
                      {
                        selectedReport.page_url
                      }
                    </strong>
                  </div>
                )}

                {selectedReport?.discord_id && (
                  <div>
                    <span>
                      Discord ID
                    </span>

                    <strong>
                      {
                        selectedReport.discord_id
                      }
                    </strong>
                  </div>
                )}
              </div>

              {selectedReport?.admin_notes && (
                <div className="admin-bugreport-detail-section">
                  <span className="admin-bugreport-detail-label">
                    ADMIN NOTES
                  </span>

                  <p>
                    {
                      selectedReport.admin_notes
                    }
                  </p>
                </div>
              )}

              {getScreenshotUrl(
                selectedReport,
              ) && (
                <div className="admin-bugreport-modal-screenshot">
                  <div className="admin-bugreport-modal-screenshot-heading">
                    <span className="admin-bugreport-detail-label">
                      SCREENSHOT
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedScreenshot(
                          getScreenshotUrl(
                            selectedReport,
                          ),
                        )
                      }
                    >
                      Open Full Size
                    </button>
                  </div>

                  <img
                    src={getScreenshotUrl(
                      selectedReport,
                    )}
                    alt="Bug report screenshot"
                    onError={(event) => {
                      console.error(
                        "Failed to load bug report screenshot:",
                        getScreenshotUrl(
                          selectedReport,
                        ),
                      );

                      event.currentTarget.style.display =
                        "none";
                    }}
                    onClick={() =>
                      setSelectedScreenshot(
                        getScreenshotUrl(
                          selectedReport,
                        ),
                      )
                    }
                  />
                </div>
              )}
            </div>

            <div className="admin-bugreport-modal-actions">
              <select
                value={normalizeStatus(
                  getReportStatus(
                    selectedReport,
                  ),
                )}
                disabled={
                  updatingId !== null &&
                  String(
                    updatingId,
                  ) ===
                    String(
                      getReportId(
                        selectedReport,
                      ),
                    )
                }
                onChange={(event) =>
                  handleStatusChange(
                    selectedReport,
                    event.target.value,
                  )
                }
              >
                <option value="open">
                  Open
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>

              <button
                type="button"
                className="admin-bugreport-modal-delete"
                onClick={() =>
                  handleDelete(
                    selectedReport,
                  )
                }
              >
                Delete Report
              </button>

              <button
                type="button"
                className="admin-bugreport-modal-cancel"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedScreenshot && (
        <div
          className="admin-bugreport-image-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedScreenshot(
                null,
              );
            }
          }}
        >
          <button
            type="button"
            className="admin-bugreport-image-close"
            onClick={() =>
              setSelectedScreenshot(
                null,
              )
            }
            aria-label="Close screenshot"
          >
            ×
          </button>

          <img
            src={selectedScreenshot}
            alt="Bug report screenshot enlarged"
            onError={(event) => {
              console.error(
                "Failed to load enlarged screenshot:",
                selectedScreenshot,
              );

              event.currentTarget.alt =
                "Unable to load screenshot";
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AdminBugReports;
