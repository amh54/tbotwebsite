import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Footer from "../components/footer";

import AdminBugReportCard from "../components/admin/AdminBugReportCard";
import AdminBugReportDetails from "../components/admin/AdminBugReportDetails";
import AdminBugReportImageModal from "../components/admin/AdminBugReportImageModal";
import AdminBugReportStats from "../components/admin/AdminBugReportStats";
import AdminBugReportsToolbar from "../components/admin/AdminBugReportsToolbar";

import "../css/adminbugreports.css";
import "../css/loading.css";

import {
  API_BASE_URL,
  ensureCsrfToken,
  getApiErrorMessage,
} from "../utils/api.js";

import {
  getCreatedDate,
  getReportCategory,
  getReportDescription,
  getReportId,
  getReportStatus,
  getReportTitle,
  getReporterName,
  normalizeStatus,
  normalizeText,
} from "../utils/bugReports.js";

function AdminBugReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] =
    useState("");

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

      let token =
        await ensureCsrfToken();

      let response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/bugs/${reportId}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            "X-CSRFToken": token,
          },
          body: JSON.stringify({
            status: normalizedStatus,
          }),
        },
      );

      if (response.status === 403) {
        token =
          await ensureCsrfToken(true);

        response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/bugs/${reportId}/`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type":
                "application/json",
              "X-CSRFToken": token,
            },
            body: JSON.stringify({
              status: normalizedStatus,
            }),
          },
        );
      }

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

      setReports((currentReports) =>
        currentReports.map(
          (currentReport) =>
            String(
              getReportId(
                currentReport,
              ),
            ) === String(reportId)
              ? updatedReport || {
                  ...currentReport,
                  status:
                    normalizedStatus,
                }
              : currentReport,
        ),
      );

      setSelectedReport(
        (current) => {
          if (
            !current ||
            String(
              getReportId(current),
            ) !== String(reportId)
          ) {
            return current;
          }

          return updatedReport || {
            ...current,
            status: normalizedStatus,
          };
        },
      );
    } catch (err) {
      console.error(
        "Unable to update bug report:",
        err,
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update bug report.",
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

    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(reportId);
      setActionError("");

      let token =
        await ensureCsrfToken();

      let response = await fetch(
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

      if (response.status === 403) {
        token =
          await ensureCsrfToken(true);

        response = await fetch(
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
      }

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
              ) !== String(reportId),
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
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
            dashboard and loading
            submitted reports.
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

            <h1>Bug Reports</h1>

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

            <span>{error}</span>
          </div>
        )}

        {actionError && (
          <div className="admin-bugreports-error">
            <strong>
              Action failed
            </strong>

            <span>{actionError}</span>

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
            <AdminBugReportStats
              counts={counts}
              statusFilter={statusFilter}
              onStatusChange={
                setStatusFilter
              }
            />

            <AdminBugReportsToolbar
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={
                setStatusFilter
              }
            />

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
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </section>
            ) : (
              <section className="admin-bugreports-list">
                {filteredReports.map(
                  (report) => (
                    <AdminBugReportCard
                      key={
                        getReportId(
                          report,
                        ) ??
                        `${getReportTitle(
                          report,
                        )}-${getCreatedDate(
                          report,
                        )}`
                      }
                      report={report}
                      updatingId={updatingId}
                      deletingId={deletingId}
                      onStatusChange={
                        handleStatusChange
                      }
                      onDelete={
                        handleDelete
                      }
                      onViewDetails={
                        setSelectedReport
                      }
                      onViewScreenshot={
                        setSelectedScreenshot
                      }
                    />
                  ),
                )}
              </section>
            )}
          </>
        )}
      </main>

      <Footer credits />

      {selectedReport && (
        <AdminBugReportDetails
          report={selectedReport}
          updatingId={updatingId}
          onStatusChange={
            handleStatusChange
          }
          onDelete={handleDelete}
          onClose={() =>
            setSelectedReport(null)
          }
          onViewScreenshot={
            setSelectedScreenshot
          }
        />
      )}

      <AdminBugReportImageModal
        screenshot={selectedScreenshot}
        onClose={() =>
          setSelectedScreenshot(null)
        }
      />
    </div>
  );
}

export default AdminBugReports;