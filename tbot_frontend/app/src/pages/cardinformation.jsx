import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";

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

const CLASS_NAMES = {
  guardian: "Guardian",
  kabloom: "Kabloom",
  megagrow: "Mega-Grow",
  smarty: "Smarty",
  solar: "Solar",
  beastly: "Beastly",
  brainy: "Brainy",
  crazy: "Crazy",
  hearty: "Hearty",
  sneaky: "Sneaky",
};

const RARITIES = [
  "Common",
  "Uncommon",
  "Super-Rare",
  "Premium",
  "Legendary",
  "Event",
];

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeDisplayText = (value) => String(value || "").trim();

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

function getEmojiIcon(emoji) {
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
}

function renderTitleText(title) {
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

  return <span className="card-title-content">{parts}</span>;
}

function renderStatsText(stats) {
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
    } else {
      const emojiName = fullEmoji.replace(/^<:([^:>]+):\d+>$/, "$1");

      parts.push(<span key={`stats-unknown-${index}`}>{emojiName}</span>);
    }

    lastIndex = matchIndex + fullEmoji.length;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="stats-end">{text.slice(lastIndex)}</span>);
  }

  return parts;
}

/*
 * Converts:
 *
 * __Deadly__
 * __Freeze__
 *
 * into actual underlined HTML.
 *
 * Discord custom emojis are still converted into images.
 */
function renderTraitText(text) {
  if (!text) {
    return null;
  }

  const value = String(text);

  const pattern = /(<:[^:>]+:\d+>)|(__[\s\S]*?__)/gi;

  const matches = [...value.matchAll(pattern)];

  if (matches.length === 0) {
    return <span>{value}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const fullMatch = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(
        <span key={`trait-text-${index}`}>
          {value.slice(lastIndex, matchIndex)}
        </span>,
      );
    }

    if (match[1]) {
      const icon = getEmojiIcon(match[1]);

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
        const emojiName = match[1].replace(/^<:([^:>]+):\d+>$/, "$1");

        parts.push(<span key={`trait-unknown-${index}`}>{emojiName}</span>);
      }
    } else if (match[2]) {
      const traitName = match[2].slice(2, -2);

      parts.push(
        <span key={`trait-underline-${index}`} className="trait-name">
          {traitName}
        </span>,
      );
    }

    lastIndex = matchIndex + fullMatch.length;
  });

  if (lastIndex < value.length) {
    parts.push(<span key="trait-text-end">{value.slice(lastIndex)}</span>);
  }

  return <span className="trait-rendered">{parts}</span>;
}

/*
 * Stats can be stored as something such as:
 *
 * <:brainz:123> 3
 * <:strength:123> 4
 * <:health:123> 4
 *
 * This extracts the numeric values for filtering.
 *
 * It also supports ordinary numeric text such as:
 * "3/4"
 * "Cost 3, Attack 4, Health 4"
 */
function parseCardStats(card) {
  const statsText = String(card.stats || "");

  const numbers = [...statsText.matchAll(/\d+/g)].map((match) =>
    Number(match[0]),
  );

  let cost = null;
  let attack = null;
  let health = null;

  /*
   * Prefer explicit database fields if they exist.
   */
  if (hasValue(card.cost)) {
    cost = Number(card.cost);
  }

  if (hasValue(card.attack)) {
    attack = Number(card.attack);
  }

  if (hasValue(card.strength)) {
    attack = Number(card.strength);
  }

  if (hasValue(card.health)) {
    health = Number(card.health);
  }

  /*
   * If explicit fields aren't available, infer from stats.
   *
   * Normal PvZ Heroes stat formatting is:
   * cost / attack / health
   */
  if (cost === null && numbers.length >= 1) {
    cost = numbers[0];
  }

  if (attack === null && numbers.length >= 2) {
    attack = numbers[1];
  }

  if (health === null && numbers.length >= 3) {
    health = numbers[2];
  }

  return {
    cost: Number.isFinite(cost) ? cost : null,
    attack: Number.isFinite(attack) ? attack : null,
    health: Number.isFinite(health) ? health : null,
  };
}

/*
 * Extract information from the traits field.
 *
 * Example:
 *
 * "Premium - Legendary __Deadly__ <:deadly:123>"
 *
 * becomes:
 *
 * set: Premium
 * rarity: Legendary
 * traits: Deadly
 */
function parseTraitsField(traits) {
  const value = String(traits || "").trim();

  if (!value) {
    return {
      set: "",
      rarity: "",
      traitNames: [],
    };
  }

  let set = "";
  let rarity = "";

  /*
   * Everything before the first "-" is the set.
   *
   * Example:
   * Premium - Legendary __Deadly__
   */
  const dashMatch = value.match(/^\s*([^-]+?)\s*-\s*(.*)$/);

  let remainingTraits = value;

  if (dashMatch) {
    set = dashMatch[1].trim();
    remainingTraits = dashMatch[2].trim();

    const rarityMatch = RARITIES.find((possibleRarity) =>
      normalizeText(remainingTraits).startsWith(normalizeText(possibleRarity)),
    );

    if (rarityMatch) {
      rarity = rarityMatch;
      remainingTraits = remainingTraits.slice(rarityMatch.length).trim();
    }
  }

  /*
   * Extract __Trait__ values.
   */
  const traitNames = [...remainingTraits.matchAll(/__([^_]+?)__/g)].map(
    (match) => match[1].trim(),
  );

  /*
   * Also allow trait text without __ if the database contains
   * comma-separated values.
   */
  if (traitNames.length === 0 && remainingTraits) {
    const cleaned = remainingTraits
      .replace(/<:[^:>]+:\d+>/g, "")
      .replace(/[|;,]+/g, ",")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    traitNames.push(...cleaned);
  }

  return {
    set,
    rarity,
    traitNames,
  };
}

function getCardClasses(card) {
  const possibleValues = [
    card.class,
    card.classes,
    card.card_class,
    card.card_classes,
    card.cardtype,
  ];

  const value = possibleValues.find(hasValue);

  if (!value) {
    return [];
  }

  return String(value)
    .split(/[|,;/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getClassDisplayName(value) {
  const normalized = normalizeText(value).replace(/[-_\s]/g, "");

  return CLASS_NAMES[normalized] || normalizeDisplayText(value);
}

function getClassIcon(value) {
  const normalized = normalizeText(value).replace(/[-_\s]/g, "");

  return CLASS_ICON_LINKS[normalized] || null;
}

function getCardSearchText(card) {
  const parsedTraits = parseTraitsField(card.traits);
  const classes = getCardClasses(card);

  return [
    card.card_name,
    card.title,
    card.card_type,
    card.traits,
    parsedTraits.set,
    parsedTraits.rarity,
    ...parsedTraits.traitNames,
    ...classes,
  ]
    .filter(hasValue)
    .join(" ")
    .toLowerCase();
}

function CardInformation() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(null);
  const [costFilter, setCostFilter] = useState(null);
  const [attackFilter, setAttackFilter] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [traitFilter, setTraitFilter] = useState(null);
  const [setFilter, setSetFilter] = useState(null);
  const [rarityFilter, setRarityFilter] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "#202020",
      borderColor: state.isFocused ? "#8fe38b" : "#444",
      minHeight: "45px",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#8fe38b",
      },
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: "#202020",
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#333" : "#202020",
      color: "white",
      cursor: "pointer",
    }),

    singleValue: (base) => ({
      ...base,
      color: "white",
    }),

    placeholder: (base) => ({
      ...base,
      color: "#888",
    }),

    input: (base) => ({
      ...base,
      color: "white",
    }),
  };

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

  const classOptions = useMemo(() => {
    const classes = new Map();

    cards.forEach((card) => {
      getCardClasses(card).forEach((className) => {
        const key = normalizeText(className);

        if (!classes.has(key)) {
          classes.set(key, {
            value: className,
            label: getClassDisplayName(className),
          });
        }
      });
    });

    return [...classes.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [cards]);

  const costOptions = useMemo(() => {
    const values = new Set();

    cards.forEach((card) => {
      const { cost } = parseCardStats(card);

      if (cost !== null) {
        values.add(cost);
      }
    });

    return [...values]
      .sort((a, b) => a - b)
      .map((value) => ({
        value,
        label: String(value),
      }));
  }, [cards]);

  const attackOptions = useMemo(() => {
    const values = new Set();

    cards.forEach((card) => {
      const { attack } = parseCardStats(card);

      if (attack !== null) {
        values.add(attack);
      }
    });

    return [...values]
      .sort((a, b) => a - b)
      .map((value) => ({
        value,
        label: String(value),
      }));
  }, [cards]);

  const healthOptions = useMemo(() => {
    const values = new Set();

    cards.forEach((card) => {
      const { health } = parseCardStats(card);

      if (health !== null) {
        values.add(health);
      }
    });

    return [...values]
      .sort((a, b) => a - b)
      .map((value) => ({
        value,
        label: String(value),
      }));
  }, [cards]);

  const traitOptions = useMemo(() => {
    const traits = new Map();

    cards.forEach((card) => {
      const parsed = parseTraitsField(card.traits);

      parsed.traitNames.forEach((trait) => {
        const key = normalizeText(trait);

        if (!traits.has(key)) {
          traits.set(key, {
            value: trait,
            label: trait,
          });
        }
      });
    });

    return [...traits.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [cards]);

  const setOptions = useMemo(() => {
    const sets = new Map();

    cards.forEach((card) => {
      const parsed = parseTraitsField(card.traits);

      if (parsed.set) {
        const key = normalizeText(parsed.set);

        if (!sets.has(key)) {
          sets.set(key, {
            value: parsed.set,
            label: parsed.set,
          });
        }
      }
    });

    return [...sets.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [cards]);

  const rarityOptions = useMemo(() => {
    const rarities = new Map();

    cards.forEach((card) => {
      const parsed = parseTraitsField(card.traits);

      if (parsed.rarity) {
        const key = normalizeText(parsed.rarity);

        if (!rarities.has(key)) {
          rarities.set(key, {
            value: parsed.rarity,
            label: parsed.rarity,
          });
        }
      }
    });

    return [...rarities.values()].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [cards]);

  const filteredCards = useMemo(() => {
    const searchValue = normalizeText(search);

    return cards.filter((card) => {
      const parsedTraits = parseTraitsField(card.traits);
      const stats = parseCardStats(card);
      const classes = getCardClasses(card);

      const searchMatch =
        !searchValue || getCardSearchText(card).includes(searchValue);

      const classMatch =
        !classFilter ||
        classes.some(
          (className) =>
            normalizeText(className) === normalizeText(classFilter.value),
        );

      const costMatch = !costFilter || stats.cost === Number(costFilter.value);

      const attackMatch =
        !attackFilter || stats.attack === Number(attackFilter.value);

      const healthMatch =
        !healthFilter || stats.health === Number(healthFilter.value);

      const traitMatch =
        !traitFilter ||
        parsedTraits.traitNames.some(
          (trait) => normalizeText(trait) === normalizeText(traitFilter.value),
        );

      const setMatch =
        !setFilter ||
        normalizeText(parsedTraits.set) === normalizeText(setFilter.value);

      const rarityMatch =
        !rarityFilter ||
        normalizeText(parsedTraits.rarity) ===
          normalizeText(rarityFilter.value);

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
    cards,
    search,
    classFilter,
    costFilter,
    attackFilter,
    healthFilter,
    traitFilter,
    setFilter,
    rarityFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setClassFilter(null);
    setCostFilter(null);
    setAttackFilter(null);
    setHealthFilter(null);
    setTraitFilter(null);
    setSetFilter(null);
    setRarityFilter(null);
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

      <div className="card-browser">
        <div className="search-container">
          <input
            className="search"
            placeholder="Search cards, classes, traits, sets, rarities..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filters">
          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Class"
              options={classOptions}
              value={classFilter}
              onChange={setClassFilter}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Cost"
              options={costOptions}
              value={costFilter}
              onChange={setCostFilter}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Attack"
              options={attackOptions}
              value={attackFilter}
              onChange={setAttackFilter}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Health"
              options={healthOptions}
              value={healthFilter}
              onChange={setHealthFilter}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Trait"
              options={traitOptions}
              value={traitFilter}
              onChange={setTraitFilter}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Set"
              options={setOptions}
              value={setFilter}
              onChange={setSetFilter}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Rarity"
              options={rarityOptions}
              value={rarityFilter}
              onChange={setRarityFilter}
              isClearable
            />
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!error && (
        <p className="results-count">Showing {filteredCards.length} cards</p>
      )}

      {!error && filteredCards.length === 0 ? (
        <p className="no-results">No cards found.</p>
      ) : (
        !error && (
          <div className="card-grid">
            {filteredCards.map((card) => {
              const parsedTraits = parseTraitsField(card.traits);

              const classes = getCardClasses(card);

              return (
                <div className="card-item" key={card.cardid}>
                  <div className="card-item-media">
                    <img src={card.thumbnail} alt={card.card_name || "Card"} />
                  </div>

                  <div className="card-item-info">
                    <h2 className="card-item-title">
                      {hasValue(card.title)
                        ? renderTitleText(card.title)
                        : card.card_name || "Unknown Card"}
                    </h2>

                    {classes.length > 0 && (
                      <p className="card-classes-line">
                        <span className="card-field-label">Class:</span>

                        <span className="card-classes-value">
                          {classes.map((className, index) => {
                            const icon = getClassIcon(className);

                            return (
                              <span
                                className="card-class-item"
                                key={`${className}-${index}`}
                              >
                                {icon && (
                                  <img
                                    src={icon}
                                    alt={getClassDisplayName(className)}
                                    className="card-class-icon"
                                  />
                                )}

                                <span>{getClassDisplayName(className)}</span>
                              </span>
                            );
                          })}
                        </span>
                      </p>
                    )}

                    {hasValue(card.card_type) && (
                      <p>
                        <span className="card-field-label">Type:</span>{" "}
                        {card.card_type}
                      </p>
                    )}

                    {hasValue(card.traits) && (
                      <p className="card-traits-line">
                        <span className="card-field-label">Traits:</span>

                        <span className="card-traits-value">
                          {parsedTraits.set && (
                            <span className="card-set">{parsedTraits.set}</span>
                          )}

                          {parsedTraits.set && parsedTraits.rarity && (
                            <span className="trait-separator">{" - "}</span>
                          )}

                          {parsedTraits.rarity && (
                            <span className="card-rarity">
                              {parsedTraits.rarity}
                            </span>
                          )}

                          {(parsedTraits.set || parsedTraits.rarity) &&
                            parsedTraits.traitNames.length > 0 && (
                              <span className="trait-separator"> </span>
                            )}

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

                    <button type="button" onClick={() => setSelectedCard(card)}>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {selectedCard !== null && (
        <CardModal card={selectedCard} close={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default CardInformation;
