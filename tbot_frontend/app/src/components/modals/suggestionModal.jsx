import { useEffect, useRef, useState } from "react";

import { API_BASE_URL, ensureCsrfToken } from "../../utils/api";

import "../../css/bugReportModal.css";
import "../../css/suggestionModal.css";

const SUGGESTION_CATEGORIES = [
  {
    value: "improvement",
    label: "Improvement",
    description: "Improve something that already exists on Tbot.",
  },
  {
    value: "feature",
    label: "New Feature",
    description: "Suggest something new Tbot could add.",
  },
  {
    value: "ui",
    label: "UI / Design",
    description: "Suggest changes to the website's appearance or usability.",
  },
  {
    value: "performance",
    label: "Performance",
    description:
      "Suggest ways to make Tbot faster, smoother, or more reliable.",
  },
  {
    value: "other",
    label: "Other",
    description: "Something that does not fit the other categories.",
  },
];

const SUGGESTION_PAGES = [
  {
    value: "/",
    label: "Home",
  },
  {
    value: "/tutorial",
    label: "Tutorial",
  },
  {
    value: "/decklists",
    label: "Decklists",
  },
  {
    value: "/legacydecks",
    label: "Legacy Decks",
  },
  {
    value: "/deckbuilders",
    label: "Deckbuilders",
  },
  {
    value: "/cardinfo",
    label: "Card Info",
  },
  {
    value: "/heroinfo",
    label: "Hero Info",
  },
  {
    value: "/keeporscrap",
    label: "Keep or Scrap",
  },
  {
    value: "/users",
    label: "Users",
  },
  {
    value: "/updates",
    label: "Site Updates",
  },
  {
    value: "/my-suggestions",
    label: "My Suggestions",
  },
];

function SuggestionModal({ open, user, profile, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("improvement");
  const [page, setPage] = useState("");
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const pageDropdownRef = useRef(null);

  const userName =
    profile?.display_name ||
    user?.display_name ||
    user?.global_name ||
    user?.username ||
    "Discord User";

  const userInitial = userName.charAt(0).toUpperCase();

  const selectedCategory =
    SUGGESTION_CATEGORIES.find((item) => item.value === category) ||
    SUGGESTION_CATEGORIES[0];

  const selectedPage =
    SUGGESTION_PAGES.find((item) => item.value === page) || null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle("");
    setDescription("");
    setCategory("improvement");
    setPage("");
    setPageDropdownOpen(false);
    setSubmitting(false);
    setMessage("");
  }, [open]);

  useEffect(() => {
    if (!pageDropdownOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (
        pageDropdownRef.current &&
        !pageDropdownRef.current.contains(event.target)
      ) {
        setPageDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [pageDropdownOpen]);

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;

    setCategory(newCategory);

    if (newCategory !== "improvement") {
      setPage("");
      setPageDropdownOpen(false);
    }
  };

  const handlePageChange = (value) => {
    setPage(value);
    setPageDropdownOpen(false);
  };

  const handlePageKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown"
    ) {
      event.preventDefault();
      setPageDropdownOpen(true);
      return;
    }

    if (event.key === "Escape") {
      setPageDropdownOpen(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setMessage("Please enter a title.");
      return;
    }

    if (!trimmedDescription) {
      setMessage("Please describe your suggestion.");
      return;
    }

    if (!user?.id) {
      setMessage("You must be logged in with Discord to submit a suggestion.");
      return;
    }

    if (category === "improvement" && !page) {
      setMessage("Please select the page your suggestion is about.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setPageDropdownOpen(false);

    try {
      const csrfToken = await ensureCsrfToken();

      const pageUrl =
        category === "improvement" && page
          ? `${window.location.origin}${page}`
          : "";

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/suggestions/create/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            title: trimmedTitle,
            description: trimmedDescription,
            category,
            page_url: pageUrl,
          }),
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
          data.detail || data.error || "Unable to submit suggestion.",
        );
      }

      setMessage("Suggestion submitted successfully!");

      setTitle("");
      setDescription("");
      setCategory("improvement");
      setPage("");

      setTimeout(() => {
        onClose();
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error("Unable to submit suggestion:", error);

      setMessage(error.message || "Unable to submit suggestion.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  const isSuccess = message.includes("successfully");

  return (
    <div className="bug-report-modal-overlay">
      <button
        type="button"
        className="bug-report-modal-backdrop"
        onClick={onClose}
        disabled={submitting}
        aria-label="Close suggestion form"
      />

      <dialog
        className="bug-report-modal suggestion-modal"
        open
        aria-labelledby="suggestion-modal-title"
      >
        <div className="bug-report-modal-header">
          <div className="bug-report-modal-title-area">
            <div
              className="bug-report-modal-icon suggestion-modal-icon"
              aria-hidden="true"
            />

            <div>
              <span className="bug-report-modal-eyebrow">TBOT FEEDBACK</span>

              <h2 id="suggestion-modal-title">Submit a Suggestion</h2>

              <p>
                Have an idea that could make Tbot better? Tell us what you'd
                like to see.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="bug-report-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close suggestion form"
          >
            &times;
          </button>
        </div>

        <form className="bug-report-form" onSubmit={handleSubmit}>
          <div className="bug-report-section">
            <div className="bug-report-section-heading">
              <span>1</span>

              <div>
                <h3>What would you like to see?</h3>

                <p>Give your suggestion a clear title and explain your idea.</p>
              </div>
            </div>

            <div className="bug-report-field">
              <label htmlFor="suggestion-title">
                <span>Title</span>
                <span className="bug-report-required">*</span>
              </label>

              <input
                id="suggestion-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Briefly describe your suggestion"
                maxLength={255}
                disabled={submitting}
                required
              />

              <small>Keep it short and specific.</small>
            </div>

            <div className="bug-report-field">
              <label htmlFor="suggestion-description">
                <span>Description</span>
                <span className="bug-report-required">*</span>
              </label>

              <textarea
                id="suggestion-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain your idea, why it would be useful, and how you think it could work."
                rows={7}
                disabled={submitting}
                required
              />

              <small>
                The more detail you provide, the easier it is to evaluate the
                idea.
              </small>
            </div>
          </div>

          <div className="bug-report-section">
            <div className="bug-report-section-heading">
              <span>2</span>

              <div>
                <h3>Choose a category</h3>

                <p>This helps organize suggestions for review.</p>
              </div>
            </div>

            <div className="bug-report-field">
              <label htmlFor="suggestion-category">Category</label>

              <select
                id="suggestion-category"
                value={category}
                onChange={handleCategoryChange}
                disabled={submitting}
              >
                {SUGGESTION_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <small>{selectedCategory.description}</small>
            </div>

            {category === "improvement" && (
              <div className="bug-report-field">
                <label id="suggestion-page-label">
                  <span>Page</span>
                  <span className="bug-report-required">*</span>
                </label>

                <div className="suggestion-page-dropdown" ref={pageDropdownRef}>
                  <button
                    type="button"
                    id="suggestion-page"
                    className={`suggestion-page-dropdown-trigger ${
                      pageDropdownOpen ? "open" : ""
                    }`}
                    onClick={() =>
                      !submitting && setPageDropdownOpen((current) => !current)
                    }
                    onKeyDown={handlePageKeyDown}
                    disabled={submitting}
                    aria-haspopup="listbox"
                    aria-expanded={pageDropdownOpen}
                    aria-labelledby="suggestion-page-label"
                  >
                    <span
                      className={
                        selectedPage ? "" : "suggestion-page-placeholder"
                      }
                    >
                      {selectedPage?.label || "Select a page"}
                    </span>

                    <span
                      className="suggestion-page-dropdown-arrow"
                      aria-hidden="true"
                    />
                  </button>

                  {pageDropdownOpen && (
                    <div
                      className="suggestion-page-dropdown-menu"
                      role="listbox"
                      aria-labelledby="suggestion-page-label"
                    >
                      {SUGGESTION_PAGES.map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          className={`suggestion-page-dropdown-option ${
                            page === item.value ? "selected" : ""
                          }`}
                          onClick={() => handlePageChange(item.value)}
                          role="option"
                          aria-selected={page === item.value}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <small>
                  Select the Tbot page your improvement suggestion is about.
                </small>
              </div>
            )}
          </div>

          <div className="bug-report-user-info">
            <div className="bug-report-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={`${userName}'s Discord avatar`} />
              ) : (
                userInitial
              )}
            </div>

            <div>
              <span>Suggestion submitted by</span>
              <strong>{userName}</strong>
            </div>
          </div>

          {message && (
            <div
              className={`bug-report-message ${
                isSuccess ? "success" : "error"
              }`}
              role="alert"
            >
              <span className="bug-report-message-icon">
                {isSuccess ? "✓" : "!"}
              </span>

              <span>
                {message}

                {isSuccess && (
                  <>
                    {" "}
                    Join the{" "}
                    <a
                      href="https://discord.gg/WWrzNZ4hhP"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tbot Discord
                    </a>{" "}
                    to see your suggestion in the website suggestions forum.
                  </>
                )}
              </span>
            </div>
          )}

          <div className="bug-report-actions">
            <button
              type="button"
              className="bug-report-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bug-report-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="bug-report-spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Suggestion</span>
              )}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default SuggestionModal;
