import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import "../css/deckmodal.css";

const HERO_COLORS = {
  "Beta-Carrotina": ["brown", "gray"],
  Citron: ["brown", "gray"],
  "Captain Combustible": ["red", "green"],
  Chompzilla: ["green", "yellow"],
  "Grass Knuckles": ["green", "brown"],
  "Green Shadow": ["green", "gray"],
  "Night Cap": ["red", "gray"],
  Rose: ["gray", "yellow"],
  "Solar Flare": ["red", "yellow"],
  Spudow: ["red", "brown"],
  "Wall-Knight": ["brown", "yellow"],
  "Brain Freeze": ["black", "blue"],
  "Electric Boogaloo": ["blue", "purple"],
  "Huge-Gigantacus": ["pink", "black"],
  "Super Brainz": ["pink", "black"],
  Immorticia: ["pink", "blue"],
  Impfinity: ["black", "purple"],
  Neptuna: ["orange", "black"],
  "Professor Brainstorm": ["pink", "purple"],
  Rustbolt: ["pink", "orange"],
  "The Smash": ["orange", "blue"],
  "Z-mech": ["orange", "purple"],
};

const normalizeHeroName = (hero) =>
  String(hero || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getHeroColors = (hero) => {
  const normalizedHero = normalizeHeroName(hero);

  const entry = Object.entries(HERO_COLORS).find(
    ([name]) => normalizeHeroName(name) === normalizedHero,
  );

  return entry?.[1] || ["default", "default"];
};

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const getImageUrl = (value) => {
  const image = String(value || "").trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  if (image.startsWith("/media/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("/")) {
    return `${API_BASE_URL}${image}`;
  }

  // Existing database images may be stored as:
  // decklists/example.webp
  if (image.startsWith("decklists/")) {
    return `${API_BASE_URL}/media/${image}`;
  }

  return `${API_BASE_URL}/${image}`;
};

const parseCardLines = (value) =>
  String(value ?? "")
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);

const cardLinesToOptions = (value) =>
  parseCardLines(value).map((name) => ({
    value: name,
    label: name,
  }));

const cardOptionsToLines = (options) =>
  (options || [])
    .map((option) => String(option?.value || option?.label || "").trim())
    .filter(Boolean)
    .join("\n");

const cardSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#202020",
    borderColor: state.isFocused ? "#8fe38b" : "#444",
    minHeight: "45px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#8fe38b",
    },
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#202020",
  }),

  menuList: (base) => ({
    ...base,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#333" : "#202020",
    color: "white",
    cursor: "pointer",
  }),

  valueContainer: (base) => ({
    ...base,
    gap: "6px",
    padding: "6px 8px",
  }),

  multiValue: (base) => ({
    ...base,
    backgroundColor: "#2a3d2b",
    border: "1px solid #47734a",
    borderRadius: "999px",
    overflow: "hidden",
    margin: 0,
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "#a6efa2",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "3px 4px 3px 10px",
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "#a6efa2",
    borderRadius: "0 999px 999px 0",
    paddingRight: "8px",
    ":hover": {
      backgroundColor: "#3a523c",
      color: "#ffffff",
    },
  }),

  placeholder: (base) => ({
    ...base,
    color: "#888",
  }),

  input: (base) => ({
    ...base,
    color: "white",
    margin: 0,
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base) => ({
    ...base,
    color: "#666",
    ":hover": {
      color: "#8fe38b",
    },
  }),

  clearIndicator: (base) => ({
    ...base,
    color: "#666",
    ":hover": {
      color: "#ff8c8c",
    },
  }),
};

function DeckCard({
  decklist,
  admin = false,
  adminMode = false,
  onDelete,
  onSave,
  editSaving = false,
  allCards = [],
}) {
  const deck = decklist ?? {};
  const isAdmin = admin || adminMode;

  const [heroColor1, heroColor2] = getHeroColors(deck.hero);

  const deckId = deck.deckid ?? deck.deckID ?? deck.id ?? "";
  const deckKey = String(deckId || deck.name || "");

  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({});

  const deckImage = getImageUrl(deck.image);

  const hasValue = (value) => {
    if (value === null || value === undefined) {
      return false;
    }

    return String(value).trim() !== "";
  };

  const description = hasValue(deck.description)
    ? deck.description
    : "No description available.";

  const cardOptions = useMemo(() => {
    const seen = new Set();
    const options = [];

    (Array.isArray(allCards) ? allCards : []).forEach((card) => {
      const name = String(card?.card_name || card?.title || "").trim();

      if (!name) {
        return;
      }

      const key = name.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      options.push({
        value: name,
        label: name,
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [allCards]);

  const createForm = (source = {}) => ({
    deckid: source.deckid ?? source.deckID ?? source.id ?? "",
    name: source.name ?? "",
    hero: source.hero ?? "",
    side: source.side ?? "",
    category: source.category ?? "",
    archetype: source.archetype ?? "",
    description: source.description ?? "",
    image: source.image ?? "",
    image_file: null,
    creator: source.creator ?? "",
    cost: source.cost ?? "",
    inspiration: source.inspiration ?? "",
    optimization: source.optimization ?? "",
    suggested_date: source.suggested_date ?? "",
    updated_date: source.updated_date ?? "",
    deck_doc: source.deck_doc ?? "",
    cards: source.cards ?? "",
    cardsSelected: cardLinesToOptions(source.cards ?? ""),
  });

  const toExternalUrl = (value) => {
    const raw = String(value || "").trim();

    if (!raw) {
      return "";
    }

    const markdownMatch = /\((https?:\/\/[^)]+)\)/i.exec(raw);
    const inlineUrlMatch = /https?:\/\/\S+/i.exec(raw);

    let candidate = (markdownMatch?.[1] || inlineUrlMatch?.[0] || raw)
      .trim()
      .replace(/\s+/g, "");

    const trimChars = "'\"<>[]";

    while (candidate && trimChars.includes(candidate[0])) {
      candidate = candidate.slice(1);
    }

    while (candidate && trimChars.includes(candidate.at(-1))) {
      candidate = candidate.slice(0, -1);
    }

    if (!candidate) {
      return "";
    }

    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }

    try {
      return new URL(candidate).toString();
    } catch {
      return "";
    }
  };

  const deckDocUrl = toExternalUrl(editing ? form.deck_doc : deck.deck_doc);

  useEffect(() => {
    if (!deckKey) {
      return;
    }

    if (searchParams.get("deck") === deckKey) {
      setOpen(true);
    } else if (open) {
      setOpen(false);
      setEditing(false);
    }
  }, [searchParams, deckKey]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
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
      if (event.key === "Escape" && !saving && !editSaving) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, editSaving]);

  const openModal = () => {
    setOpen(true);
    setEditing(false);
    setForm(createForm(deck));
    setImgError(false);

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("deck", deckKey);

    setSearchParams(next);
  };

  const closeModal = () => {
    if (saving || editSaving) {
      return;
    }

    setOpen(false);
    setEditing(false);

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (next.get("deck") === deckKey) {
      next.delete("deck");
      setSearchParams(next);
    }
  };

  const startEditing = () => {
    if (!isAdmin) {
      return;
    }

    setForm(createForm(deck));
    setImgError(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (saving || editSaving) {
      return;
    }

    setForm(createForm(deck));
    setEditing(false);
    setImgError(false);
  };

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "image_file") {
      setImgError(false);
    }
  };

  const handleCardsChange = (selected) => {
    setForm((previous) => ({
      ...previous,
      cardsSelected: selected || [],
    }));
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setImgError(false);

    if (!file) {
      setForm((previous) => ({
        ...previous,
        image_file: null,
        image: deck.image ?? "",
      }));

      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((previous) => ({
      ...previous,
      image_file: file,
      image: previewUrl,
    }));
  };

  const handleSave = async () => {
    if (typeof onSave !== "function") {
      return;
    }

    if (!deckId) {
      console.error("Cannot save deck: missing deck ID.", deck);
      return;
    }

    try {
      setSaving(true);

      const hasNewImage = form.image_file instanceof File;

      const payload = {
        deckid: deckId,
        name: form.name ?? "",
        hero: form.hero ?? "",
        side: form.side ?? "",
        category: form.category ?? "",
        archetype: form.archetype ?? "",
        description: form.description ?? "",

        image: hasNewImage ? "" : String(form.image ?? deck.image ?? "").trim(),

        image_file: hasNewImage ? form.image_file : null,

        creator: form.creator ?? "",
        cost: form.cost ?? "",
        inspiration: form.inspiration ?? "",
        optimization: form.optimization ?? "",
        suggested_date: form.suggested_date ?? "",
        updated_date: form.updated_date ?? "",
        deck_doc: form.deck_doc ?? "",
        cards: cardOptionsToLines(form.cardsSelected),
      };

      const updatedDeck = await onSave(deck, payload);

      if (updatedDeck) {
        setForm(createForm(updatedDeck));
      }

      setEditing(false);
      setImgError(false);
    } catch (error) {
      console.error("Failed to save deck:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (typeof onDelete === "function") {
      onDelete(deck);
    }
  };

  const handleShare = async () => {
    if (!deckKey) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("deck", deckKey);

    try {
      await navigator.clipboard.writeText(url.toString());

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  const handleDownload = async () => {
    const imageUrl = getImageUrl(deck.image);

    if (!imageUrl) {
      return;
    }

    try {
      const response = await fetch(imageUrl, {
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Image fetch failed");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `${deck.name || "decklist"}.png`.replace(/\s+/g, "_");

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Direct download blocked, opening image instead", error);

      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  };

  const isSaving = saving || editSaving;
  const editImage = getImageUrl(form.image);

  return (
    <>
      <div className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}>
        <div
          className="deck-card-image-only"
          onClick={openModal}
          style={{ cursor: "pointer" }}
        >
          {deckImage && !imgError ? (
            <img
              src={deckImage}
              alt={deck.name || "Deck image"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="deck-image-placeholder">No image</div>
          )}

          <button
            type="button"
            className="view-details-btn"
            onClick={(event) => {
              event.stopPropagation();
              openModal();
            }}
            aria-label={`View details for ${deck.name || "deck"}`}
          >
            View Details
          </button>
        </div>

        <div className="deck-listing-info">
          <h3>{deck.name || "Untitled Deck"}</h3>

          <p>
            <span>Hero:</span> {deck.hero || "-"}
          </p>

          <p>
            <span>Category:</span> {deck.category || "-"}
          </p>

          <p>
            <span>Archetype:</span> {deck.archetype || "-"}
          </p>

          <p>
            <span>Cost:</span> {deck.cost || "-"}
            <img
              src="https://i.ibb.co/jZkdqf6y/spark.webp"
              alt="Spark icon"
              className="spark-icon"
            />
          </p>

          {hasValue(deck.creator) && (
            <p className="creator-field">
              <span className="field-label">Creator:</span>

              <span className="creator-value">{deck.creator}</span>
            </p>
          )}

          {hasValue(deck.optimization) && (
            <p>
              <span>Optimized by:</span> {deck.optimization}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              closeModal();
            }
          }}
        >
          <dialog
            open
            className="modal"
            aria-label={
              editing
                ? `Edit ${deck.name || "deck"}`
                : `Details for ${deck.name || "deck"}`
            }
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="Close details"
              disabled={isSaving}
            >
              ×
            </button>

            <div className="modal-scroll-content">
              <div className="modal-content">
                <div className="modal-image">
                  {editing ? (
                    <>
                      {editImage && !imgError ? (
                        <img
                          src={editImage}
                          alt={form.name || "Deck image"}
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div className="deck-image-placeholder">No image</div>
                      )}

                      <label className="admin-modal-field">
                        <span>Upload Image</span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageFileChange}
                        />
                      </label>
                    </>
                  ) : deckImage && !imgError ? (
                    <img
                      src={deckImage}
                      alt={deck.name || "Deck image"}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="deck-image-placeholder">No image</div>
                  )}

                  {!editing &&
                    (hasValue(deck.creator) ||
                      hasValue(deck.optimization) ||
                      hasValue(deck.inspiration) ||
                      hasValue(deck.suggested_date) ||
                      hasValue(deck.updated_date)) && (
                      <div className="image-meta">
                        {(hasValue(deck.creator) ||
                          hasValue(deck.optimization) ||
                          hasValue(deck.inspiration)) && (
                          <p>
                            {hasValue(deck.creator) && (
                              <>
                                Created by <span>{deck.creator}</span>
                              </>
                            )}

                            {hasValue(deck.optimization) && (
                              <>
                                {hasValue(deck.creator) ? ", " : ""}
                                Optimized by <span>{deck.optimization}</span>
                              </>
                            )}

                            {hasValue(deck.inspiration) && (
                              <>
                                {hasValue(deck.creator) ||
                                hasValue(deck.optimization)
                                  ? ", "
                                  : ""}
                                Inspired by <span>{deck.inspiration}</span>
                              </>
                            )}
                          </p>
                        )}

                        {hasValue(deck.suggested_date) && (
                          <p>Suggested on {deck.suggested_date}</p>
                        )}

                        {hasValue(deck.updated_date) && (
                          <p>Updated on {deck.updated_date}</p>
                        )}
                      </div>
                    )}

                  {!editing && (
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="share-btn"
                        onClick={handleShare}
                      >
                        {copied ? "Link Copied!" : "Share Deck"}
                      </button>

                      {hasValue(deck.image) && (
                        <button
                          type="button"
                          className="download-btn"
                          onClick={handleDownload}
                        >
                          Download Decklist
                        </button>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="admin-modal-actions">
                      {!editing ? (
                        <>
                          <button
                            type="button"
                            className="admin-modal-edit"
                            onClick={startEditing}
                            disabled={isSaving}
                          >
                            Edit Deck
                          </button>

                          <button
                            type="button"
                            className="admin-modal-delete"
                            onClick={handleDelete}
                            disabled={isSaving}
                          >
                            Delete Deck
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="admin-modal-edit"
                            onClick={cancelEditing}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="admin-modal-save"
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-info">
                  <div className="modal-header">
                    <div className="modal-title-content">
                      {editing ? (
                        <>
                          <AdminModalField
                            label="Deck Name"
                            value={form.name}
                            onChange={(value) => handleChange("name", value)}
                          />

                          <AdminModalField
                            label="Hero"
                            value={form.hero}
                            onChange={(value) => handleChange("hero", value)}
                          />
                        </>
                      ) : (
                        <>
                          <h2 className="modal-title">
                            {deck.name || "Untitled Deck"}
                          </h2>

                          <span className="deck-hero">
                            {deck.hero || "Unknown Hero"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <section className="modal-section description-section">
                    <h3>Description</h3>

                    {editing ? (
                      <AdminModalTextArea
                        value={form.description}
                        onChange={(value) => handleChange("description", value)}
                      />
                    ) : (
                      <p className="description">{description}</p>
                    )}
                  </section>

                  <section className="modal-metadata">
                    {editing ? (
                      <>
                        <AdminModalField
                          label="Category"
                          value={form.category}
                          onChange={(value) => handleChange("category", value)}
                        />

                        <AdminModalField
                          label="Archetype"
                          value={form.archetype}
                          onChange={(value) => handleChange("archetype", value)}
                        />

                        <AdminModalField
                          label="Cost"
                          value={form.cost}
                          onChange={(value) => handleChange("cost", value)}
                        />

                        <AdminModalField
                          label="Side"
                          value={form.side}
                          onChange={(value) => handleChange("side", value)}
                        />

                        <AdminModalField
                          label="Creator"
                          value={form.creator}
                          onChange={(value) => handleChange("creator", value)}
                        />

                        <AdminModalField
                          label="Optimization"
                          value={form.optimization}
                          onChange={(value) =>
                            handleChange("optimization", value)
                          }
                        />

                        <AdminModalField
                          label="Inspiration"
                          value={form.inspiration}
                          onChange={(value) =>
                            handleChange("inspiration", value)
                          }
                        />

                        <AdminModalField
                          label="Suggested Date"
                          value={form.suggested_date}
                          onChange={(value) =>
                            handleChange("suggested_date", value)
                          }
                        />

                        <AdminModalField
                          label="Updated Date"
                          value={form.updated_date}
                          onChange={(value) =>
                            handleChange("updated_date", value)
                          }
                        />

                        <AdminModalField
                          label="Deck Tutorial URL"
                          value={form.deck_doc}
                          onChange={(value) => handleChange("deck_doc", value)}
                        />

                        <div className="admin-modal-field admin-modal-cards-field">
                          <span>Cards</span>

                          <CreatableSelect
                            isMulti
                            options={cardOptions}
                            value={form.cardsSelected}
                            onChange={handleCardsChange}
                            placeholder="Search and add cards..."
                            classNamePrefix="deck-cards-select"
                            styles={cardSelectStyles}
                            closeMenuOnSelect={false}
                            formatCreateLabel={(inputValue) =>
                              `Add "${inputValue}"`
                            }
                          />

                          {cardOptions.length === 0 && (
                            <p className="admin-modal-field-hint">
                              No card list loaded yet — you can still type card
                              names manually.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {hasValue(deckDocUrl) && (
                          <div className="metadata-item">
                            <span className="label">Deck Tutorial</span>

                            <a
                              href={deckDocUrl}
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

                          <span className="value">{deck.category || "-"}</span>
                        </div>

                        <div className="metadata-item">
                          <span className="label">Archetype</span>

                          <span className="value">{deck.archetype || "-"}</span>
                        </div>

                        <div className="metadata-item cost-item">
                          <span className="label">Cost</span>

                          <span className="cost-value">
                            {deck.cost || "-"}

                            <img
                              src="https://i.ibb.co/jZkdqf6y/spark.webp"
                              alt="Spark icon"
                              className="spark-icon"
                            />
                          </span>
                        </div>
                      </>
                    )}
                  </section>

                  {isAdmin && !editing && (
                    <section className="modal-section admin-cards-section">
                      <h3>Cards</h3>

                      <div className="admin-cards-value">
                        {hasValue(deck.cards) ? deck.cards : "No cards listed."}
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

function AdminModalField({ label, value, onChange }) {
  return (
    <label className="admin-modal-field">
      <span>{label}</span>

      <input
        type="text"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AdminModalTextArea({ label, value, onChange }) {
  return (
    <label className="admin-modal-field admin-modal-textarea-field">
      {label && <span>{label}</span>}

      <textarea
        className="admin-modal-textarea"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
      />
    </label>
  );
}

export default DeckCard;
