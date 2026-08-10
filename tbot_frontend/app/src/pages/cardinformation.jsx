import { useEffect, useMemo, useState } from "react";
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
  solar: "https://i.ibb.co/YFMMD4DZ/solar.webp",
  beastly: "https://i.ibb.co/xS6b10P5/beastly.webp",
  brainy: "https://i.ibb.co/d40zFh8r/Brainy.webp",
  crazy: "https://i.ibb.co/HTvzSsXX/crazy.webp",
  hearty: "https://i.ibb.co/ynKbzV8v/hearty.webp",
  sneaky: "https://i.ibb.co/nqFdR6HJ/Pv-ZH-Sneaky-Icon.png",
};

const CLASS_NAMES = [
  "Guardian",
  "Kabloom",
  "Mega-Grow",
  "Smarty",
  "Solar",
  "Beastly",
  "Brainy",
  "Crazy",
  "Hearty",
  "Sneaky",
];

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeClassName = (value) => {
  const normalized = normalizeText(value);

  const aliases = {
    "mega grow": "Mega-Grow",
    "mega-grow": "Mega-Grow",
    megagrow: "Mega-Grow",
    "anti hero": "Anti-Hero",
    antihero: "Anti-Hero",
    "double strike": "Double Strike",
    doublestrike: "Double Strike",
    "super rare": "Super-Rare",
    "super-rare": "Super-Rare",
  };

  return aliases[normalized] || String(value || "").trim();
};

/*
 * Gets class information from whichever class field
 * the API supplies.
 *
 * This supports:
 *   card.class
 *   card.classes
 *   card.card_class
 *   card.card_classes
 *
 * It also supports comma-separated or array values.
 */
const getCardClasses = (card) => {
  const rawValue =
    card.class ?? card.classes ?? card.card_class ?? card.card_classes ?? "";

  if (Array.isArray(rawValue)) {
    return rawValue
      .flatMap((value) => String(value).split(","))
      .map(normalizeClassName)
      .filter(Boolean);
  }

  return String(rawValue).split(",").map(normalizeClassName).filter(Boolean);
};

/*
 * The traits field has this structure:
 *
 * SET - RARITY - TRAIT(S)
 *
 * Examples:
 *
 * Premium - Common - Bullseye
 * Galactic - Legendary - Deadly
 * Basic - Uncommon
 *
 * The first section is SET.
 * The second section is RARITY.
 * Everything after that is TRAITS.
 */
const parseTraits = (value) => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return {
      set: "",
      rarity: "",
      traits: [],
    };
  }

  const sections = raw
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  const set = sections[0] || "";
  const rarity = sections[1] || "";

  const traitText = sections.slice(2).join(" - ");

  const traits = traitText
    .split(",")
    .map((trait) =>
      trait
        .replace(/<:[^:>]+:\d+>/g, "")
        .replace(/__/g, "")
        .trim(),
    )
    .filter(Boolean);

  return {
    set,
    rarity,
    traits,
  };
};

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
    }

    lastIndex = matchIndex + fullMatch.length;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="title-end">{text.slice(lastIndex)}</span>);
  }

  return <span className="card-title-content">{parts}</span>;
};

const renderStatsText = (stats) => {
  if (!stats) {
    return null;
  }

  const text = String(stats);
  const pattern = /(<:[^:>]+:\d+>)/gi;
  const matches = [...text.matchAll(pattern)];

  if (matches.length === 0) {
    return <span>{text}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const fullEmoji = match[1];
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
    }

    lastIndex = matchIndex + fullEmoji.length;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="stats-end">{text.slice(lastIndex)}</span>);
  }

  return parts;
};

const renderTraitNames = (traits) => {
  if (!traits || traits.length === 0) {
    return null;
  }

  return (
    <span className="trait-rendered">
      {traits.map((trait, index) => (
        <span className="trait-name" key={`${trait}-${index}`}>
          {trait}
        </span>
      ))}
    </span>
  );
};

function CardInformation() {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const [search, setSearch] = useState("");

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCost, setSelectedCost] = useState("");
  const [selectedHealth, setSelectedHealth] = useState("");
  const [selectedAttack, setSelectedAttack] = useState("");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");

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

        if (!contentType.includes("application/json")) {
          throw new Error(`Received a non-JSON response from ${endpoint}.`);
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

  const processedCards = useMemo(() => {
    return cards.map((card) => {
      const parsedTraits = parseTraits(card.traits);

      const classes = getCardClasses(card);

      const cost = Number(card.cost);
      const attack = Number(card.attack ?? card.strength);
      const health = Number(card.health);

      return {
        ...card,
        parsedSet: parsedTraits.set,
        parsedRarity: parsedTraits.rarity,
        parsedTraits: parsedTraits.traits,
        parsedClasses: classes,
        parsedCost: Number.isFinite(cost) ? cost : null,
        parsedAttack: Number.isFinite(attack) ? attack : null,
        parsedHealth: Number.isFinite(health) ? health : null,
      };
    });
  }, [cards]);

  const filterOptions = useMemo(() => {
    const classes = new Set();
    const costs = new Set();
    const attacks = new Set();
    const healths = new Set();
    const traits = new Set();
    const sets = new Set();
    const rarities = new Set();

    processedCards.forEach((card) => {
      card.parsedClasses.forEach((value) => classes.add(value));

      if (card.parsedCost !== null) {
        costs.add(card.parsedCost);
      }

      if (card.parsedAttack !== null) {
        attacks.add(card.parsedAttack);
      }

      if (card.parsedHealth !== null) {
        healths.add(card.parsedHealth);
      }

      card.parsedTraits.forEach((value) => traits.add(value));

      if (card.parsedSet) {
        sets.add(card.parsedSet);
      }

      if (card.parsedRarity) {
        rarities.add(card.parsedRarity);
      }
    });

    return {
      classes: [...classes].sort((a, b) => a.localeCompare(b)),

      costs: [...costs].sort((a, b) => a - b),

      attacks: [...attacks].sort((a, b) => a - b),

      healths: [...healths].sort((a, b) => a - b),

      traits: [...traits].sort((a, b) => a.localeCompare(b)),

      sets: [...sets].sort((a, b) => a.localeCompare(b)),

      rarities: [...rarities].sort((a, b) => a.localeCompare(b)),
    };
  }, [processedCards]);

  const filteredCards = useMemo(() => {
    const searchValue = normalizeText(search);

    return processedCards.filter((card) => {
      const searchableText = [
        card.card_name,
        card.title,
        card.card_type,
        card.parsedSet,
        card.parsedRarity,
        ...card.parsedClasses,
        ...card.parsedTraits,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatch = !searchValue || searchableText.includes(searchValue);

      const classMatch =
        !selectedClass ||
        card.parsedClasses.some(
          (value) => normalizeText(value) === normalizeText(selectedClass),
        );

      const costMatch =
        !selectedCost || card.parsedCost === Number(selectedCost);

      const attackMatch =
        !selectedAttack || card.parsedAttack === Number(selectedAttack);

      const healthMatch =
        !selectedHealth || card.parsedHealth === Number(selectedHealth);

      const traitMatch =
        !selectedTrait ||
        card.parsedTraits.some(
          (value) => normalizeText(value) === normalizeText(selectedTrait),
        );

      const setMatch =
        !selectedSet ||
        normalizeText(card.parsedSet) === normalizeText(selectedSet);

      const rarityMatch =
        !selectedRarity ||
        normalizeText(card.parsedRarity) === normalizeText(selectedRarity);

      return (
        searchMatch &&
        classMatch &&
        costMatch &&
        attackMatch &&
        healthMatch &&
        traitMatch &&
        setMatch &&
        rarityMatch
      );
    });
  }, [
    processedCards,
    search,
    selectedClass,
    selectedCost,
    selectedAttack,
    selectedHealth,
    selectedTrait,
    selectedSet,
    selectedRarity,
  ]);

  const clearFilters = () => {
    setSearch("");
    setSelectedClass("");
    setSelectedCost("");
    setSelectedAttack("");
    setSelectedHealth("");
    setSelectedTrait("");
    setSelectedSet("");
    setSelectedRarity("");
  };

  if (loading) {
    return (
      <div className="card-page">
        <p>Loading Cards...</p>
      </div>
    );
  }

  return (
    <div className="card-page">
      <nav className="navbar">
        <div className="nav-brand">Tbot</div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/decklists">Decklists</Link>
          <Link to="/cardinformation">Card Information</Link>
          <Link to="/heroes">Heroes</Link>
        </div>
      </nav>

      <h1>Card Information</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="card-browser">
        <div className="card-search-container">
          <input
            className="card-search"
            placeholder="Search cards, traits, classes, sets, rarity..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="card-filters">
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            <option value="">Class</option>

            {filterOptions.classes.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={selectedCost}
            onChange={(event) => setSelectedCost(event.target.value)}
          >
            <option value="">Cost</option>

            {filterOptions.costs.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={selectedAttack}
            onChange={(event) => setSelectedAttack(event.target.value)}
          >
            <option value="">Attack</option>

            {filterOptions.attacks.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={selectedHealth}
            onChange={(event) => setSelectedHealth(event.target.value)}
          >
            <option value="">Health</option>

            {filterOptions.healths.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={selectedTrait}
            onChange={(event) => setSelectedTrait(event.target.value)}
          >
            <option value="">Trait</option>

            {filterOptions.traits.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={selectedSet}
            onChange={(event) => setSelectedSet(event.target.value)}
          >
            <option value="">Set</option>

            {filterOptions.sets.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={selectedRarity}
            onChange={(event) => setSelectedRarity(event.target.value)}
          >
            <option value="">Rarity</option>

            {filterOptions.rarities.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="clear-card-filters"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      <p className="results-count">Showing {filteredCards.length} cards</p>

      {!error && filteredCards.length === 0 ? (
        <p className="no-results">No cards found.</p>
      ) : (
        <div className="card-grid">
          {filteredCards.map((card) => (
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
                      {renderTraitNames(card.parsedTraits)}
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
      )}

      {selectedCard !== null && (
        <CardModal card={selectedCard} close={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default CardInformation;
