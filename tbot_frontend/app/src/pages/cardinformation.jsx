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
  sun: "https://i.ibb.co/3mwp3d6s/sun.webp",
};

const TRAIT_ICON_LINKS = {
  antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
  deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
  special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
  freeze: "https://i.ibb.co/hFPRcrp6/freeze.webp",
  bullseye: "https://i.ibb.co/tTp9zzdh/Bullseye.webp",
  frenzy: "https://i.ibb.co/0RC4sW0b/frenzy.webp",
  armored: "https://i.ibb.co/SXTYdVry/armored.webp",
  overshoot: "https://i.ibb.co/prbYt2DX/overshoot.webp",
};

function CardInformation() {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";
  const getEmojiIcon = (emoji) => {
    const normalized = String(emoji || "").toLowerCase();

    if (normalized.startsWith("<:brainz:")) {
      return {
        url: STAT_ICON_LINKS.cost,
        alt: "Brainz",
      };
    }

    if (normalized.startsWith("<:strength:")) {
      return {
        url: STAT_ICON_LINKS.strength,
        alt: "Strength",
      };
    }

    if (normalized.startsWith("<:health:")) {
      return {
        url: STAT_ICON_LINKS.health,
        alt: "Health",
      };
    }

    if (normalized.startsWith("<:sun:")) {
      return {
        url: STAT_ICON_LINKS.sun,
        alt: "Sun",
      };
    }

    if (normalized.startsWith("<:deadly:")) {
      return {
        url: TRAIT_ICON_LINKS.deadly,
        alt: "Deadly",
      };
    }

    if (normalized.startsWith("<:freeze:")) {
      return {
        url: TRAIT_ICON_LINKS.freeze,
        alt: "Freeze",
      };
    }

    if (normalized.startsWith("<:antihero:")) {
      return {
        url: TRAIT_ICON_LINKS.antihero,
        alt: "Anti-Hero",
      };
    }

    if (normalized.startsWith("<:strikethrough:")) {
      return {
        url: TRAIT_ICON_LINKS.strikethrough,
        alt: "Strikethrough",
      };
    }

    if (normalized.startsWith("<:special:")) {
      return {
        url: TRAIT_ICON_LINKS.special,
        alt: "Special",
      };
    }

    if (normalized.startsWith("<:bullseye:")) {
      return {
        url: TRAIT_ICON_LINKS.bullseye,
        alt: "Bullseye",
      };
    }

    if (normalized.startsWith("<:frenzy:")) {
      return {
        url: TRAIT_ICON_LINKS.frenzy,
        alt: "Frenzy",
      };
    }

    if (normalized.startsWith("<:armored:")) {
      return {
        url: TRAIT_ICON_LINKS.armored,
        alt: "Armored",
      };
    }

    if (normalized.startsWith("<:overshoot:")) {
      return {
        url: TRAIT_ICON_LINKS.overshoot,
        alt: "Overshoot",
      };
    }

    return null;
  };

  const renderStatsText = (stats) => {
    if (!stats) {
      return null;
    }

    const text = String(stats);

    const pattern = /(<:[^:>]+:\d+>)(\*{0,2}|_{0,2})?/gi;

    const matches = [...text.matchAll(pattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullEmoji = match[1];
      const formatting = match[2] || "";
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`stats-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      const icon = getEmojiIcon(fullEmoji);

      if (icon) {
        parts.push(
          <img
            key={`stats-icon-${index}`}
            src={icon.url}
            alt={icon.alt}
            className="card-stat-icon"
          />,
        );
      } else {
        parts.push(<span key={`stats-unknown-${index}`}>{fullEmoji}</span>);
      }
      lastIndex = matchIndex + fullEmoji.length + formatting.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="stats-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const renderTraitText = (text) => {
    if (!text) {
      return null;
    }

    const traitPattern =
      /(anti[-\s]?hero|strikethrough|deadly|bullseye|frenzy|armored|overshoot|freeze|special)(?:\s+\*+\d+)?/gi;

    const matches = [...String(text).matchAll(traitPattern)];

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
          <span key={`trait-text-${index}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      let iconUrl = "";
      let iconAlt = "";

      if (traitName.startsWith("anti")) {
        iconUrl = TRAIT_ICON_LINKS.antihero;
        iconAlt = "Anti-Hero";
      } else if (traitName === "strikethrough") {
        iconUrl = TRAIT_ICON_LINKS.strikethrough;
        iconAlt = "Strikethrough";
      } else if (traitName === "deadly") {
        iconUrl = TRAIT_ICON_LINKS.deadly;
        iconAlt = "Deadly";
      } else if (traitName === "bullseye") {
        iconUrl = TRAIT_ICON_LINKS.bullseye;
        iconAlt = "Bullseye";
      } else if (traitName === "frenzy") {
        iconUrl = TRAIT_ICON_LINKS.frenzy;
        iconAlt = "Frenzy";
      } else if (traitName === "armored") {
        iconUrl = TRAIT_ICON_LINKS.armored;
        iconAlt = "Armored";
      } else if (traitName === "overshoot") {
        iconUrl = TRAIT_ICON_LINKS.overshoot;
        iconAlt = "Overshoot";
      } else if (traitName === "freeze") {
        iconUrl = TRAIT_ICON_LINKS.freeze;
        iconAlt = "Freeze";
      } else if (traitName === "special") {
        iconUrl = TRAIT_ICON_LINKS.special;
        iconAlt = "Special";
      }

      if (iconUrl) {
        parts.push(
          <span className="trait-with-icon" key={`trait-${index}`}>
            <img className="trait-icon" src={iconUrl} alt={iconAlt} />

            <span>{matchText}</span>
          </span>,
        );
      } else {
        parts.push(<span key={`trait-${index}`}>{matchText}</span>);
      }

      lastIndex = match.index + matchText.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="trait-text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

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
          } catch (_error) {}

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
            `Unexpected response type ${
              contentType || "unknown"
            } from ${endpoint}. ${hint}`,
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
    return <div>Loading Cards...</div>;
  }

  return (
    <div className="card-page">
      <nav className="page-nav">
        <Link to="/">Home</Link>
        <Link to="/decklists">Decklists</Link>
        <Link to="/cards">Card Information</Link>
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
                <p className="card-traits-line">
                  <span className="card-field-label">Traits:</span>

                  <span className="card-traits-value">
                    {renderTraitText(String(card.traits))}
                  </span>
                </p>
              )}

              {hasValue(card.stats) && (
                <p className="card-stats-line">
                  <span className="card-field-label">Stats:</span>

                  <span className="card-stats-value">
                    {renderStatsText(String(card.stats))}
                  </span>
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

      {selectedCard !== null && (
        <CardModal card={selectedCard} close={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default CardInformation;
