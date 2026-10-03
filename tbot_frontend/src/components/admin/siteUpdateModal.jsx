import { useEffect, useState } from "react";

import Select from "react-select";

import TextArea from "./textArea";
import TextField from "./textField";
import RequiredLabel from "./requiredLabel";

import { API_BASE_URL } from "../../utils/api.js";

import "../../css/admin/siteUpdateModal.css";

const CATEGORY_OPTIONS = [
  { value: "new_feature", label: "New Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bug_fix", label: "Bug Fix" },
  { value: "data", label: "Data" },
  { value: "announcement", label: "Announcement" },
  { value: "ui_design", label: "UI / Design" },
  { value: "new_deck", label: "New Deck" },
  { value: "deck_update", label: "Deck Update" },
  { value: "deleted_deck", label: "Deleted Deck" },
  { value: "other", label: "Other" },
];

const selectStyles = {
  container: (base) => ({
    ...base,
    width: "100%",
  }),

  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    height: "42px",
    borderRadius: "7px",
    border: `1px solid ${
      state.isFocused ? "#8fe38b" : "#3a4245"
    }`,
    backgroundColor: "#171d20",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(143, 227, 139, 0.12)"
      : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#566164",
    },
  }),

  valueContainer: (base) => ({
    ...base,
    height: "40px",
    padding: "0 12px",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#f1f5f2",
    fontSize: "13px",
    fontWeight: 500,
  }),

  placeholder: (base) => ({
    ...base,
    color: "#7f898c",
    fontSize: "13px",
  }),

  input: (base) => ({
    ...base,
    color: "#f1f5f2",
    fontSize: "13px",
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    padding: "0 10px",
    color: state.isFocused ? "#8fe38b" : "#7f898c",
    transition: "color 0.15s ease",
    "&:hover": {
      color: "#8fe38b",
    },
  }),

  clearIndicator: (base) => ({
    ...base,
    padding: "0 4px",
    color: "#7f898c",
    "&:hover": {
      color: "#e99494",
    },
  }),

  menu: (base) => ({
    ...base,
    marginTop: "5px",
    marginBottom: "5px",
    backgroundColor: "#171d20",
    border: "1px solid #3a4245",
    borderRadius: "7px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
    overflow: "hidden",
    zIndex: 10001,
  }),

  menuList: (base) => ({
    ...base,
    padding: "4px",
    maxHeight: "240px",
  }),

  option: (base, state) => ({
    ...base,
    padding: "9px 11px",
    borderRadius: "5px",
    backgroundColor: state.isSelected
      ? "rgba(143, 227, 139, 0.14)"
      : state.isFocused
        ? "rgba(143, 227, 139, 0.07)"
        : "transparent",
    color: state.isSelected ? "#8fe38b" : "#dfe7e2",
    fontSize: "13px",
    fontWeight: state.isSelected ? 600 : 400,
    cursor: "pointer",
    "&:active": {
      backgroundColor: "rgba(143, 227, 139, 0.14)",
    },
  }),
};

const getInitialForm = (update) => ({
  title: update?.title || "",
  content: update?.content || "",
  category: update?.category || "new_feature",
  page_url: update?.page_url || "",
  published: update ? Boolean(update.published) : true,
});

const getCsrfToken = () => {
  const match = document.cookie.match(
    /(?:^|;\s*)csrftoken=([^;]+)/,
  );

  return match ? decodeURIComponent(match[1]) : "";
};

function SiteUpdateModal({
  open,
  update = null,
  onClose,
  onComplete,
}) {
  const [form, setForm] = useState(getInitialForm(update));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(update);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";

    setForm(getInitialForm(update));
    setError("");

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, update]);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  const handleSave = async () => {
    if (!String(form.title || "").trim()) {
      setError("Title is required.");
      return;
    }

    if (!String(form.content || "").trim()) {
      setError("Content is required.");
      return;
    }

    if (!String(form.category || "").trim()) {
      setError("Category is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const endpoint = editing
        ? `${API_BASE_URL}/tbotapp/admin/updates/${update.id}/`
        : `${API_BASE_URL}/tbotapp/admin/updates/create/`;

      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        body: JSON.stringify({
          title: String(form.title || "").trim(),
          content: String(form.content || "").trim(),
          category: String(form.category || "").trim(),
          page_url: String(form.page_url || "").trim() || null,
          published: Boolean(form.published),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            `Unable to ${
              editing ? "update" : "create"
            } site update: ${response.status}`,
        );
      }

      onComplete?.(data);
    } catch (requestError) {
      console.error("Unable to save site update:", requestError);

      setError(
        requestError?.message ||
          `Unable to ${
            editing ? "update" : "create"
          } the site update right now.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  const selectedCategory =
    CATEGORY_OPTIONS.find(
      (option) => option.value === form.category,
    ) || null;

  return (
    <div className="modal-overlay">
      <dialog
        open
        className="modal site-update-modal"
        aria-label={
          editing ? "Edit Site Update" : "Create Site Update"
        }
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close site update"
        >
          ×
        </button>

        <div className="modal-scroll-content">
          <div className="modal-content">
            <div className="modal-info">
              <div className="modal-header">
                <div className="modal-title-content">
                  <h2>
                    {editing
                      ? "Edit Site Update"
                      : "Create Site Update"}
                  </h2>

                  <p>
                    {editing
                      ? "Update the information displayed on the public Site Updates page."
                      : "Create a new update for the public Site Updates page."}
                  </p>
                </div>
              </div>

              <section className="modal-section">
                <div className="site-update-modal-fields">
                  <TextField
                    label="Title"
                    value={form.title}
                    onChange={(value) =>
                      handleChange("title", value)
                    }
                    required
                  />

                  <div className="admin-modal-field">
                    <span className="admin-modal-label">
                      <RequiredLabel>Category</RequiredLabel>
                    </span>

                    <Select
                      className="site-update-category-select"
                      classNamePrefix="site-update-select"
                      options={CATEGORY_OPTIONS}
                      value={selectedCategory}
                      onChange={(selected) =>
                        handleChange(
                          "category",
                          selected?.value || "",
                        )
                      }
                      isSearchable={false}
                      isClearable={false}
                      isDisabled={saving}
                      styles={selectStyles}
                      menuPlacement="auto"
                      menuPosition="fixed"
                      menuShouldScrollIntoView={false}
                    />
                  </div>

                  <TextField
                    label="Related Page URL"
                    value={form.page_url}
                    onChange={(value) =>
                      handleChange("page_url", value)
                    }
                  />

                  <TextArea
                    label="Content"
                    value={form.content}
                    onChange={(value) =>
                      handleChange("content", value)
                    }
                    required
                  />

                  <div className="site-update-markdown-help">
                    <strong>Markdown supported</strong> <br/>

                    <span>
                      You can use headings, lists, links, bold text,
                      and other Markdown formatting.
                    </span>
                  </div>

                  <label className="site-update-published-toggle">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(event) =>
                        handleChange(
                          "published",
                          event.target.checked,
                        )
                      }
                      disabled={saving}
                    />

                    <span>
                      <strong>Published</strong> <br/>

                      <small>
                        Published updates appear on the public Site
                        Updates page.
                      </small>
                    </span>
                  </label>
                </div>
              </section>

              {error && (
                <div className="site-update-modal-error">
                  {error}
                </div>
              )}

              <div className="admin-modal-actions site-update-modal-actions">
                <button
                  type="button"
                  className="admin-modal-edit"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-modal-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? editing
                      ? "Saving..."
                      : "Creating..."
                    : editing
                      ? "Save Changes"
                      : "Create Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default SiteUpdateModal;