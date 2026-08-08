import { useState } from "react";
import "../css/deckmodal.css";

function DeckCard({ decklist }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const deck = decklist ?? {};

  const description = deck.description || "No description available.";
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

    // Accept full URLs, markdown links, and plain domains from DB values.
    const markdownMatch = /\((https?:\/\/[^)]+)\)/i.exec(raw);
    const inlineUrlMatch = /https?:\/\/\S+/i.exec(raw);

    let candidate = (markdownMatch?.[1] || inlineUrlMatch?.[0] || raw)
      .trim()
      .replaceAll(/\s+/g, "");

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

  const deckDocUrl = toExternalUrl(deck.deck_doc);

  return (
    <>
      <div className="deck-listing-card">
        <div className="deck-card-image-only">
          {deck.image && !imgError ? (
            <img
              src={deck.image}
              alt={deck.name || "Deck image"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="deck-image-placeholder">No image</div>
          )}

          <button
            type="button"
            className="view-details-btn"
            onClick={() => setOpen(true)}
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
            <p>
              <span>Creator:</span> {deck.creator}
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
        <div className="modal-overlay">
          <dialog
            open
            className="modal"
            aria-label={`Details for ${deck.name || "deck"}`}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close details"
            >
              X
            </button>

            <div className="modal-content">
              <div className="modal-image">
                {deck.image && !imgError ? (
                  <img
                    src={deck.image}
                    alt={deck.name || "Deck image"}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="deck-image-placeholder">No image</div>
                )}

                {(hasValue(deck.creator) ||
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
                            {hasValue(deck.creator) || hasValue(deck.optimization)
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
              </div>

              <div className="modal-info">
                <div className="modal-header">
                  <h2 className="modal-title">
                    {deck.name || "Untitled Deck"}
                  </h2>
                  <span className="deck-hero">
                    {deck.hero || "Unknown Hero"}
                  </span>
                </div>

                <section className="modal-section description-section">
                  <h3>Description</h3>
                  <p className="description">{description}</p>
                </section>

                <section className="modal-metadata">
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
                </section>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}

export default DeckCard;
