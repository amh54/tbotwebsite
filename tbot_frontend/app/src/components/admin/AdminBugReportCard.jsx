import {
  formatCategory,
  formatDate,
  formatStatus,
  getCreatedDate,
  getReportCategory,
  getReportDescription,
  getReportId,
  getReportStatus,
  getReportTitle,
  getReporterAvatar,
  getReporterName,
  getScreenshotUrl,
  normalizeStatus,
} from "../../utils/bugReports.js";

function AdminBugReportCard({
  report,
  updatingId,
  deletingId,
  onStatusChange,
  onDelete,
  onViewDetails,
  onViewScreenshot,
}) {
  const reportId = getReportId(report);
  const title = getReportTitle(report);
  const description =
    getReportDescription(report);
  const category =
    getReportCategory(report);
  const status = normalizeStatus(
    getReportStatus(report),
  );
  const screenshot =
    getScreenshotUrl(report);
  const reporter =
    getReporterName(report);
  const avatar =
    getReporterAvatar(report);

  const isUpdating =
    updatingId !== null &&
    String(updatingId) === String(reportId);

  const isDeleting =
    deletingId !== null &&
    String(deletingId) === String(reportId);

  return (
    <article
      className={`admin-bugreport-card status-${status}`}
    >
      <div className="admin-bugreport-card-accent" />

      <div className="admin-bugreport-card-main">
        <div className="admin-bugreport-card-header">
          <div className="admin-bugreport-card-title">
            <div className="admin-bugreport-card-meta">
              <span className="admin-bugreport-category">
                {formatCategory(category)}
              </span>

              <span
                className={`admin-bugreport-status status-${status}`}
              >
                {formatStatus(status)}
              </span>
            </div>

            <h2>{title}</h2>

            <div className="admin-bugreport-reporter">
              {avatar ? (
                <img
                  src={avatar}
                  alt={reporter}
                />
              ) : (
                <span className="admin-bugreport-avatar-fallback">
                  {reporter
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <span>
                <strong>{reporter}</strong>

                <small>
                  {formatDate(
                    getCreatedDate(report),
                  )}
                </small>
              </span>
            </div>
          </div>

          <div className="admin-bugreport-card-controls">
            <select
              value={status}
              disabled={isUpdating}
              onChange={(event) =>
                onStatusChange(
                  report,
                  event.target.value,
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
              disabled={isDeleting}
              onClick={() =>
                onDelete(report)
              }
            >
              {isDeleting
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </div>

        <div className="admin-bugreport-description">
          {description ? (
            <p>{description}</p>
          ) : (
            <p className="empty-description">
              No description provided.
            </p>
          )}
        </div>

        <div className="admin-bugreport-footer">
          <div className="admin-bugreport-details">
            {report?.browser && (
              <span>
                <strong>Browser:</strong>{" "}
                {report.browser}
              </span>
            )}

            {report?.operating_system && (
              <span>
                <strong>OS:</strong>{" "}
                {report.operating_system}
              </span>
            )}

            {report?.page_url && (
              <span>
                <strong>Page:</strong>{" "}
                {report.page_url}
              </span>
            )}
          </div>

          <div className="admin-bugreport-footer-actions">
            {screenshot && (
              <button
                type="button"
                className="admin-bugreport-screenshot-button"
                onClick={() =>
                  onViewScreenshot(
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
                onViewDetails(report)
              }
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default AdminBugReportCard;