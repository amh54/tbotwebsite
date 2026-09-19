import {
  formatCategory,
  formatDate,
  formatStatus,
  getCreatedDate,
  getSuggestionCategory,
  getSuggestionDescription,
  getSuggestionId,
  getSuggestionStatus,
  getSuggestionTitle,
  getSubmitterAvatar,
  getSubmitterName,
  normalizeStatus,
} from "../../utils/adminSuggestions.js";

function SuggestionCard({
  suggestion,
  updatingId,
  deletingId,
  onStatusChange,
  onDelete,
  onViewDetails,
}) {
  const suggestionId = getSuggestionId(suggestion);
  const title = getSuggestionTitle(suggestion);
  const description = getSuggestionDescription(suggestion);
  const category = getSuggestionCategory(suggestion);

  const status = normalizeStatus(getSuggestionStatus(suggestion));

  const reporter = getSubmitterName(suggestion);
  const avatar = getSubmitterAvatar(suggestion);

  return (
    <article
      key={suggestionId ?? `${title}-${getCreatedDate(suggestion)}`}
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

              <span className={`admin-bugreport-status status-${status}`}>
                {formatStatus(status)}
              </span>
            </div>

            <h2>{title}</h2>

            <div className="admin-bugreport-reporter">
              {avatar ? (
                <img src={avatar} alt={reporter} />
              ) : (
                <span className="admin-bugreport-avatar-fallback">
                  {reporter.charAt(0).toUpperCase()}
                </span>
              )}

              <span>
                <strong>{reporter}</strong>

                <small>{formatDate(getCreatedDate(suggestion))}</small>
              </span>
            </div>
          </div>

          <div className="admin-bugreport-card-controls">
            <select
              value={status}
              disabled={
                updatingId !== null &&
                String(updatingId) === String(suggestionId)
              }
              onChange={(event) =>
                onStatusChange(suggestion, event.target.value)
              }
              aria-label={`Change status for ${title}`}
            >
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>

            <button
              type="button"
              className="admin-bugreport-delete"
              disabled={
                deletingId !== null &&
                String(deletingId) === String(suggestionId)
              }
              onClick={() => onDelete(suggestion)}
            >
              {deletingId !== null &&
              String(deletingId) === String(suggestionId)
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </div>

        <div className="admin-bugreport-description">
          {description ? (
            <p>{description}</p>
          ) : (
            <p className="empty-description">No description provided.</p>
          )}
        </div>

        <div className="admin-bugreport-footer">
          <div className="admin-bugreport-details">
            {suggestion?.browser && (
              <span>
                <strong>Browser:</strong> {suggestion.browser}
              </span>
            )}

            {suggestion?.operating_system && (
              <span>
                <strong>OS:</strong> {suggestion.operating_system}
              </span>
            )}

            {suggestion?.page_url && (
              <span>
                <strong>Page:</strong> {suggestion.page_url}
              </span>
            )}
          </div>

          <div className="admin-bugreport-footer-actions">
            {suggestion?.admin_response && (
              <span className="admin-suggestion-response-badge">
                ✓ Response Sent
              </span>
            )}

            <button
              type="button"
              className="admin-bugreport-view-button"
              onClick={() => onViewDetails(suggestion)}
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default SuggestionCard;
