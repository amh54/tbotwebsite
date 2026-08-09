import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CardModal from "../components/cardmodal";

import "../css/cardinformation.css";

const getApiBaseUrl = () => {
  const stripTrailingSlashes = (value) => {
    let normalized = value;
    while (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  };

  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (envBaseUrl) {
    return stripTrailingSlashes(envBaseUrl);
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    if (isLocalhost) {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const STAT_ICON_LINKS = {
  cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
  strength: "https://i.ibb.co/GQt785K6/strength.webp",
  health: "https://i.ibb.co/bMj86Wvg/health.webp",
};

const TRAIT_ICON_LINKS = {
  antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
  deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
  special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
};

function CardInformation() {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";
  const hasStrikethroughTrait = (traits) =>
    /strikethrough/i.test(String(traits || ""));
  const renderTraitText = (text) => {
    if (!text) {
      return null;
    }

    const traitPattern =
      /(anti[-\s]?hero|strikethrough|deadly)(?:\s+\*+\d+)?/gi;

    const matches = [...text.matchAll(traitPattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const matchText = match[0];
      const traitName = match[1].toLowerCase();

      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      let iconUrl = "";
      let iconAlt = "";

      if (traitName.startsWith("anti")) {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.default.antihero;
        iconAlt = "Antihero";
      } else if (traitName === "strikethrough") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.default.strikethrough;
        iconAlt = "Strikethrough";
      } else if (traitName === "deadly") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.default.deadly;
        iconAlt = "Deadly";
      }

      parts.push(
        <span className="trait-with-icon" key={`trait-${index}`}>
          <img className="trait-icon" src={iconUrl} alt={iconAlt} />
          <span>{matchText}</span>
        </span>,
      );

      lastIndex = match.index + matchText.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const getPreviewStrengthIcon = (traits) =>
    /deadly/i.test(String(traits || "")) &&
    /strikethrough/i.test(String(traits || ""))
      ? TRAIT_ICON_LINKS.special
      : /deadly/i.test(String(traits || ""))
        ? TRAIT_ICON_LINKS.deadly
        : /anti[-\s]?hero/i.test(String(traits || ""))
          ? TRAIT_ICON_LINKS.antihero
          : hasStrikethroughTrait(traits)
            ? TRAIT_ICON_LINKS.strikethrough
            : STAT_ICON_LINKS.strength;

  const [cards, setCards] = useState([]);

  const [selectedCard, setSelectedCard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/cardinformation/`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;
          try {
            const errorPayload = await response.json();
            if (errorPayload?.detail) {
              message = `${message}: ${errorPayload.detail}`;
            } else if (errorPayload?.error) {
              message = `${message}: ${errorPayload.error}`;
            }
          } catch (_error) {
            // Ignore non-JSON error payloads and keep status-based message.
          }
          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();
        const responseText = await response.text();
        const hint = import.meta.env.VITE_API_BASE_URL
          ? "Check that VITE_API_BASE_URL points to your backend domain."
          : "VITE_API_BASE_URL is missing; set it in frontend deployment settings.";

        if (!contentType.includes("application/json")) {
          const startsLikeHtml = responseText.trim().startsWith("<");
          if (startsLikeHtml) {
            throw new Error(
              `Received HTML instead of JSON from ${endpoint}. ${hint}`,
            );
          }
          throw new Error(
            `Unexpected response type (${contentType || "unknown"}) from ${endpoint}. ${hint}`,
          );
        }

        const data = JSON.parse(responseText);
        setCards(Array.isArray(data) ? data : []);
        setError("");
      } catch (fetchError) {
        console.error(fetchError);
        setError(
          `Unable to load cards right now. ${fetchError.message || ""}`.trim(),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  if (loading) {
    return (
      <div className="card-page">
        <h1>Loading Cards...</h1>
      </div>
    );
  }

  return (
    <div className="card-page">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Tbot</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/decklists">Decklists</Link>
          <Link to="/cardinformation">Card Information</Link>
        </div>
      </nav>

      <h1>Card Information</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="card-grid">
        {cards.map((card) => (
          <div className="card-item" key={card.cardid}>
            <div className="card-item-media">
              <img src={card.thumbnail} alt={card.card_name} />
            </div>

            <div className="card-item-info">
              <h2>{card.card_name || "Unknown Card"}</h2>

              {hasValue(card.card_type) && (
                <p>
                  <span>Type:</span> {card.card_type}
                </p>
              )}

              {hasValue(card.traits) && (
                <div className="metadata-item trait-item">
                  <span className="label">Traits</span>

                  <span className="value trait-value">
                    {renderTraitText(traitsText)}
                  </span>
                </div>
              )}

              {(hasValue(card.cost) ||
                hasValue(card.strength) ||
                hasValue(card.health)) && (
                <p className="card-stats-line">
                  <span className="card-field-label">Stats:</span>

                  {hasValue(card.cost) && (
                    <span className="card-stat-row stat-cost">
                      {card.cost}
                      <img
                        src={STAT_ICON_LINKS.cost}
                        alt="Cost"
                        className="card-stat-icon"
                      />
                    </span>
                  )}

                  {hasValue(card.strength) && (
                    <span className="card-stat-row stat-strength">
                      {card.strength}
                      <img
                        src={getPreviewStrengthIcon(card.traits)}
                        alt="Strength"
                        className="card-stat-icon"
                      />
                    </span>
                  )}

                  {hasValue(card.health) && (
                    <span className="card-stat-row stat-health">
                      {card.health}
                      <img
                        src={STAT_ICON_LINKS.health}
                        alt="Health"
                        className="card-stat-icon"
                      />
                    </span>
                  )}
                </p>
              )}

              {hasValue(card.set_rarity) && (
                <p>
                  <span>Rarity:</span> {card.set_rarity}
                </p>
              )}

              <button type="button" onClick={() => setSelectedCard(card)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <CardModal card={selectedCard} close={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default CardInformation;
