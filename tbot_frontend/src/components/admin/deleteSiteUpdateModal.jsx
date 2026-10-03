import { useState } from "react";

import {
  API_BASE_URL,
  ensureCsrfToken,
  getApiErrorMessage,
} from "../../utils/api.js";

const DeleteSiteUpdateModal = ({
  update,
  onClose,
  onDeleteComplete,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!update) {
    return null;
  }

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/updates/${update.id}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "Failed to delete site update",
          ),
        );
      }

      onDeleteComplete?.(update.id);
      onClose?.();
    } catch (err) {
      setError(
        err?.message || "Failed to delete site update.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="site-update-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onClose?.();
        }
      }}
    >
      <div
        className="site-update-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-site-update-title"
      >
        <div className="site-update-modal-header">
          <h2 id="delete-site-update-title">
            Delete Site Update
          </h2>

          <button
            type="button"
            className="site-update-modal-close"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="site-update-modal-body">
          <p>
            Are you sure you want to delete{" "}
            <strong>{update.title}</strong>?
          </p>

          <p>
            This action cannot be undone.
          </p>

          {error && (
            <div className="site-update-modal-error">
              {error}
            </div>
          )}
        </div>

        <div className="site-update-modal-footer">
          <button
            type="button"
            className="site-update-modal-cancel"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="site-update-modal-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSiteUpdateModal;