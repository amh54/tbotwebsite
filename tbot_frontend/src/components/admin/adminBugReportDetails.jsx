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
  getReporterName,
  getScreenshotUrl,
  normalizeStatus,
} from "../../utils/bugReports.js";

function AdminBugReportDetails({
  report,
  updatingId,
  onStatusChange,
  onDelete,
  onClose,
  onViewScreenshot,
}) {
  const reportId = getReportId(report);
  const screenshot =
    getScreenshotUrl(report);
  const status = normalizeStatus(
    getReportStatus(report),
  );

  const isUpdating =
    updatingId !== null &&
    String(updatingId) === String(reportId);

  return (
    <div
      className="admin-bugreport-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
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
              {getReportTitle(report)}
            </h2>

            <p>
              Submitted by{" "}
              <strong>
                {getReporterName(report)}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="admin-bugreport-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="admin-bugreport-modal-body">
          <div className="admin-bugreport-modal-status-row">
            <span
              className={`admin-bugreport-status status-${status}`}
            >
              {formatStatus(status)}
            </span>

            <span>
              {formatDate(
                getCreatedDate(report),
              )}
            </span>
          </div>

          <div className="admin-bugreport-detail-section">
            <span className="admin-bugreport-detail-label">
              CATEGORY
            </span>

            <strong>
              {formatCategory(
                getReportCategory(report),
              )}
            </strong>
          </div>

          <div className="admin-bugreport-detail-section">
            <span className="admin-bugreport-detail-label">
              DESCRIPTION
            </span>

            <p>
              {getReportDescription(report) ||
                "No description provided."}
            </p>
          </div>

          <div className="admin-bugreport-detail-grid">
            {report?.browser && (
              <div>
                <span>Browser</span>
                <strong>
                  {report.browser}
                </strong>
              </div>
            )}

            {report?.operating_system && (
              <div>
                <span>Operating System</span>
                <strong>
                  {report.operating_system}
                </strong>
              </div>
            )}

            {report?.page_url && (
              <div>
                <span>Page URL</span>
                <strong>
                  {report.page_url}
                </strong>
              </div>
            )}

            {report?.discord_id && (
              <div>
                <span>Discord ID</span>
                <strong>
                  {report.discord_id}
                </strong>
              </div>
            )}
          </div>

          {report?.admin_notes && (
            <div className="admin-bugreport-detail-section">
              <span className="admin-bugreport-detail-label">
                ADMIN NOTES
              </span>

              <p>{report.admin_notes}</p>
            </div>
          )}

          {screenshot && (
            <div className="admin-bugreport-modal-screenshot">
              <div className="admin-bugreport-modal-screenshot-heading">
                <span className="admin-bugreport-detail-label">
                  SCREENSHOT
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onViewScreenshot(
                      screenshot,
                    )
                  }
                >
                  Open Full Size
                </button>
              </div>

              <img
                src={screenshot}
                alt="Bug report screenshot"
                onError={(event) => {
                  console.error(
                    "Failed to load bug report screenshot:",
                    screenshot,
                  );

                  event.currentTarget.style.display =
                    "none";
                }}
                onClick={() =>
                  onViewScreenshot(
                    screenshot,
                  )
                }
              />
            </div>
          )}
        </div>

        <div className="admin-bugreport-modal-actions">
          <select
            value={status}
            disabled={isUpdating}
            onChange={(event) =>
              onStatusChange(
                report,
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
            onClick={() => onDelete(report)}
          >
            Delete Report
          </button>

          <button
            type="button"
            className="admin-bugreport-modal-cancel"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminBugReportDetails;