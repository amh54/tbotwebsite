import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../utils/api";
import {
  getHeroColors,
  getImageUrl,
  hasValue,
  getOwnerName,
  formatCost,
  formatDeckDate,
  toExternalUrl,
  formatCardsDisplay,
  normalizeDeckShareValue,
} from "../../utils/deckCardHelpers";
import { useDiscordLoginStatus } from "../../hooks/useDiscordLoginStatus";
import { useDeckSuggestion } from "../../hooks/useDeckSuggestion";
import AddDeckModal from "./AddDeckModal";
import EditDeckModal from "./EditDeckModal";
import DeckCardActions from "../decks/DeckCardActions.jsx";
import DeckSuggestMessage from "../decks/DeckSuggestMessage.jsx";
import "../../css/deckmodal.css";

function DeckCard({
  decklist,
  admin = false,
  adminMode = false,
  addMode = false,
  adminForm = false,
  onDelete,
  onSave,
  onAdd,
  onComplete,
  editSaving = false,
  allCards = [],
  profileSlug = "",
  profileIsPublic = null,
  autoOpen = false,
  legacy = false,
  decklists = false,
  deckbuilder = false,
  showSuggestDeck = false,
  isUserDeck = false
}) {
  const deck = decklist ?? {};

  const isAdmin = admin || adminMode;
  const [heroColor1, heroColor2] = getHeroColors(deck.hero);

  const deckId = deck.deckid ?? deck.deckID ?? deck.deckId ?? deck.id ?? "";

  const deckKey = String(deckId || deck.name || "").trim();

  const deckName = String(deck.name || "deck")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const shareDeckKey = deckName ? `${deckName}-${deckKey}` : deckKey;

  const isDeckUrlMatch = (urlDeck) => {
    const normalizedUrlDeck = normalizeDeckShareValue(urlDeck);

    if (!normalizedUrlDeck) {
      return false;
    }

    const normalizedDeckKey = normalizeDeckShareValue(deckKey);
    const normalizedShareDeckKey = normalizeDeckShareValue(shareDeckKey);

    return (
      normalizedUrlDeck === normalizedDeckKey ||
      normalizedUrlDeck === normalizedShareDeckKey
    );
  };

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

  const { isLoggedIn, setIsLoggedIn, checkingLogin } =
    useDiscordLoginStatus(showSuggestDeck);

  const {
    suggesting,
    suggestStatus,
    suggestMessage,
    suggestCooldown,
    suggestionId,
    handleSuggestDeck,
  } = useDeckSuggestion({
    showSuggestDeck,
    deckId,
    isLoggedIn,
    setIsLoggedIn,
  });

  const deckImage = getImageUrl(deck.image);

  const description = hasValue(deck.description)
    ? deck.description
    : "No description available.";

  const ownerName = getOwnerName(deck);

  useEffect(() => {
    if (addMode || autoOpen) {
      setOpen(true);
      return;
    }

    if (!deckKey) {
      return;
    }

    const urlDeck = searchParams.get("deck");

    if (isDeckUrlMatch(urlDeck)) {
      setOpen(true);
      setEditing(false);
    } else {
      setOpen(false);
      setEditing(false);
    }
  }, [searchParams, deckKey, shareDeckKey, addMode, autoOpen]);

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
      if (event.key === "Escape" && !editSavingLocal && !editSaving) {
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
  }, [editing, deck.image, editImageFile]);

  const openModal = () => {
    if (addMode) {
      setOpen(true);
      return;
    }

    setOpen(true);
    setEditing(false);

    if (autoOpen) {
      return;
    }

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("deck", shareDeckKey);
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

    if (autoOpen) {
      return;
    }

    const currentDeck = searchParams.get("deck");

    if (currentDeck && isDeckUrlMatch(currentDeck)) {
      const next = new URLSearchParams(searchParams);
      next.delete("deck");
      setSearchParams(next);
    }
  };

  const resetEditImageState = () => {
    setEditImageFile(null);
    setEditImagePreview(deck.image ?? "");
    setEditImgError(false);
  };

  const isSaving = editSavingLocal || editSaving;

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
      console.error("EditDeckModal save method is unavailable.");
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
    if (isAdmin || !deckKey) {
      return;
    }

    let shareUrl;

    if (deckbuilder || decklists || legacy) {
      shareUrl = new URL(window.location.pathname, window.location.origin);

      shareUrl.searchParams.set("deck", shareDeckKey);
    } else {
      const resolvedProfileSlug = String(
        profileSlug || deck.profile_slug || deck.profileSlug || "",
      ).trim();

      const resolvedProfileIsPublic =
        profileIsPublic !== null && profileIsPublic !== undefined
          ? profileIsPublic === true
          : deck.is_public === true ||
            deck.profile_is_public === true ||
            deck.profileIsPublic === true;

      if (resolvedProfileIsPublic && resolvedProfileSlug) {
        shareUrl = new URL(
          `/profile/${encodeURIComponent(resolvedProfileSlug)}`,
          window.location.origin,
        );

        shareUrl.searchParams.set("deck", shareDeckKey);
      } else if (resolvedProfileSlug) {
        shareUrl = new URL(
          `/deck/${encodeURIComponent(
            resolvedProfileSlug,
          )}/${encodeURIComponent(shareDeckKey)}`,
          window.location.origin,
        );
      } else {
        console.error(
          "Unable to create deck share link: profile slug is missing.",
        );
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl.toString());

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };
 const handleDownload = () => {
  if (isUserDeck) {
    const downloadDeckId = deck.id;

    if (!downloadDeckId) {
      return;
    }

    window.location.href =
      `${API_BASE_URL}/tbotapp/user-decks/${downloadDeckId}/download/`;

    return;
  }

  const downloadDeckId =
    deck.deckid ?? deck.deckID ?? deck.deckId;

  if (!downloadDeckId) {
    return;
  }

  window.location.href =
    `${API_BASE_URL}/tbotapp/decks/${downloadDeckId}/download/`;
};
  const handleAddComplete = (result) => {
    if (typeof onComplete === "function") {
      onComplete(result);
    }

    if (result) {
      setOpen(false);
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
        isAdmin={adminForm}
      />
    );
  }

  const editImage = getImageUrl(editImagePreview);

  const dateLabel =
    decklists || deckbuilder || legacy || admin ? "Suggested on" : "Added on";

  return (
    <>
      <div
        className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}
        onClick={openModal}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openModal();
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
              alt={deck.name || "Deck image"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="deck-image-placeholder">No image</div>
          )}
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
            <span>Cost:</span> {formatCost(deck.cost)}
            <img
              src="https://i.ibb.co/jZkdqf6y/spark.webp"
              alt="Spark icon"
              className="spark-icon"
            />
          </p>

          {hasValue(deck.creator) && (
            <p className="creator-field">
              <span className="field-label">Creator:</span>{" "}
              <span className="creator-value">{deck.creator}</span>
            </p>
          )}

          {hasValue(deck.optimization) && (
            <p>
              <span>Optimized by:</span> {deck.optimization}
            </p>
          )}

          {isAdmin && hasValue(ownerName) && (
            <p>
              <span>Owner:</span> {ownerName}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className="modal-overlay">
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
                      {editImage && !editImgError ? (
                        <img
                          src={editImage}
                          alt={deck.name || "Deck image"}
                          onError={() => setEditImgError(true)}
                        />
                      ) : (
                        <div className="deck-image-placeholder">No image</div>
                      )}

                      <label className="admin-modal-field">
                        <span>Upload Image</span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleEditImageFileChange}
                          disabled={isSaving}
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
                          <p>
                            {dateLabel} {formatDeckDate(deck.suggested_date)}
                          </p>
                        )}

                        {hasValue(deck.updated_date) && (
                          <p>Updated on {formatDeckDate(deck.updated_date)}</p>
                        )}
                      </div>
                    )}

                  {!editing && (
                    <DeckCardActions
                      isAdmin={isAdmin}
                      copied={copied}
                      onShare={handleShare}
                      showSuggestDeck={showSuggestDeck}
                      checkingLogin={checkingLogin}
                      suggesting={suggesting}
                      suggestStatus={suggestStatus}
                      onSuggestDeck={handleSuggestDeck}
                      deckHasImage={hasValue(deck.image)}
                      onDownload={handleDownload}
                    />
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
                            onClick={handleEditSave}
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
                  {editing ? (
                    <EditDeckModal
                      ref={editModalRef}
                      deck={deck}
                      allCards={allCards}
                      onSave={onSave}
                      onComplete={handleEditComplete}
                      imageFile={editImageFile}
                      imageUrl={editImagePreview}
                      onSavingChange={setEditSavingLocal}
                    />
                  ) : (
                    <>
                      <div className="modal-header">
                        <div className="modal-title-content">
                          <h2 className="modal-title">
                            {deck.name || "Untitled Deck"}
                          </h2>

                          <span className="deck-hero">
                            {deck.hero || "Unknown Hero"}
                          </span>
                        </div>
                      </div>

                      <section className="modal-section description-section">
                        <h3>Description</h3>
                        <p className="description">{description}</p>
                      </section>

                      <section className="modal-metadata">
                        {hasValue(toExternalUrl(deck.deck_doc)) && (
                          <div className="metadata-item">
                            <span className="label">Deck Tutorial</span>

                            <a
                              href={toExternalUrl(deck.deck_doc)}
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
                            {formatCost(deck.cost)}

                            <img
                              src="https://i.ibb.co/jZkdqf6y/spark.webp"
                              alt="Spark icon"
                              className="spark-icon"
                            />
                          </span>
                        </div>

                        {isAdmin && hasValue(ownerName) && (
                          <div className="metadata-item">
                            <span className="label">Owner</span>

                            <span className="value">{ownerName}</span>
                          </div>
                        )}
                      </section>

                      {isAdmin && (
                        <section className="modal-section admin-cards-section">
                          <h3>Cards</h3>

                          <div className="admin-cards-value">
                            {hasValue(deck.cards)
                              ? formatCardsDisplay(deck.cards) || deck.cards
                              : "No cards listed."}
                          </div>
                        </section>
                      )}

                      <DeckSuggestMessage
                        show={showSuggestDeck && !isAdmin}
                        suggestStatus={suggestStatus}
                        suggestMessage={suggestMessage}
                        suggestCooldown={suggestCooldown}
                        suggestionId={suggestionId}
                        isUserDeck = {false}
                      />
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
