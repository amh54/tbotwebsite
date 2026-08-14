import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  WallKnight: ["brown", "yellow"],

  Brainfreeze: ["black", "blue"],
  "Electric Boogaloo": ["blue", "purple"],
  HugeGigantacus: ["pink", "black"],
  SuperBrainz: ["pink", "black"],
  Immorticia: ["pink", "blue"],
  Impfinity: ["black", "purple"],
  Neptuna: ["orange", "black"],
  "Professor Brainstorm": ["pink", "purple"],
  Rustbolt: ["pink", "orange"],
  "The Smash": ["orange", "blue"],
  Zmech: ["orange", "purple"],
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
function DeckCard({ decklist }) {
  const deck = decklist ?? {};
  const [heroColor1, heroColor2] = getHeroColors(deck.hero);
  const deckKey = String(deck.deckid || deck.id || deck.name || "");

  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  // If the URL already contains ?deck=<this deck's key> on mount (or after
  // navigation), open this card's modal automatically.
  useEffect(() => {
    if (deckKey && searchParams.get("deck") === deckKey) {
      setOpen(true);
    }
  }, [searchParams, deckKey]);

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

  const openModal = () => {
    setOpen(true);

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("deck", deckKey);
    setSearchParams(next);
  };

  const closeModal = () => {
    setOpen(false);

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (next.get("deck") === deckKey) {
      next.delete("deck");
      setSearchParams(next);
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
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleDownload = async () => {
    if (!deck.image) {
      return;
    }

    try {
      const response = await fetch(deck.image, { mode: "cors" });

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
    } catch (err) {
      console.error("Direct download blocked, opening image instead", err);
      window.open(deck.image, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <div className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}>
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
            onClick={openModal}
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
              onClick={closeModal}
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
