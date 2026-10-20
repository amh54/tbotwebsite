import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../css/admin/adminKeepOrScrap.css";
import "../../css/loading.css";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL, ensureCsrfToken } from "../../utils/api";

const SIDES = [
  { key: "Intro", label: "Intro" },
  { key: "All", label: "Keep or Scrap" },
];

const EMPTY_FORM = {
  tierid: "",
  side: "Plants",
  card_class: "",
  image: "",
  reasoning: "",
  creator: "",
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const ENTRIES_URL = `${API_BASE_URL}/tbotapp/admin/keeporscrap/`;
const IMAGE_UPLOAD_URL = `${ENTRIES_URL}image-upload/`;

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const isIntroEntry = (entry) => {
  const side = normalizeText(entry?.side);
  return side === "intro" || side === "intro/explanation";
};

const isIntroForm = (side) => {
  const normalizedSide = normalizeText(side);
  return normalizedSide === "intro" || normalizedSide === "intro/explanation";
};

function getLoadedEntries(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getApiErrorMessage(payload, fallback) {
  if (payload?.detail) return `${fallback}: ${payload.detail}`;
  if (payload?.error) return `${fallback}: ${payload.error}`;
  return fallback;
}

async function throwResponseError(response, action) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Keep the fallback when the response has no JSON body.
  }
  throw new Error(
    getApiErrorMessage(
      payload,
      `${action} failed with status ${response.status}`,
    ),
  );
}

function getEditorTitle(editingEntry, side) {
  if (isIntroForm(side)) {
    return editingEntry ? "Edit Introduction" : "Add Introduction";
  }
  return editingEntry ? "Edit Recommendation" : "Add Recommendation";
}

function getSaveButtonLabel(saving, editingEntry) {
  if (saving) return "Saving...";
  if (editingEntry) return "Save Changes";
  return "Create Entry";
}

function renderBoldText(text) {
  if (!hasValue(text)) return null;

  const rawText = String(text);
  const matches = [...rawText.matchAll(/\*\*(.+?)\*\*/g)];

  if (matches.length === 0) {
    return rawText.split(/\r?\n/).map((line, index, lines) => (
      <span key={`line-${index}-${line}`}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ));
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match) => {
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      appendTextLines(parts, rawText.slice(lastIndex, matchIndex), lastIndex);
    }

    parts.push(<strong key={`bold-${matchIndex}`}>{match[1]}</strong>);
    lastIndex = matchIndex + match[0].length;
  });

  if (lastIndex < rawText.length) {
    appendTextLines(parts, rawText.slice(lastIndex), lastIndex);
  }

  return parts;
}

function appendTextLines(parts, text, startIndex) {
  const lines = text.split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    const key = `${startIndex}-${lineIndex}`;
    parts.push(<span key={`text-${key}`}>{line}</span>);
    if (lineIndex < lines.length - 1) {
      parts.push(<br key={`br-${key}`} />);
    }
  });
}

function renderIntroText(text) {
  if (!hasValue(text)) return null;

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="admin-kos-intro-heading">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="admin-kos-intro-heading">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="admin-kos-intro-heading">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="admin-kos-intro-quote">{children}</blockquote>
        ),
        p: ({ children }) => (
          <p className="admin-kos-intro-paragraph">{children}</p>
        ),
        strong: ({ children }) => <strong>{children}</strong>,
        ul: ({ children }) => (
          <ul className="admin-kos-intro-list">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="admin-kos-intro-list">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
      }}
    >
      {String(text)}
    </ReactMarkdown>
  );
}

function LoadingState() {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div className="loading-spinner" />
        <h2>
          <p>Loading Keep or Scrap</p>
          <span className="loading-dots">
            <span />
            <span />
            <span />
          </span>
        </h2>
        <p>Preparing the Keep or Scrap administration page.</p>
      </div>
    </div>
  );
}

function AdminHeader({ onBack }) {
  return (
    <header className="admin-kos-header">
      <div>
        <div className="admin-kos-eyebrow">ADMINISTRATION</div>
        <h1>Keep or Scrap</h1>
        <p>
          Manage the recommendations and introduction content shown on Keep or
          Scrap.
        </p>
      </div>
      <button
        type="button"
        className="admin-kos-secondary-button"
        onClick={onBack}
      >
        ← Back
      </button>
    </header>
  );
}

function AdminTabs({
  side,
  introExists,
  onChangeSide,
  onAddIntro,
  onEditIntro,
  onAddEntry,
}) {
  const handlePrimaryAction = () => {
    if (side !== "Intro") {
      onAddEntry();
      return;
    }
    if (introExists) {
      onEditIntro();
      return;
    }
    onAddIntro();
  };

  let actionLabel = "+ Add Entry";
  if (side === "Intro") {
    actionLabel = introExists ? "Edit Intro" : "+ Add Intro";
  }

  return (
    <div className="admin-kos-browser">
      <div className="admin-kos-tabs">
        {SIDES.map((sideOption) => (
          <button
            key={sideOption.key}
            type="button"
            className={side === sideOption.key ? "active" : ""}
            onClick={() => onChangeSide(sideOption.key)}
          >
            {sideOption.label}
          </button>
        ))}
      </div>
      <div className="admin-kos-tab-actions">
        <button
          type="button"
          className="admin-kos-primary-button"
          onClick={handlePrimaryAction}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function IntroSection({ entries, onAddIntro, onEdit, onDelete }) {
  return (
    <section className="admin-kos-intro">
      <div className="admin-kos-section-heading">
        <div>
          <span>KEEP OR SCRAP</span>
          <h2>Introduction</h2>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="admin-kos-empty">
          <h3>No introduction available</h3>
          <p>Add the introduction content for the public Keep or Scrap page.</p>
          <button
            type="button"
            className="admin-kos-primary-button"
            onClick={onAddIntro}
          >
            + Create Introduction
          </button>
        </div>
      ) : (
        entries.map((entry) => (
          <article className="admin-kos-intro-card" key={entry.tierid}>
            <div className="admin-kos-intro-image">
              {hasValue(entry.image) ? (
                <img src={entry.image} alt="Keep or Scrap introduction" />
              ) : (
                <div className="admin-kos-no-image">No Image</div>
              )}
            </div>
            <div className="admin-kos-intro-content">
              <div className="admin-kos-public-label">PUBLIC INTRODUCTION</div>
              <div className="admin-kos-content-preview">
                {renderIntroText(entry.reasoning)}
              </div>
              {hasValue(entry.creator) && (
                <div className="admin-kos-creator">
                  <strong>Credits</strong>
                  <span>{entry.creator}</span>
                </div>
              )}
              <div className="admin-kos-entry-actions">
                <button
                  type="button"
                  className="admin-kos-edit-button"
                  onClick={() => onEdit(entry)}
                >
                  Edit Introduction
                </button>
                <button
                  type="button"
                  className="admin-kos-delete-button"
                  onClick={() => onDelete(entry)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function ClassCard({ group, onEdit, onDelete }) {
  const firstEntry = group.entries[0];

  return (
    <section className="admin-kos-class-card">
      <div className="admin-kos-class-top">
        <div>
          <span>{group.side}</span>
          <h2>{group.name}</h2>
        </div>
        <div className="admin-kos-entry-count">
          {group.entries.length} tiers
        </div>
      </div>
      <div className="admin-kos-class-main">
        <div className="admin-kos-class-image">
          {hasValue(firstEntry?.image) ? (
            <img src={firstEntry.image} alt={group.name} />
          ) : (
            <div className="admin-kos-no-image">No Image</div>
          )}
        </div>
        <div className="admin-kos-tier-list">
          {group.entries.map((entry) => (
            <div className="admin-kos-tier-item" key={entry.tierid}>
              <div className="admin-kos-tier-info">
                <div className="admin-kos-tier-number">Tier {entry.tierid}</div>
                <div className="admin-kos-tier-text">
                  {renderBoldText(entry.reasoning)}
                </div>
              </div>
              <div className="admin-kos-tier-actions">
                <button
                  type="button"
                  className="admin-kos-edit-small"
                  onClick={() => onEdit(entry)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-kos-delete-small"
                  onClick={() => onDelete(entry)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClassesSection({ entries, groups, onAddEntry, onEdit, onDelete }) {
  const recommendationCount = entries.filter(
    (entry) => !isIntroEntry(entry),
  ).length;

  return (
    <section className="admin-kos-classes">
      <div className="admin-kos-section-heading">
        <div>
          <span>RECOMMENDATIONS</span>
          <h2>Keep or Scrap</h2>
        </div>
        <div className="admin-kos-count">{recommendationCount} entries</div>
      </div>
      {groups.length === 0 ? (
        <div className="admin-kos-empty">
          <h3>No recommendations</h3>
          <p>Add your first Keep or Scrap recommendation.</p>
          <button
            type="button"
            className="admin-kos-primary-button"
            onClick={onAddEntry}
          >
            + Add Recommendation
          </button>
        </div>
      ) : (
        <div className="admin-kos-class-grid">
          {groups.map((group) => (
            <ClassCard
              key={group.name}
              group={group}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ImageField({
  form,
  fileInputRef,
  uploading,
  saving,
  onUpload,
  onOpenPicker,
  onRemove,
}) {
  return (
    <div className="admin-kos-form-full">
      <div className="admin-kos-upload-heading">
        <div>
          <span>IMAGE</span>
          <strong>Keep or Scrap Image</strong>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={onUpload}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="admin-kos-upload-button"
          onClick={onOpenPicker}
          disabled={uploading || saving}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
      {hasValue(form.image) ? (
        <div className="admin-kos-upload-preview">
          <div className="admin-kos-upload-preview-image">
            <img src={form.image} alt="Keep or Scrap preview" />
          </div>
          <div className="admin-kos-upload-preview-info">
            <span>R2 Image</span>
            <small>Image is stored in Cloudflare R2.</small>
            <button
              type="button"
              className="admin-kos-remove-image"
              onClick={onRemove}
              disabled={uploading || saving}
            >
              Remove Image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="admin-kos-upload-dropzone"
          onClick={onOpenPicker}
          disabled={uploading || saving}
        >
          <span className="admin-kos-upload-icon">↑</span>
          <strong>Upload Keep or Scrap Image</strong>
          <small>
            Choose an image from your computer. It will be uploaded to
            Cloudflare R2.
          </small>
        </button>
      )}
    </div>
  );
}

function EditorModal({
  editingEntry,
  form,
  fileInputRef,
  saving,
  uploading,
  onClose,
  onChange,
  onUpload,
  onOpenPicker,
  onRemoveImage,
  onSave,
}) {
  const isIntro = isIntroForm(form.side);

return (
  <div
    className="admin-kos-modal-overlay"
    style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 99999,
    }}
  >
    <dialog
      className="admin-kos-editor-modal"
      open
      aria-labelledby="admin-kos-editor-title"
    >
      <div className="admin-kos-modal-header">
        <div>
          <span>{editingEntry ? "EDIT ENTRY" : "NEW ENTRY"}</span>
          <h2 id="admin-kos-editor-title">
            {getEditorTitle(editingEntry, form.side)}
          </h2>
        </div>

        <button
          type="button"
          className="admin-kos-modal-close"
          onClick={onClose}
          disabled={saving || uploading}
          aria-label="Close editor"
        >
          ×
        </button>
      </div>

      <div className="admin-kos-editor-body">
        <div className="admin-kos-form-grid">
          {!editingEntry && (
            <label>
              <span>Tier ID</span>
              <input
                type="number"
                value={form.tierid}
                onChange={(event) => onChange("tierid", event.target.value)}
                placeholder="Auto-generated"
              />
            </label>
          )}

          <label>
            <span>Side</span>
            <select
              value={form.side}
              onChange={(event) => onChange("side", event.target.value)}
            >
              <option value="Intro">Intro</option>
              <option value="Plants">Plants</option>
              <option value="Zombies">Zombies</option>
            </select>
          </label>

          {!isIntro && (
            <label>
              <span>Card Class</span>
              <input
                type="text"
                value={form.card_class}
                onChange={(event) =>
                  onChange("card_class", event.target.value)
                }
                placeholder="Example: Guardian"
              />
            </label>
          )}

          <ImageField
            form={form}
            fileInputRef={fileInputRef}
            uploading={uploading}
            saving={saving}
            onUpload={onUpload}
            onOpenPicker={onOpenPicker}
            onRemove={onRemoveImage}
          />

          <label className="admin-kos-form-full">
            <span>{isIntro ? "Introduction Markdown" : "Reasoning"}</span>
            <textarea
              value={form.reasoning}
              onChange={(event) => onChange("reasoning", event.target.value)}
              rows={14}
              placeholder={
                isIntro
                  ? "Write the Keep or Scrap introduction using Markdown..."
                  : "Explain why these cards belong in this recommendation tier..."
              }
            />
            {isIntro && (
              <small className="admin-kos-markdown-help">
                Markdown is supported. Use **bold**, headings, lists, and
                blockquotes.
              </small>
            )}
          </label>

          <label className="admin-kos-form-full">
            <span>Credits</span>
            <input
              type="text"
              value={form.creator}
              onChange={(event) => onChange("creator", event.target.value)}
              placeholder="Credit the author or source"
            />
          </label>
        </div>
      </div>

      <div className="admin-kos-editor-footer">
        <button
          type="button"
          className="admin-kos-secondary-button"
          onClick={onClose}
          disabled={saving || uploading}
        >
          Cancel
        </button>

        <button
          type="button"
          className="admin-kos-primary-button"
          onClick={onSave}
          disabled={saving || uploading}
        >
          {getSaveButtonLabel(saving, editingEntry)}
        </button>
      </div>
    </dialog>
  </div>
);
}

function DeleteModal({ target, saving, onCancel, onDelete }) {
  return (
    <div
      className="admin-kos-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
      }}
    >
     <dialog
  className="admin-kos-delete-modal"
  open
  aria-labelledby="admin-kos-delete-title"
>
        <div className="admin-kos-delete-icon">!</div>
        <h2 id="admin-kos-delete-title">Delete Keep or Scrap Entry?</h2>
        <p>
          This will permanently delete tier <strong>{target.tierid}</strong>.
          <br />
          This action cannot be undone.
        </p>
        <div className="admin-kos-delete-actions">
          <button
            type="button"
            className="admin-kos-secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-kos-danger-button"
            onClick={onDelete}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete Entry"}
          </button>
        </div>
      </dialog>
      </div>
  );
}

function AdminKeepOrScrap() {
  const [entries, setEntries] = useState([]);
  const [side, setSide] = useState("Intro");
  const [portalReady, setPortalReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = "Admin - Keep or Scrap";
    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = editorOpen || deleteTarget ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editorOpen, deleteTarget]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(ENTRIES_URL, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        await throwResponseError(response, "Request");
      }
      setEntries(getLoadedEntries(await response.json()));
    } catch (loadError) {
      console.error("Admin Keep or Scrap loading failed:", loadError);
      setError(loadError?.message || "Unable to load Keep or Scrap.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const introEntries = useMemo(
    () =>
      entries
        .filter(isIntroEntry)
        .sort((a, b) => Number(a.tierid) - Number(b.tierid)),
    [entries],
  );

  const groupedClasses = useMemo(() => {
    const groups = new Map();
    entries
      .filter((entry) => !isIntroEntry(entry) && hasValue(entry.card_class))
      .forEach((entry) => {
        const key = normalizeText(entry.card_class);
        if (!groups.has(key)) {
          groups.set(key, {
            name: entry.card_class,
            side: entry.side,
            entries: [],
          });
        }
        groups.get(key).entries.push(entry);
      });

    return [...groups.values()]
      .map((group) => ({
        ...group,
        entries: group.entries.sort(
          (a, b) => Number(a.tierid) - Number(b.tierid),
        ),
      }))
      .sort((a, b) => {
        const aSide = normalizeText(a.side);
        const bSide = normalizeText(b.side);
        const aIsPlant = aSide === "plants" || aSide === "plant";
        const bIsPlant = bSide === "plants" || bSide === "plant";
        if (aIsPlant !== bIsPlant) return aIsPlant ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [entries]);

  const updateForm = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const resetEditor = () => {
    setEditorOpen(false);
    setEditingEntry(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const openAdd = (newSide) => {
    setEditingEntry(null);
    setForm({ ...EMPTY_FORM, side: newSide });
    setError("");
    setSuccess("");
    setEditorOpen(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      tierid: entry.tierid ?? "",
      side: entry.side ?? "Plants",
      card_class: entry.card_class ?? "",
      image: entry.image ?? "",
      reasoning: entry.reasoning ?? "",
      creator: entry.creator ?? "",
    });
    setError("");
    setSuccess("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving || uploading) return;
    resetEditor();
  };

  const openR2FilePicker = () => {
    if (uploading || saving) return;
    setError("");
    setSuccess("");
    fileInputRef.current?.click();
  };

  const validateImage = (file, isIntro) => {
    if (!isIntro && !hasValue(form.card_class)) {
      return "Card class is required before uploading an image.";
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Unsupported image type. Use JPEG, PNG, WebP, or GIF.";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "Image is too large. Maximum size is 15 MB.";
    }
    return "";
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isIntro = isIntroForm(form.side);
    const validationError = validateImage(file, isIntro);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");
      const csrfToken = await ensureCsrfToken();
      const formData = new FormData();
      formData.append("image", file);
      formData.append(
        "card_class",
        isIntro ? "intro" : String(form.card_class).trim(),
      );

      const response = await fetch(IMAGE_UPLOAD_URL, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            `Unable to upload image (${response.status}).`,
        );
      }

      const imageUrl = data?.secure_url || data?.url;
      if (!imageUrl) {
        throw new Error(
          "Image upload succeeded, but no image URL was returned.",
        );
      }
      updateForm("image", imageUrl);
      setSuccess("Image uploaded to Cloudflare R2.");
    } catch (uploadError) {
      console.error("Keep or Scrap R2 image upload failed:", uploadError);
      setError(uploadError?.message || "Unable to upload image to R2.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = () => {
    updateForm("image", "");
    setSuccess("");
  };

  const validateForm = (isIntro) => {
    if (!hasValue(form.reasoning)) {
      return "Reasoning / introduction text is required.";
    }
    if (!isIntro && !hasValue(form.card_class)) {
      return "Card class is required for Keep or Scrap entries.";
    }
    return "";
  };

  const buildPayload = (isIntro) => ({
    side: form.side.trim(),
    card_class: isIntro ? "" : form.card_class.trim(),
    image: form.image.trim(),
    reasoning: form.reasoning,
    creator: form.creator.trim(),
  });

  const saveRequest = async (payload, csrfToken) => {
    const isEditing = editingEntry?.tierid !== undefined;
    const url = isEditing
      ? `${ENTRIES_URL}${editingEntry.tierid}/`
      : ENTRIES_URL;
    const body = { ...payload };
    if (!isEditing && hasValue(form.tierid)) {
      body.tierid = Number(form.tierid);
    }

    const response = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await throwResponseError(response, isEditing ? "Update" : "Create");
    }
    return isEditing;
  };

  const saveEntry = async () => {
    if (saving) return;

    const isIntro = isIntroForm(form.side);
    const validationError = validateForm(isIntro);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const csrfToken = await ensureCsrfToken();
      const wasEditing = await saveRequest(buildPayload(isIntro), csrfToken);
      setSuccess(
        wasEditing
          ? "Keep or Scrap entry updated."
          : "Keep or Scrap entry created.",
      );
      await loadEntries();
      window.setTimeout(() => {
        setEditorOpen(false);
        setEditingEntry(null);
        setForm(EMPTY_FORM);
        setSuccess("");
      }, 500);
    } catch (saveError) {
      console.error("Keep or Scrap save failed:", saveError);
      setError(saveError?.message || "Unable to save Keep or Scrap entry.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!deleteTarget || saving) return;

    try {
      setSaving(true);
      setError("");
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`${ENTRIES_URL}${deleteTarget.tierid}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });
      if (!response.ok) {
        await throwResponseError(response, "Delete");
      }

      setDeleteTarget(null);
      await loadEntries();
      setSuccess("Keep or Scrap entry deleted.");
      window.setTimeout(() => setSuccess(""), 2500);
    } catch (deleteError) {
      console.error("Keep or Scrap delete failed:", deleteError);
      setError(deleteError?.message || "Unable to delete Keep or Scrap entry.");
    } finally {
      setSaving(false);
    }
  };

  const changeSide = (newSide) => {
    setSide(newSide);
    setError("");
    setSuccess("");
  };

  if (loading) return <LoadingState />;

  return (
    <div className="admin-kos-page">
      <main className="admin-kos-content">
        <AdminHeader onBack={() => window.history.back()} />
        {error && <div className="admin-kos-alert error">{error}</div>}
        {success && <div className="admin-kos-alert success">{success}</div>}

        <AdminTabs
          side={side}
          introExists={introEntries.length > 0}
          onChangeSide={changeSide}
          onAddIntro={() => openAdd("Intro")}
          onEditIntro={() => openEdit(introEntries[0])}
          onAddEntry={() => openAdd("Plants")}
        />

        {side === "Intro" && (
          <IntroSection
            entries={introEntries}
            onAddIntro={() => openAdd("Intro")}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}

        {side === "All" && (
          <ClassesSection
            entries={entries}
            groups={groupedClasses}
            onAddEntry={() => openAdd("Plants")}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}
      </main>

      {editorOpen &&
        portalReady &&
        createPortal(
          <EditorModal
            editingEntry={editingEntry}
            form={form}
            fileInputRef={fileInputRef}
            saving={saving}
            uploading={uploading}
            onClose={closeEditor}
            onChange={updateForm}
            onUpload={handleImageUpload}
            onOpenPicker={openR2FilePicker}
            onRemoveImage={removeImage}
            onSave={saveEntry}
          />,
          document.body,
        )}

      {deleteTarget &&
        portalReady &&
        createPortal(
          <DeleteModal
            target={deleteTarget}
            saving={saving}
            onCancel={() => setDeleteTarget(null)}
            onDelete={deleteEntry}
          />,
          document.body,
        )}
    </div>
  );
}

export default AdminKeepOrScrap;
