
import EditDeckModal from "../modals/editDeckModal.jsx";
import DeckCardActions from "../decks/deckCardActions.jsx";
import DeckSuggestMessage from "../decks/deckSuggestMessage.jsx";
import DeckCardAdminActions from "./deckCardAdminActions";
import { useMemo, useState } from "react";
import {
  formatCardsDisplay,
  formatCost,
  formatDeckDate,
  hasValue,
  toExternalUrl,
} from "../../utils/deckCardHelpers";

function getYouTubeVideoId(parsed) {
  const { hostname, pathname, searchParams } = parsed;

  if (hostname === "youtu.be") {
    return pathname.split("/")[1] || "";
  }

  if (
    hostname !== "www.youtube.com" &&
    hostname !== "youtube.com" &&
    hostname !== "m.youtube.com"
  ) {
    return "";
  }

  if (pathname === "/watch") {
    return searchParams.get("v") || "";
  }

  if (pathname.startsWith("/shorts/") || pathname.startsWith("/embed/")) {
    return pathname.split("/")[2] || "";
  }

  return "";
}

function getYouTubeEmbedUrl(url) {
  const value = String(url || "").trim();

  if (!value) return "";

  try {
    const parsed = new URL(value);
    const videoId = getYouTubeVideoId(parsed);

    if (!videoId) return "";
    if (parsed.pathname.startsWith("/embed/")) return value;

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return "";
  }
}

function getMissingCards(deckCards, userCollection) {
  const ownedCards = new Map();

  for (const card of userCollection) {
    const name = String(card.card_name || card.name || "")
      .trim()
      .toLowerCase();

    if (!name) continue;

    const quantity = Number(card.quantity ?? card.count ?? 0);
    ownedCards.set(name, (ownedCards.get(name) || 0) + quantity);
  }

  return String(deckCards || "")
    .split(/\r?\n/)
    .map((line) => {
      const separator = line.lastIndexOf("|");

      if (separator === -1) return null;

      const name = line.slice(0, separator).trim();
      const required = Number(line.slice(separator + 1).trim());

      if (!name || !Number.isFinite(required) || required <= 0) {
        return null;
      }

      const owned = ownedCards.get(name.toLowerCase()) || 0;

      return {
        name,
        required,
        owned,
        missing: Math.max(0, required - owned),
      };
    })
    .filter((card) => card && card.missing > 0);
}

function DeckImageContent({
  editing,
  deck,
  deckImage,
  editImage,
  imgError,
  setImgError,
  editImgError,
  setEditImgError
}) {
  if (editing) {
    if (editImage && !editImgError) {
      return (
        <img
          src={editImage}
          alt={deck.name || "Deck image"}
          onError={() => setEditImgError(true)}
        />
      );
    }

    return <div className="deck-image-placeholder">No image</div>;
  }

  if (deckImage && !imgError) {
    return (
      <img
        src={deckImage}
        alt={deck.name || "Deck image"}
        onError={() => setImgError(true)}
      />
    );
  }

  return <div className="deck-image-placeholder">No image</div>;
}

function DeckImageMeta({ deck, dateLabel }) {
  const hasCreators =
    hasValue(deck.creator) ||
    hasValue(deck.optimization) ||
    hasValue(deck.inspiration);

  if (
    !hasCreators &&
    !hasValue(deck.suggested_date) &&
    !hasValue(deck.updated_date)
  ) {
    return null;
  }

  return (
    <div className="image-meta">
      {hasCreators && (
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
              {hasCreators &&
              (hasValue(deck.creator) || hasValue(deck.optimization))
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
  );
}

function DeckImagePanel(props) {
  const {
    editing,
    deck,
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
    publishedDecks,
    savingDeck,
    deckSaved,
    saveMessage,
    startEditing,
    handleDelete,
    cancelEditing,
    handleEditSave,
  } = props;

  return (
    <div className="modal-image">
      <DeckImageContent {...props} />

      {editing && (
        <label className="admin-modal-field">
          <span>Upload Image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleEditImageFileChange}
            disabled={isSaving}
          />
        </label>
      )}

      {!editing && <DeckImageMeta deck={deck} dateLabel={props.dateLabel} />}

      {!editing && (
        <DeckCardActions
          isAdmin={isAdmin}
          copied={copied}
          onShare={handleShare}
          showSuggestDeck={showSuggestDeck}
          checkingLogin={checkingLogin}
          suggesting={suggesting}
          suggestStatus={suggestStatus}
          side={deck.side}
          hero={deck.hero}
          onSuggestDeck={handleSuggestDeck}
          deckHasImage={deckHasImage}
          onDownload={handleDownload}
          hideShare={hideShare}
          onSaveDeck={isSavedDeck ? handleRemoveSavedDeck : handleSaveDeck}
          publishedDecks={publishedDecks}
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
  );
}

function ToggleSectionHeader({ title, expanded, onToggle }) {
  return (
    <div className="missing-cards-header">
      <h3>{title}</h3>
      <button
        type="button"
        className="missing-cards-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? "Hide ▲" : "Show ▼"}
      </button>
    </div>
  );
}

function DescriptionSection({ description }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="modal-section description-section">
      <ToggleSectionHeader
        title="Description"
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
      />

      {expanded ? (
        <p className="description">{description}</p>
      ) : (
        <p className="missing-cards-summary">Description hidden.</p>
      )}
    </section>
  );
}

function MissingCardsSection({ missingCards }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="modal-section missing-cards-section">
      <div className="missing-cards-header">
        <h3>Missing Cards</h3>

        {missingCards.length > 0 && (
          <button
            type="button"
            className="missing-cards-toggle"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
          >
            {expanded ? "Hide ▲" : "Show ▼"}
          </button>
        )}
      </div>

      {!expanded && (
        <p className="missing-cards-summary">
          {missingCards.length > 0
            ? `${missingCards.length} cards missing`
            : "You own every card needed for this deck."}
        </p>
      )}

      {expanded && missingCards.length > 0 && (
        <ul className="missing-cards-list">
          {missingCards.map((card) => (
            <li key={card.name}>
              <span>{card.name}</span>
              <span>
                ({card.owned}/{card.required} owned)
              </span>
            </li>
          ))}
        </ul>
      )}

      {expanded && missingCards.length === 0 && (
        <p>You own every card needed for this deck.</p>
      )}
    </section>
  );
}

function DeckMetadata({ deck, tutorialUrl, youtubeEmbedUrl, isAdmin, ownerName }) {
  return (
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
  );
}

function DeckInfoPanel({
  editing,
  deck,
  allCards,
  editModalRef,
  onSave,
  handleEditComplete,
  editImageFile,
  editImagePreview,
  setEditSavingLocal,
  description,
  missingCards,
  discordUser,
  collectionLoaded,
  tutorialUrl,
  youtubeEmbedUrl,
  isAdmin,
  ownerName,
  showSuggestDeck,
  suggestStatus,
  suggestMessage,
  suggestCooldown,
  suggestionId,
}) {
  if (editing) {
    return (
      <div className="modal-info">
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
      </div>
    );
  }

  return (
    <div className="modal-info">
      <div className="modal-header">
        <div className="modal-title-content">
          <h2 className="modal-title">{deck.name || "Untitled Deck"}</h2>
          <span className="deck-hero">{deck.hero || "Unknown Hero"}</span>
        </div>
      </div>

      <DescriptionSection description={description} />

      {discordUser && collectionLoaded && (
        <MissingCardsSection missingCards={missingCards} />
      )}

      <DeckMetadata
        deck={deck}
        tutorialUrl={tutorialUrl}
        youtubeEmbedUrl={youtubeEmbedUrl}
        isAdmin={isAdmin}
        ownerName={ownerName}
      />

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
    </div>
  );
}

function DeckCardModal(props) {
  const {
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
    publishedDecks = [],
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
    userCollection = [],
    collectionLoaded = false,
    discordUser = null,
  } = props;

  const missingCards = useMemo(() => {
    if (!collectionLoaded || !discordUser) return [];
    return getMissingCards(deck.cards, userCollection);
  }, [deck.cards, userCollection, collectionLoaded, discordUser]);

  if (!open) return null;

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
            <DeckImagePanel
              editing={editing}
              deck={deck}
              deckImage={deckImage}
              editImage={editImage}
              imgError={imgError}
              setImgError={setImgError}
              editImgError={editImgError}
              setEditImgError={setEditImgError}
              editImageFile={editImageFile}
              handleEditImageFileChange={handleEditImageFileChange}
              isSaving={isSaving}
              isAdmin={isAdmin}
              copied={copied}
              handleShare={handleShare}
              showSuggestDeck={showSuggestDeck}
              checkingLogin={checkingLogin}
              suggesting={suggesting}
              suggestStatus={suggestStatus}
              handleSuggestDeck={handleSuggestDeck}
              deckHasImage={deckHasImage}
              handleDownload={handleDownload}
              hideShare={hideShare}
              isSavedDeck={isSavedDeck}
              handleRemoveSavedDeck={handleRemoveSavedDeck}
              handleSaveDeck={handleSaveDeck}
              publishedDecks={publishedDecks}
              savingDeck={savingDeck}
              deckSaved={deckSaved}
              saveMessage={saveMessage}
              startEditing={startEditing}
              handleDelete={handleDelete}
              cancelEditing={cancelEditing}
              handleEditSave={handleEditSave}
              dateLabel={dateLabel}
            />

            <DeckInfoPanel
              editing={editing}
              deck={deck}
              allCards={allCards}
              editModalRef={editModalRef}
              onSave={onSave}
              handleEditComplete={handleEditComplete}
              editImageFile={editImageFile}
              editImagePreview={editImagePreview}
              setEditSavingLocal={setEditSavingLocal}
              description={description}
              missingCards={missingCards}
              discordUser={discordUser}
              collectionLoaded={collectionLoaded}
              tutorialUrl={tutorialUrl}
              youtubeEmbedUrl={youtubeEmbedUrl}
              isAdmin={isAdmin}
              ownerName={ownerName}
              showSuggestDeck={showSuggestDeck}
              suggestStatus={suggestStatus}
              suggestMessage={suggestMessage}
              suggestCooldown={suggestCooldown}
              suggestionId={suggestionId}
            />
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default DeckCardModal;
