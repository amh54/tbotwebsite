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
  getSubmitterName,
  getUpdatedDate,
  normalizeStatus,
} from "../../utils/adminSuggestions.js";

function SuggestionDetailsModal({
  suggestion,
  adminResponse,
  setAdminResponse,
  adminNotes,
  setAdminNotes,
  savingDetails,
  updatingId,
  onStatusChange,
  onSave,
  onDelete,
  onClose,
}) {
  const suggestionId = getSuggestionId(suggestion);

  const status = normalizeStatus(getSuggestionStatus(suggestion));

  const title = getSuggestionTitle(suggestion);
  const reporter = getSubmitterName(suggestion);

  return (
    <div
      className="admin-bugreport-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="admin-bugreport-modal">
        <div className="admin-bugreport-modal-header">
          <div>
            <span className="admin-bugreports-eyebrow">SUGGESTION</span>

            <h2>{title}</h2>

            <p>
              Submitted by <strong>{reporter}</strong>
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
            <span className={`admin-bugreport-status status-${status}`}>
              {formatStatus(getSuggestionStatus(suggestion))}
            </span>

            <span>{formatDate(getCreatedDate(suggestion))}</span>
          </div>

          <div className="admin-bugreport-detail-section">
            <span className="admin-bugreport-detail-label">CATEGORY</span>

            <strong>{formatCategory(getSuggestionCategory(suggestion))}</strong>
          </div>

          <div className="admin-bugreport-detail-section">
            <span className="admin-bugreport-detail-label">DESCRIPTION</span>

            <p>
              {getSuggestionDescription(suggestion) ||
                "No description provided."}
            </p>
          </div>

          <div className="admin-bugreport-detail-grid">
            {suggestion?.browser && (
              <div>
                <span>Browser</span>
                <strong>{suggestion.browser}</strong>
              </div>
            )}

            {suggestion?.operating_system && (
              <div>
                <span>Operating System</span>
                <strong>{suggestion.operating_system}</strong>
              </div>
            )}

            {suggestion?.page_url && (
              <div>
                <span>Page URL</span>
                <strong>{suggestion.page_url}</strong>
              </div>
            )}

            {suggestion?.discord_id && (
              <div>
                <span>Discord ID</span>
                <strong>{suggestion.discord_id}</strong>
              </div>
            )}

            {getUpdatedDate(suggestion) && (
              <div>
                <span>Last Updated</span>
                <strong>{formatDate(getUpdatedDate(suggestion))}</strong>
              </div>
            )}
          </div>

          <div className="admin-bugreport-detail-section admin-suggestion-editor">
            <span className="admin-bugreport-detail-label">ADMIN RESPONSE</span>

            <textarea
              value={adminResponse}
              onChange={(event) => setAdminResponse(event.target.value)}
              placeholder="Write a response that will be visible to the user..."
              rows={5}
              disabled={savingDetails}
            />
          </div>

          <div className="admin-bugreport-detail-section admin-suggestion-editor">
            <span className="admin-bugreport-detail-label">ADMIN NOTES</span>

            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Private notes for admins..."
              rows={4}
              disabled={savingDetails}
            />
          </div>

          {suggestion?.admin_response && (
            <div className="admin-bugreport-detail-section">
              <span className="admin-bugreport-detail-label">
                CURRENT USER RESPONSE
              </span>

              <p>{suggestion.admin_response}</p>
            </div>
          )}

          {suggestion?.admin_notes && (
            <div className="admin-bugreport-detail-section">
              <span className="admin-bugreport-detail-label">
                CURRENT ADMIN NOTES
              </span>

              <p>{suggestion.admin_notes}</p>
            </div>
          )}
        </div>

        <div className="admin-bugreport-modal-actions">
          <select
            value={status}
            disabled={
              updatingId !== null && String(updatingId) === String(suggestionId)
            }
            onChange={(event) => onStatusChange(suggestion, event.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>

          <button
            type="button"
            className="admin-suggestion-save"
            onClick={onSave}
            disabled={savingDetails}
          >
            {savingDetails ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            className="admin-bugreport-modal-delete"
            onClick={() => onDelete(suggestion)}
          >
            Delete Suggestion
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

export default SuggestionDetailsModal;
