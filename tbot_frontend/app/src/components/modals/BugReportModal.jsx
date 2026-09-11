import { useEffect, useState } from "react";

import { API_BASE_URL, ensureCsrfToken } from "../../utils/api";
import { getBrowser, getOperatingSystem } from "../../utils/browserInfo";

import "../css/navbar.css";

function BugReportModal({ open, user, profile, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const userName =
    profile?.display_name ||
    user?.display_name ||
    user?.global_name ||
    user?.username ||
    "Discord User";

  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle("");
    setDescription("");
    setCategory("other");
    setPriority("normal");
    setScreenshot(null);
    setMessage("");
  }, [open]);

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setScreenshot(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file for the screenshot.");
      event.target.value = "";
      setScreenshot(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Screenshot must be smaller than 10 MB.");
      event.target.value = "";
      setScreenshot(null);
      return;
    }

    setMessage("");
    setScreenshot(file);
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
      setMessage("Please enter a description.");
      return;
    }

    if (!user?.id) {
      setMessage("You must be logged in with Discord to submit a bug report.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const csrfToken = await ensureCsrfToken();
      const formData = new FormData();

      formData.append("title", trimmedTitle);
      formData.append("description", trimmedDescription);
      formData.append("page_url", window.location.href);
      formData.append("category", category);
      formData.append("priority", priority);
      formData.append("browser", getBrowser());
      formData.append("operating_system", getOperatingSystem());
      formData.append("discord_id", String(user.id));
      formData.append("discord_username", user.username || "");

      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/bug-reports/create/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          body: formData,
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
          data.detail || data.error || "Unable to submit bug report.",
        );
      }

      setMessage("Bug report submitted successfully. Thank you!");
      setTitle("");
      setDescription("");
      setCategory("other");
      setPriority("normal");
      setScreenshot(null);

      setTimeout(() => {
        onClose();
        setMessage("");
      }, 1200);
    } catch (error) {
      console.error("Unable to submit bug report:", error);
      setMessage(error.message || "Unable to submit bug report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="bug-report-modal-overlay">
      <button
        type="button"
        className="bug-report-modal-backdrop"
        onClick={onClose}
        disabled={submitting}
        aria-label="Close bug report"
      />

      <dialog
        className="bug-report-modal"
        open
        aria-labelledby="bug-report-modal-title"
      >
        <div className="bug-report-modal-header">
          <div className="bug-report-modal-title-area">
            <div className="bug-report-modal-icon" aria-hidden="true" />

            <div>
              <span className="bug-report-modal-eyebrow">TBOT SUPPORT</span>

              <h2 id="bug-report-modal-title">Report a Bug</h2>

              <p>
                Found something that isn't working correctly? Give us the
                details and we'll investigate it.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="bug-report-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close bug report"
          >
            &times;
          </button>
        </div>

        <form className="bug-report-form" onSubmit={handleSubmit}>
          <div className="bug-report-section">
            <div className="bug-report-section-heading">
              <span>1</span>

              <div>
                <h3>What happened?</h3>
                <p>Tell us what went wrong.</p>
              </div>
            </div>

            <div className="bug-report-field">
              <label htmlFor="bug-report-title">
                <span>Title</span>
                <span className="bug-report-required">*</span>
              </label>
              <input
                id="bug-report-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Decklist filter isn't working"
                maxLength={255}
                disabled={submitting}
                required
              />

              <small>Keep it short and descriptive.</small>
            </div>

            <div className="bug-report-field">
              <label htmlFor="bug-report-description">
                <span>Description</span>
                <span className="bug-report-required">*</span>
              </label>

              <textarea
                id="bug-report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell us what happened, what you expected to happen, and the steps needed to reproduce the issue."
                rows={7}
                disabled={submitting}
                required
              />

              <small>Include as much detail as possible.</small>
            </div>
          </div>

          <div className="bug-report-section">
            <div className="bug-report-section-heading">
              <span>2</span>

              <div>
                <h3>Help us categorize it</h3>
                <p>This helps us determine where the problem belongs.</p>
              </div>
            </div>

            <div className="bug-report-field-row">
              <div className="bug-report-field">
                <label htmlFor="bug-report-category">Category</label>

                <select
                  id="bug-report-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={submitting}
                >
                  <option value="ui">UI</option>
                  <option value="decklists">Decklists</option>
                  <option value="cards">Cards</option>
                  <option value="account">Account</option>
                  <option value="discord">Discord</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bug-report-field">
                <label htmlFor="bug-report-priority">Priority</label>

                <select
                  id="bug-report-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  disabled={submitting}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bug-report-section">
            <div className="bug-report-section-heading">
              <span>3</span>

              <div>
                <h3>Technical details</h3>
                <p>Some information is captured automatically.</p>
              </div>
            </div>

            <div className="bug-report-field">
              <label htmlFor="bug-report-page-url">Page URL</label>

              <input
                id="bug-report-page-url"
                type="text"
                value={window.location.href}
                readOnly
                disabled={submitting}
              />

              <small>
                Automatically captured from the page where you opened this
                report.
              </small>
            </div>

            <div className="bug-report-field-row">
              <div className="bug-report-field">
                <label htmlFor="bug-report-browser">Browser</label>

                <input
                  id="bug-report-browser"
                  type="text"
                  value={getBrowser()}
                  readOnly
                  disabled={submitting}
                />
              </div>

              <div className="bug-report-field">
                <label htmlFor="bug-report-operating-system">
                  Operating System
                </label>

                <input
                  id="bug-report-operating-system"
                  type="text"
                  value={getOperatingSystem()}
                  readOnly
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="bug-report-section">
            <div className="bug-report-section-heading">
              <span>4</span>

              <div>
                <h3>Add a screenshot</h3>

                <p>Screenshots can make visual bugs much easier to diagnose.</p>
              </div>
            </div>

            <div className="bug-report-upload">
              <label
                htmlFor="bug-report-screenshot"
                className="bug-report-upload-area"
              >
                <span className="bug-report-upload-icon">+</span>

                <span className="bug-report-upload-title">
                  {screenshot ? "Screenshot selected" : "Choose a screenshot"}
                </span>

                <span className="bug-report-upload-description">
                  {screenshot
                    ? screenshot.name
                    : "PNG, JPG, WEBP, or another image format"}
                </span>

                <span className="bug-report-upload-limit">
                  Maximum file size: 10 MB
                </span>

                <input
                  id="bug-report-screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  disabled={submitting}
                />
              </label>

              {screenshot && (
                <div className="bug-report-file-name">
                  <span>Selected file:</span>
                  <strong>{screenshot.name}</strong>
                </div>
              )}
            </div>
          </div>

          {user && (
            <div className="bug-report-user-info">
              <div className="bug-report-user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={`${userName}'s Discord avatar`} />
                ) : (
                  userInitial
                )}
              </div>

              <div>
                <span>Report submitted by</span>
                <strong>{userName}</strong>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`bug-report-message ${
                message.includes("successfully") ? "success" : "error"
              }`}
              role="alert"
            >
              <span className="bug-report-message-icon">
                {message.includes("successfully") ? "✓" : "!"}
              </span>

              <span>{message}</span>
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
                <>
                  <span>Submit Bug Report</span>
                  <span className="bug-report-submit-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default BugReportModal;
