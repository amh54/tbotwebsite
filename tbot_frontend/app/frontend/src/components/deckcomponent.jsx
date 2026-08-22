import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import AddDeckModal from "./AddDeckModal";
import EditDeckModal from "./EditDeckModal";

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

  if (image.startsWith("decklists/")) {
    return `${API_BASE_URL}/media/${image}`;
  }

  return `${API_BASE_URL}/${image}`;
};

const hasValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim() !== "";
};

const toExternalUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const markdownMatch = /\((https?:\/\/[^)]+)\)/i.exec(raw);
  const inlineUrlMatch = /https?:\/\/\S+/i.exec(raw);

  let candidate = (
    markdownMatch?.[1] ||
    inlineUrlMatch?.[0] ||
    raw
  )
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

const parseCardRatioLines = (value) =>
  String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, countPart] = line.split("|");

      const name = String(namePart || "").trim();

      const parsedCount = Number(countPart);

      const count =
        Number.isFinite(parsedCount) && parsedCount > 0
          ? Math.min(parsedCount, 4)
          : 1;

      return {
        name,
        count,
      };
    })
    .filter((entry) => entry.name);

const formatCardsDisplay = (value) => {
  const entries = parseCardRatioLines(value);

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map((entry) => `${entry.name} x${entry.count}`)
    .join(", ");
};

function DeckCard({
  decklist,
  admin = false,
  adminMode = false,
  addMode = false,
  onDelete,
  onSave,
  onAdd,
  onComplete,
  editSaving = false,
  allCards = [],
}) {
  const deck = decklist ?? {};

  const isAdmin = admin || adminMode;

  const [heroColor1, heroColor2] = getHeroColors(deck.hero);

  const deckId =
    deck.deckid ??
    deck.deckID ??
    deck.deckId ??
    deck.id ??
    "";

  const deckKey = String(deckId || deck.name || "");

  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(addMode);
  const [editing, setEditing] = useState(false);

  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImgError, setEditImgError] = useState(false);

  const [editSavingLocal, setEditSavingLocal] = useState(false);

  const editModalRef = useRef(null);

  const deckImage = getImageUrl(deck.image);

  const description = hasValue(deck.description)
    ? deck.description
    : "No description available.";

  useEffect(() => {
    if (addMode) {
      setOpen(true);
      return;
    }

    if (!deckKey) {
      return;
    }

    if (searchParams.get("deck") === deckKey) {
      setOpen(true);
    }
  }, [searchParams, deckKey, addMode]);

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
      if (
        event.key === "Escape" &&
        !editSavingLocal &&
        !editSaving
      ) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, editSavingLocal, editSaving]);

  useEffect(() => {
    if (!editing) {
      return;
    }

    setEditImgError(false);

    if (!editImageFile) {
      setEditImagePreview(deck.image ?? "");
    }
  }, [
    editing,
    deck.image,
    editImageFile,
  ]);

  const openModal = () => {
    if (addMode) {
      setOpen(true);
      return;
    }

    setOpen(true);
    setEditing(false);

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    next.set("deck", deckKey);

    setSearchParams(next);
  };

  const closeModal = () => {
    if (editSavingLocal || editSaving) {
      return;
    }

    if (addMode) {
      setOpen(false);

      if (typeof onComplete === "function") {
        onComplete(null);
      }

      return;
    }

    setOpen(false);
    setEditing(false);

    setEditImageFile(null);
    setEditImagePreview("");
    setEditImgError(false);

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (next.get("deck") === deckKey) {
      next.delete("deck");
      setSearchParams(next);
    }
  };

  const resetEditImageState = () => {
    setEditImageFile(null);
    setEditImagePreview(deck.image ?? "");
    setEditImgError(false);
  };

  const startEditing = () => {
    if (!isAdmin || isSaving) {
      return;
    }

    setEditImageFile(null);
    setEditImagePreview(deck.image ?? "");
    setEditImgError(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (editSavingLocal || editSaving) {
      return;
    }

    resetEditImageState();
    setEditing(false);
  };

  const handleEditImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setEditImgError(false);

    if (!file) {
      setEditImageFile(null);
      setEditImagePreview(deck.image ?? "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setEditImageFile(null);
      setEditImagePreview(deck.image ?? "");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setEditImageFile(file);
    setEditImagePreview(previewUrl);
  };

  const handleEditSave = async () => {
    if (!editModalRef.current?.save) {
      console.error(
        "EditDeckModal save method is unavailable.",
      );
      return;
    }

    try {
      await editModalRef.current.save();
    } catch (error) {
      console.error("Unable to save deck:", error);
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
      link.download = `${deck.name || "decklist"}.png`.replace(
        /\s+/g,
        "_",
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        "Direct download blocked, opening image instead",
        error,
      );

      window.open(
        imageUrl,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const handleAddComplete = (result) => {
    setOpen(false);

    if (typeof onComplete === "function") {
      onComplete(result);
    }
  };

  const handleEditComplete = (result) => {
    if (!result) {
      return;
    }

    resetEditImageState();
    setEditing(false);
  };

  if (addMode) {
    if (!open) {
      return null;
    }

    return (
      <AddDeckModal
        open={open}
        allCards={allCards}
        onAdd={onAdd}
        onClose={closeModal}
        onComplete={handleAddComplete}
      />
    );
  }

  const isSaving = editSavingLocal || editSaving;

  const editImage = getImageUrl(editImagePreview);

  return (
    <>
      <div
        className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}
      >
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
            <div className="deck-image-placeholder">
              No image
            </div>
          )}

          <button
            type="button"
            className="view-details-btn"
            onClick={(event) => {
              event.stopPropagation();
              openModal();
            }}
            aria-label={`View details for ${
              deck.name || "deck"
            }`}
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
              <span className="field-label">
                Creator:
              </span>

              <span className="creator-value">
                {deck.creator}
              </span>
            </p>
          )}

          {hasValue(deck.optimization) && (
            <p>
              <span>Optimized by:</span>{" "}
              {deck.optimization}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSaving
            ) {
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
            onMouseDown={(event) =>
              event.stopPropagation()
            }
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
                      {editImage && !editImgError ? (
                        <img
                          src={editImage}
                          alt={
                            deck.name ||
                            "Deck image"
                          }
                          onError={() =>
                            setEditImgError(true)
                          }
                        />
                      ) : (
                        <div className="deck-image-placeholder">
                          No image
                        </div>
                      )}

                      <label className="admin-modal-field">
                        <span>
                          Upload Image
                        </span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={
                            handleEditImageFileChange
                          }
                          disabled={isSaving}
                        />
                      </label>
                    </>
                  ) : deckImage && !imgError ? (
                    <img
                      src={deckImage}
                      alt={
                        deck.name ||
                        "Deck image"
                      }
                      onError={() =>
                        setImgError(true)
                      }
                    />
                  ) : (
                    <div className="deck-image-placeholder">
                      No image
                    </div>
                  )}

                  {!editing &&
                    (hasValue(deck.creator) ||
                      hasValue(deck.optimization) ||
                      hasValue(deck.inspiration) ||
                      hasValue(
                        deck.suggested_date,
                      ) ||
                      hasValue(
                        deck.updated_date,
                      )) && (
                      <div className="image-meta">
                        {(hasValue(deck.creator) ||
                          hasValue(
                            deck.optimization,
                          ) ||
                          hasValue(
                            deck.inspiration,
                          )) && (
                          <p>
                            {hasValue(
                              deck.creator,
                            ) && (
                              <>
                                Created by{" "}
                                <span>
                                  {deck.creator}
                                </span>
                              </>
                            )}

                            {hasValue(
                              deck.optimization,
                            ) && (
                              <>
                                {hasValue(
                                  deck.creator,
                                )
                                  ? ", "
                                  : ""}
                                Optimized by{" "}
                                <span>
                                  {
                                    deck.optimization
                                  }
                                </span>
                              </>
                            )}

                            {hasValue(
                              deck.inspiration,
                            ) && (
                              <>
                                {hasValue(
                                  deck.creator,
                                ) ||
                                hasValue(
                                  deck.optimization,
                                )
                                  ? ", "
                                  : ""}
                                Inspired by{" "}
                                <span>
                                  {
                                    deck.inspiration
                                  }
                                </span>
                              </>
                            )}
                          </p>
                        )}

                        {hasValue(
                          deck.suggested_date,
                        ) && (
                          <p>
                            Suggested on{" "}
                            {deck.suggested_date}
                          </p>
                        )}

                        {hasValue(
                          deck.updated_date,
                        ) && (
                          <p>
                            Updated on{" "}
                            {deck.updated_date}
                          </p>
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
                        {copied
                          ? "Link Copied!"
                          : "Share Deck"}
                      </button>

                      {hasValue(deck.image) && (
                        <button
                          type="button"
                          className="download-btn"
                          onClick={
                            handleDownload
                          }
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
                            onClick={
                              startEditing
                            }
                            disabled={isSaving}
                          >
                            Edit Deck
                          </button>

                          <button
                            type="button"
                            className="admin-modal-delete"
                            onClick={
                              handleDelete
                            }
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
                            onClick={
                              cancelEditing
                            }
                            disabled={isSaving}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="admin-modal-save"
                            onClick={
                              handleEditSave
                            }
                            disabled={isSaving}
                          >
                            {isSaving
                              ? "Saving..."
                              : "Save Changes"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-info">
                  {editing ? (
                    <EditDeckModal
                      ref={editModalRef}
                      deck={deck}
                      allCards={allCards}
                      onSave={onSave}
                      onComplete={handleEditComplete}
                      imageFile={editImageFile}
                      imageUrl={editImagePreview}
                      onSavingChange={
                        setEditSavingLocal
                      }
                    />
                  ) : (
                    <>
                      <div className="modal-header">
                        <div className="modal-title-content">
                          <h2 className="modal-title">
                            {deck.name ||
                              "Untitled Deck"}
                          </h2>

                          <span className="deck-hero">
                            {deck.hero ||
                              "Unknown Hero"}
                          </span>
                        </div>
                      </div>

                      <section className="modal-section description-section">
                        <h3>
                          Description
                        </h3>

                        <p className="description">
                          {description}
                        </p>
                      </section>

                      <section className="modal-metadata">
                        {hasValue(
                          toExternalUrl(
                            deck.deck_doc,
                          ),
                        ) && (
                          <div className="metadata-item">
                            <span className="label">
                              Deck Tutorial
                            </span>

                            <a
                              href={toExternalUrl(
                                deck.deck_doc,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="deck-doc-link"
                            >
                              Open tutorial
                            </a>
                          </div>
                        )}

                        <div className="metadata-item">
                          <span className="label">
                            Category
                          </span>

                          <span className="value">
                            {deck.category ||
                              "-"}
                          </span>
                        </div>

                        <div className="metadata-item">
                          <span className="label">
                            Archetype
                          </span>

                          <span className="value">
                            {deck.archetype ||
                              "-"}
                          </span>
                        </div>

                        <div className="metadata-item cost-item">
                          <span className="label">
                            Cost
                          </span>

                          <span className="cost-value">
                            {deck.cost || "-"}

                            <img
                              src="https://i.ibb.co/jZkdqf6y/spark.webp"
                              alt="Spark icon"
                              className="spark-icon"
                            />
                          </span>
                        </div>
                      </section>

                      {isAdmin && (
                        <section className="modal-section admin-cards-section">
                          <h3>
                            Cards
                          </h3>

                          <div className="admin-cards-value">
                            {hasValue(
                              deck.cards,
                            )
                              ? formatCardsDisplay(
                                  deck.cards,
                                ) ||
                                deck.cards
                              : "No cards listed."}
                          </div>
                        </section>
                      )}
                    </>
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

export default DeckCard;
