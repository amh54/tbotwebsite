import EditDeckModal from "../modals/editDeckModal.jsx";
import DeckCardActions from "../decks/deckCardActions.jsx";
import DeckSuggestMessage from "../decks/deckSuggestMessage.jsx";
import DeckCardAdminActions from "./deckCardAdminActions";
import {
  formatCardsDisplay,
  formatCost,
  formatDeckDate,
  hasValue,
  toExternalUrl,
} from "../../utils/deckCardHelpers";

function getYouTubeEmbedUrl(url) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);

    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        const videoId = parsed.searchParams.get("v");

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const videoId = parsed.pathname.split("/")[2];

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return value;
      }
    }

    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.split("/")[1];

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return "";
  }

  return "";
}

function DeckCardModal({
  open,
  editing,
  deck,
  allCards,
  editModalRef,
  deckImage,
  editImage,
  imgError,
  setImgError,
  editImgError,
  setEditImgError,
  editImageFile,
  editImagePreview,
  handleEditImageFileChange,
  isSaving,
  isAdmin,
  copied,
  handleShare,
  showSuggestDeck,
  checkingLogin,
  suggesting,
  suggestStatus,
  handleSuggestDeck,
  deckHasImage,
  handleDownload,
  hideShare,
  isSavedDeck,
  handleRemoveSavedDeck,
  handleSaveDeck,
  savingDeck,
  deckSaved,
  saveMessage,
  startEditing,
  handleDelete,
  cancelEditing,
  handleEditSave,
  suggestMessage,
  suggestCooldown,
  suggestionId,
  description,
  ownerName,
  dateLabel,
  onSave,
  handleEditComplete,
  setEditSavingLocal,
  closeModal,
}) {
  if (!open) {
    return null;
  }

  const tutorialUrl = toExternalUrl(deck.deck_doc);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(tutorialUrl);

  return (
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
                  deckHasImage={deckHasImage}
                  onDownload={handleDownload}
                  hideShare={hideShare}
                  onSaveDeck={
                    isSavedDeck ? handleRemoveSavedDeck : handleSaveDeck
                  }
                  savingDeck={savingDeck}
                  deckSaved={deckSaved}
                  isSavedDeck={isSavedDeck}
                />
              )}

              {!isAdmin && saveMessage && (
                <p className="saved-deck-message">{saveMessage}</p>
              )}

              {isAdmin && (
                <DeckCardAdminActions
                  editing={editing}
                  isSaving={isSaving}
                  startEditing={startEditing}
                  handleDelete={handleDelete}
                  cancelEditing={cancelEditing}
                  handleEditSave={handleEditSave}
                />
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
                    {hasValue(tutorialUrl) && (
                      <div className="metadata-item deck-tutorial-item">
                        <span className="label">Deck Tutorial</span>

                        {!youtubeEmbedUrl && (
                          <a
                            href={tutorialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="deck-doc-link"
                          >
                            Open tutorial
                          </a>
                        )}

                        {youtubeEmbedUrl && (
                          <div className="deck-youtube-player">
                            <iframe
                              src={youtubeEmbedUrl}
                              title={`${deck.name || "Deck"} tutorial`}
                              loading="lazy"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        )}
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
                          src="https://cdn.pvzhtbot.com/icons/spark.webp"
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
                    isUserDeck={false}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default DeckCardModal;
