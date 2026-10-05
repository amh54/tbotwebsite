import { formatCost, hasValue } from "../../utils/deckCardHelpers";
function getTutorialType(url) {
  const value = String(url || "").toLowerCase();

  if (value.includes("docs.google.com")) {
    return "google-docs";
  }

  if (value.includes("youtube.com") || value.includes("youtu.be")) {
    return "youtube";
  }

  if (value.includes("drive.google.com")) {
    return "google-drive";
  }

  return "external";
}

function TutorialIcon({ type }) {
  if (type === "youtube") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="deck-tutorial-icon"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.5 3.7-6.5 3.7Z"
        />
      </svg>
    );
  }

  if (type === "google-docs") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="deck-tutorial-icon"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2.8L17.2 8H14V4.8ZM8 12h8v1.5H8V12Zm0 3h8v1.5H8V15Zm0-6h4v1.5H8V9Z"
        />
      </svg>
    );
  }

  if (type === "google-drive") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="deck-tutorial-icon"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M8.1 3h7.8l5.7 10H13.8L8.1 3Zm-2.2 0L0.2 13h5.7l5.7-10H5.9Zm-.2 12L2.8 21h11.5l2.9-6H5.7Zm10.7 0 2.8 6h5.7l-2.8-6h-5.7Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="deck-tutorial-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3ZM5 5h5v2H7v10h10v-3h2v5H5V5Z"
      />
    </svg>
  );
}
function DeckCardPreview({
  deck,
  deckImage,
  imgError,
  setImgError,
  heroColor1,
  heroColor2,
  isSavedDeck,
  isAdmin,
  ownerName,
  onOpen,
}) {
  return (
    <div
      className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
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
       <h3>
  {deck.name || "Untitled Deck"}

  {hasValue(deck.deck_doc) && (
    <a
      href={deck.deck_doc}
      target="_blank"
      rel="noopener noreferrer"
      className="deck-tutorial-link"
      onClick={(event) => {
        event.stopPropagation();
      }}
      title="Open deck tutorial"
      aria-label="Open deck tutorial"
    >
      <TutorialIcon type={getTutorialType(deck.deck_doc)} />
    </a>
  )}
</h3>

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
            src="https://cdn.pvzhtbot.com/icons/spark.webp"
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

        {isSavedDeck && (
          <div className="saved-deck-source">
            Saved from:{" "}
            {String(deck.source_type || deck.sourceType || "").toLowerCase() ===
            "user_deck"
              ? "User Decks"
              : String(
                    deck.source_type || deck.sourceType || "",
                  ).toLowerCase() === "legacy"
                ? "Legacy Decks"
                : "Decklists"}
          </div>
        )}

        {isAdmin && hasValue(ownerName) && (
          <p>
            <span>Owner:</span> {ownerName}
          </p>
        )}
      </div>
    </div>
  );
}

export default DeckCardPreview;
