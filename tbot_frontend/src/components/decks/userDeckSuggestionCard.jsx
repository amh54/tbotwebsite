import { useEffect, useRef, useState } from "react";

import {
  formatCardsDisplay,
  formatCost,
  formatDeckDate,
  getHeroColors,
  getImageUrl,
  hasValue,
  toExternalUrl,
} from "../../utils/deckCardHelpers";

import {
  formatDate,
  formatStatus,
  getStatusDescription,
  normalizeStatus,
} from "../../utils/adminSuggestions.js";

import "../../css/decklists.css";
import "../../css/modals/deckModal.css";
import "../../css/modals/userDeckSuggestionCard.css";

const CONSENT_LABELS = {
  confirmed: "Confirmed",
  awaiting_creator: "Awaiting creator approval",
  denied: "Denied",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

function UserDeckSuggestionCard({
  suggestion,
  admin = false,
  updatingId = null,
  deletingId = null,
  onStatusChange,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const statusMenuRef = useRef(null);

  const suggestionId = suggestion?.id;
  const status = normalizeStatus(suggestion?.status);

  const [heroColor1, heroColor2] = getHeroColors(suggestion?.hero);

  const deckName = suggestion?.deck_name || "Untitled Deck";
  const deckImage = getImageUrl(suggestion?.image);

  const description = hasValue(suggestion?.description)
    ? suggestion.description
    : "No description available.";

  const submitter =
    suggestion?.suggested_by_display_name ||
    suggestion?.suggested_by_username ||
    "Unknown User";

  const consentLabel =
    CONSENT_LABELS[suggestion?.consent_status] ||
    suggestion?.consent_status ||
    "Unknown";

  const statusClass = admin ? "admin-bugreport-status" : "my-bug-report-status";

  const isUpdating =
    updatingId !== null && String(updatingId) === String(suggestionId);

  const isDeleting =
    deletingId !== null && String(deletingId) === String(suggestionId);

  const handleStatusSelect = (value) => {
    setStatusMenuOpen(false);

    if (value !== status) {
      onStatusChange(suggestion, value);
    }
  };

  useEffect(() => {
    setImgError(false);
  }, [suggestion?.image]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      setStatusMenuOpen(false);
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (statusMenuOpen) {
          setStatusMenuOpen(false);
        } else {
          setOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, statusMenuOpen]);

  useEffect(() => {
    if (!statusMenuOpen) {
      return;
    }

    const handlePointerDown = (event) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target)
      ) {
        setStatusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [statusMenuOpen]);

  return (
    <>
      <div
        className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        style={{
          cursor: "pointer",
        }}
      >
        <div className="deck-card-image-only">
          {deckImage && !imgError ? (
            <img
              src={deckImage}
              alt={deckName}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="deck-image-placeholder">No image</div>
          )}
        </div>

        <div className="deck-listing-info">
          <h3>{deckName}</h3>

          <p>
            <span>Hero:</span> {suggestion?.hero || "-"}
          </p>

          <p>
            <span>Category:</span> {suggestion?.category || "-"}
          </p>

          <p>
            <span>Archetype:</span> {suggestion?.archetype || "-"}
          </p>

          <p>
            <span>Cost:</span> {formatCost(suggestion?.cost)}
            <img
              src="https://cdn.pvzhtbot.com/icons/spark.webp"
              alt="Spark icon"
              className="spark-icon"
            />
          </p>

          {hasValue(suggestion?.creator) && (
            <p className="creator-field">
              <span className="field-label">Creator:</span>{" "}
              <span className="creator-value">{suggestion.creator}</span>
            </p>
          )}

          {hasValue(suggestion?.optimization) && (
            <p>
              <span>Optimized by:</span> {suggestion.optimization}
            </p>
          )}

          {admin && (
            <p>
              <span>Suggested by:</span> {submitter}
            </p>
          )}

          <p>
            <span>Consent:</span> {consentLabel}
          </p>

          <p>
            <span>Status:</span>{" "}
            <span className={`${statusClass} status-${status}`}>
              {formatStatus(status)}
            </span>
          </p>
        </div>
      </div>

      {open && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <dialog open className="modal" aria-label={`Details for ${deckName}`}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close details"
            >
              ×
            </button>

            <div className="modal-scroll-content">
              <div className="modal-content">
                <div className="modal-image">
                  {deckImage && !imgError ? (
                    <img
                      src={deckImage}
                      alt={deckName}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="deck-image-placeholder">No image</div>
                  )}

                  {(hasValue(suggestion?.creator) ||
                    hasValue(suggestion?.optimization) ||
                    hasValue(suggestion?.inspiration) ||
                    hasValue(suggestion?.suggested_date) ||
                    hasValue(suggestion?.updated_date)) && (
                    <div className="image-meta">
                      {(hasValue(suggestion?.creator) ||
                        hasValue(suggestion?.optimization) ||
                        hasValue(suggestion?.inspiration)) && (
                        <p>
                          {hasValue(suggestion?.creator) && (
                            <>
                              Created by <span>{suggestion.creator}</span>
                            </>
                          )}

                          {hasValue(suggestion?.optimization) && (
                            <>
                              {hasValue(suggestion?.creator) ? ", " : ""}
                              Optimized by{" "}
                              <span>{suggestion.optimization}</span>
                            </>
                          )}

                          {hasValue(suggestion?.inspiration) && (
                            <>
                              {hasValue(suggestion?.creator) ||
                              hasValue(suggestion?.optimization)
                                ? ", "
                                : ""}
                              Inspired by <span>{suggestion.inspiration}</span>
                            </>
                          )}
                        </p>
                      )}

                      {hasValue(suggestion?.suggested_date) && (
                        <p>
                          Suggested on{" "}
                          {formatDeckDate(suggestion.suggested_date)}
                        </p>
                      )}

                      {hasValue(suggestion?.updated_date) && (
                        <p>
                          Updated on {formatDeckDate(suggestion.updated_date)}
                        </p>
                      )}
                    </div>
                  )}

                  {admin && (
                    <div className="admin-modal-actions">
                      <div className="status-dropdown" ref={statusMenuRef}>
                        <button
                          type="button"
                          className="status-dropdown-trigger"
                          onClick={() =>
                            setStatusMenuOpen((current) => !current)
                          }
                          disabled={isUpdating || isDeleting}
                          aria-haspopup="listbox"
                          aria-expanded={statusMenuOpen}
                          aria-label={`Change status for ${deckName}`}
                        >
                          <span
                            className={`status-dropdown-dot status-dropdown-dot-${status}`}
                          />

                          <span className="status-dropdown-label">
                            {isUpdating ? "Updating..." : formatStatus(status)}
                          </span>

                          <span
                            className="status-dropdown-caret"
                            aria-hidden="true"
                          >
                            ▾
                          </span>
                        </button>

                        {statusMenuOpen && (
                          <ul
                            className="status-dropdown-menu"
                            role="listbox"
                            aria-label="Suggestion status"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <li key={option.value} role="presentation">
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={option.value === status}
                                  className={`status-dropdown-option${
                                    option.value === status ? " active" : ""
                                  }`}
                                  onClick={() =>
                                    handleStatusSelect(option.value)
                                  }
                                >
                                  <span
                                    className={`status-dropdown-dot status-dropdown-dot-${option.value}`}
                                  />

                                  {option.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        type="button"
                        className="admin-modal-delete"
                        onClick={() => onDelete(suggestion)}
                        disabled={isUpdating || isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete Suggestion"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="modal-info">
                  <div className="modal-header">
                    <div className="modal-title-content">
                      <h2 className="modal-title">{deckName}</h2>

                      <span className="deck-hero">
                        {suggestion?.hero || "Unknown Hero"}
                      </span>
                    </div>
                  </div>

                  <section className="modal-section description-section">
                    <h3>Description</h3>

                    <p className="description">{description}</p>
                  </section>

                  <section className="modal-metadata">
                    {hasValue(toExternalUrl(suggestion?.deck_doc)) && (
                      <div className="metadata-item">
                        <span className="label">Deck Tutorial</span>

                        <a
                          href={toExternalUrl(suggestion.deck_doc)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="deck-doc-link"
                        >
                          Open tutorial
                        </a>
                      </div>
                    )}

                    <div className="metadata-item">
                      <span className="label">Category</span>

                      <span className="value">
                        {suggestion?.category || "-"}
                      </span>
                    </div>

                    <div className="metadata-item">
                      <span className="label">Archetype</span>

                      <span className="value">
                        {suggestion?.archetype || "-"}
                      </span>
                    </div>

                    <div className="metadata-item cost-item">
                      <span className="label">Cost</span>

                      <span className="cost-value">
                        {formatCost(suggestion?.cost)}

                        <img
                          src="https://cdn.pvzhtbot.com/icons/spark.webp"
                          alt="Spark icon"
                          className="spark-icon"
                        />
                      </span>
                    </div>

                    <div className="metadata-item">
                      <span className="label">Status</span>

                      <span className="value">
                        <span className={`${statusClass} status-${status}`}>
                          {formatStatus(status)}
                        </span>
                      </span>
                    </div>

                    <div className="metadata-item">
                      <span className="label">Consent</span>

                      <span className="value">{consentLabel}</span>
                    </div>

                    {admin && (
                      <div className="metadata-item">
                        <span className="label">Suggested by</span>

                        <span className="value">{submitter}</span>
                      </div>
                    )}

                    <div className="metadata-item">
                      <span className="label">Submitted</span>

                      <span className="value">
                        {formatDate(suggestion?.created_at)}
                      </span>
                    </div>

                    {hasValue(suggestion?.updated_at) && (
                      <div className="metadata-item">
                        <span className="label">Last Updated</span>

                        <span className="value">
                          {formatDate(suggestion.updated_at)}
                        </span>
                      </div>
                    )}
                    {hasValue(suggestion?.discord_thread_url) && (
                      <div className="metadata-item">
                        <span className="label">Discord Thread</span>

                        <a
                          href={suggestion.discord_thread_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="deck-doc-link"
                        >
                          View suggestion thread
                        </a>
                      </div>
                    )}
                  </section>

                  {!admin && (
                    <section className="modal-section">
                      <p className="description">
                        {getStatusDescription(status)}
                      </p>
                    </section>
                  )}

                  {admin && (
                    <section className="modal-section admin-cards-section">
                      <h3>Cards</h3>

                      <div className="admin-cards-value">
                        {hasValue(suggestion?.cards)
                          ? formatCardsDisplay(suggestion.cards) ||
                            suggestion.cards
                          : "No cards listed."}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}

export default UserDeckSuggestionCard;
