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
  healthstrength: "https://i.ibb.co/9344x8fP/healthstrength.webp",
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
  untrickable: "https://i.ibb.co/235QDZsg/untrickable.webp",
  doublestrike: "https://i.ibb.co/9HcptVCN/doublestrike.webp",
};

const CLASS_ICON_LINKS = {
  guardian: "https://i.ibb.co/q339dYKK/guardian.webp",
  kabloom: "https://i.ibb.co/4gWkPT7f/kabloom.webp",
  megagrow: "https://i.ibb.co/svc6sx30/megagrow.webp",
  smarty: "https://i.ibb.co/V0bL3RYk/smarty.webp",
  solar: "https://i.ibb.co/V0bL3RYk/smarty.webp",
  beastly: "https://i.ibb.co/xS6b10P5/beastly.webp",
  brainy: "https://i.ibb.co/d40zFh8r/Brainy.webp",
  crazy: "https://i.ibb.co/HTvzSsXX/crazy.webp",
  hearty: "https://i.ibb.co/ynKbzV8v/hearty.webp",
  sneaky: "https://i.ibb.co/Hf5m7ndh/sneaky.webp",
};

function CardInformation() {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const getEmojiIcon = (emoji) => {
    const match = String(emoji || "").match(/^<:([^:]+):\d+>$/);

    if (!match) {
      return null;
    }

    const emojiName = match[1].toLowerCase().replace(/[-_\s]/g, "");

    const iconMap = {
      brainz: {
        url: STAT_ICON_LINKS.cost,
        alt: "Brainz",
      },

      strength: {
        url: STAT_ICON_LINKS.strength,
        alt: "Strength",
      },

      health: {
        url: STAT_ICON_LINKS.health,
        alt: "Health",
      },

      sun: {
        url: STAT_ICON_LINKS.sun,
        alt: "Sun",
      },

      healthstrength: {
        url: STAT_ICON_LINKS.healthstrength,
        alt: "Health and Strength",
      },

      deadly: {
        url: TRAIT_ICON_LINKS.deadly,
        alt: "Deadly",
      },

      freeze: {
        url: TRAIT_ICON_LINKS.freeze,
        alt: "Freeze",
      },

      antihero: {
        url: TRAIT_ICON_LINKS.antihero,
        alt: "Anti-Hero",
      },

      strikethrough: {
        url: TRAIT_ICON_LINKS.strikethrough,
        alt: "Strikethrough",
      },

      special: {
        url: TRAIT_ICON_LINKS.special,
        alt: "Special",
      },

      bullseye: {
        url: TRAIT_ICON_LINKS.bullseye,
        alt: "Bullseye",
      },

      frenzy: {
        url: TRAIT_ICON_LINKS.frenzy,
        alt: "Frenzy",
      },

      armored: {
        url: TRAIT_ICON_LINKS.armored,
        alt: "Armored",
      },

      overshoot: {
        url: TRAIT_ICON_LINKS.overshoot,
        alt: "Overshoot",
      },

      untrickable: {
        url: TRAIT_ICON_LINKS.untrickable,
        alt: "Untrickable",
      },

      doublestrike: {
        url: TRAIT_ICON_LINKS.doublestrike,
        alt: "Double Strike",
      },

      guardian: {
        url: CLASS_ICON_LINKS.guardian,
        alt: "Guardian",
      },

      kabloom: {
        url: CLASS_ICON_LINKS.kabloom,
        alt: "Kabloom",
      },

      megagrow: {
        url: CLASS_ICON_LINKS.megagrow,
        alt: "Mega-Grow",
      },

      smarty: {
        url: CLASS_ICON_LINKS.smarty,
        alt: "Smarty",
      },

      solar: {
        url: CLASS_ICON_LINKS.solar,
        alt: "Solar",
      },

      beastly: {
        url: CLASS_ICON_LINKS.beastly,
        alt: "Beastly",
      },

      brainy: {
        url: CLASS_ICON_LINKS.brainy,
        alt: "Brainy",
      },

      crazy: {
        url: CLASS_ICON_LINKS.crazy,
        alt: "Crazy",
      },

      hearty: {
        url: CLASS_ICON_LINKS.hearty,
        alt: "Hearty",
      },

      sneaky: {
        url: CLASS_ICON_LINKS.sneaky,
        alt: "Sneaky",
      },
    };

    return iconMap[emojiName] || null;
  };

  const renderTitleText = (title) => {
    if (!title) {
      return null;
    }

    const text = String(title);

    const emojiPattern = /<:[^:>]+:\d+>/gi;
    const matches = [...text.matchAll(emojiPattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`title-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      const icon = getEmojiIcon(fullMatch);

      if (icon) {
        parts.push(
          <img
            key={`title-icon-${index}`}
            src={icon.url}
            alt={icon.alt}
            className="card-title-class-icon"
          />,
        );
      } else {
        const emojiName = fullMatch.replace(/^<:([^:>]+):\d+>$/, "$1");

        parts.push(<span key={`title-unknown-${index}`}>{emojiName}</span>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="title-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
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
        const emojiName = fullEmoji.replace(/^<:([^:>]+):\d+>$/, "$1");

        parts.push(<span key={`stats-unknown-${index}`}>{emojiName}</span>);
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

    const value = String(text);

    const emojiPattern = /<:[^:>]+:\d+>/gi;
    const emojiMatches = [...value.matchAll(emojiPattern)];

    if (emojiMatches.length > 0) {
      const parts = [];
      let lastIndex = 0;

      emojiMatches.forEach((match, index) => {
        const fullMatch = match[0];
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
          const normalText = value.slice(lastIndex, matchIndex);

          parts.push(
            <span key={`trait-text-${index}`}>
              {normalText.replace(/__/g, "").replace(/\*\*/g, "")}
            </span>,
          );
        }

        const icon = getEmojiIcon(fullMatch);

        if (icon) {
          parts.push(
            <img
              key={`trait-icon-${index}`}
              className="trait-icon"
              src={icon.url}
              alt={icon.alt}
            />,
          );
        } else {
          const emojiName = fullMatch.replace(/^<:([^:>]+):\d+>$/, "$1");

          parts.push(<span key={`trait-unknown-${index}`}>{emojiName}</span>);
        }

        lastIndex = matchIndex + fullMatch.length;
      });

      if (lastIndex < value.length) {
        const remaining = value.slice(lastIndex);

        const cleaned = remaining.replace(/__/g, "").replace(/\*\*/g, "");

        if (cleaned) {
          parts.push(<span key="trait-end">{cleaned}</span>);
        }
      }

      return <span className="trait-rendered">{parts}</span>;
    }

    const traitPattern =
      /(anti[-\s]?hero|strikethrough|deadly|bullseye|frenzy|armored|overshoot|untrickable|doublestrike|freeze|special)/gi;

    const matches = [...value.matchAll(traitPattern)];

    if (matches.length === 0) {
      return <span>{value}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const matchText = match[0];
      const traitName = match[1].toLowerCase().replace(/[-\s]/g, "");

      if (match.index > lastIndex) {
        parts.push(
          <span key={`trait-text-${index}`}>
            {value.slice(lastIndex, match.index)}
          </span>,
        );
      }

      const iconMap = {
        antihero: [TRAIT_ICON_LINKS.antihero, "Anti-Hero"],
        strikethrough: [TRAIT_ICON_LINKS.strikethrough, "Strikethrough"],
        deadly: [TRAIT_ICON_LINKS.deadly, "Deadly"],
        bullseye: [TRAIT_ICON_LINKS.bullseye, "Bullseye"],
        frenzy: [TRAIT_ICON_LINKS.frenzy, "Frenzy"],
        armored: [TRAIT_ICON_LINKS.armored, "Armored"],
        overshoot: [TRAIT_ICON_LINKS.overshoot, "Overshoot"],
        untrickable: [TRAIT_ICON_LINKS.untrickable, "Untrickable"],
        doublestrike: [TRAIT_ICON_LINKS.doublestrike, "Double Strike"],
        freeze: [TRAIT_ICON_LINKS.freeze, "Freeze"],
        special: [TRAIT_ICON_LINKS.special, "Special"],
      };

      const icon = iconMap[traitName];

      if (icon) {
        parts.push(
          <span className="trait-with-icon" key={`trait-${index}`}>
            <img className="trait-icon" src={icon[0]} alt={icon[1]} />

            <span>{matchText}</span>
          </span>,
        );
      } else {
        parts.push(<span key={`trait-${index}`}>{matchText}</span>);
      }

      lastIndex = match.index + matchText.length;
    });

    if (lastIndex < value.length) {
      parts.push(<span key="trait-text-end">{value.slice(lastIndex)}</span>);
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
      <nav>
        <Link to="/">Home</Link>
        <Link to="/decklists">Decklists</Link>
        <Link to="/cardinformation">Card Information</Link>
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
              <h2 className="card-item-title">
                {hasValue(card.title)
                  ? renderTitleText(card.title)
                  : card.card_name || "Unknown Card"}
              </h2>

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
