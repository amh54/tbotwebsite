import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import CardModal from "../components/cardmodal";
import "../css/cardinformation.css";
import "../css/navbar.css";

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
  splashdamage: "",
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

const ABILITY_KEYWORDS = [
  "Bonus Attack",
  "Bounce",
  "Can't Be Hurt",
  "Damage",
  "Destroy",
  "Conjure",
  "Dino-Roar",
  "Draw",
  "Evolution",
  "Freeze",
  "Fusion",
  "Gain",
  "Heal",
  "Make",
  "Move",
  "Random",
  "Shuffle",
  "Transform",
  "Strikethrough",
  "Deadly",
];

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const removeDiscordEmojis = (value) =>
  String(value ?? "").replace(/<a?:[^:>]+:\d+>/gi, "");

const replaceDiscordEmojisWithNames = (value) =>
  String(value ?? "").replace(
    /<a?:([^:>]+):\d+>/gi,
    (_, emojiName) => ` ${emojiName} `,
  );

const cleanTraitValue = (value) =>
  removeDiscordEmojis(value)
    .replace(/\*\*/g, "")
    .replace(/\_\_/g, "")
    .replace(/\~\~/g, "")
    .replace(/\`/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+\d+$/, "")
    .trim();

const normalizeClassName = (className) => {
  const value = removeDiscordEmojis(className)
    .replace(/[\_\~\`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = normalizeText(value);

  const canonicalClasses = {
    guardian: "Guardian",
    kabloom: "Kabloom",
    megagrow: "Mega-Grow",
    "mega-grow": "Mega-Grow",
    smarty: "Smarty",
    solar: "Solar",
    beastly: "Beastly",
    brainy: "Brainy",
    crazy: "Crazy",
    hearty: "Hearty",
    sneaky: "Sneaky",
  };

  return canonicalClasses[normalized] || value;
};

const getClassNames = (classes) => {
  if (!classes) {
    return [];
  }

  return [
    ...new Set(
      String(classes)
        .split(/[,|;]/)
        .map((className) => normalizeClassName(className))
        .filter(Boolean),
    ),
  ];
};

const normalizeTraitName = (trait) => cleanTraitValue(trait);

const getTraitNames = (traits) => {
  if (!traits) {
    return [];
  }

  const rawTraits = String(traits)
    .split(/[,|;]/)
    .map((trait) => normalizeTraitName(trait))
    .filter(Boolean);

  const uniqueTraits = [];
  const seen = new Set();

  rawTraits.forEach((trait) => {
    const key = normalizeText(trait);

    if (!seen.has(key)) {
      seen.add(key);
      uniqueTraits.push(trait);
    }
  });

  return uniqueTraits;
};

const simplifyForMatch = (value) =>
  normalizeText(value).replace(/['\u2019]/g, "");

const keywordMatchesText = (keyword, text) => {
  const normalized = simplifyForMatch(text);

  if (keyword === "Freeze") {
    return /\bfrozen?\b|\bfreezes\b|\bfreezing\b|\bfreeze\b/.test(normalized);
  }

  const escaped = simplifyForMatch(keyword).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  return new RegExp(`\\b${escaped}\\b`, "i").test(normalized);
};

const getAbilityKeywords = (ability, description = "") => {
  const abilityText = replaceDiscordEmojisWithNames(
    `${ability || ""} ${description || ""}`,
  );

  return ABILITY_KEYWORDS.filter((keyword) =>
    keywordMatchesText(keyword, abilityText),
  );
};

const getCardKeywords = (card) => {
  const traitNames = getTraitNames(card.traits);
  const abilityKeywords = getAbilityKeywords(card.ability, card.description);

  const combined = [];
  const seen = new Set();

  [...traitNames, ...abilityKeywords].forEach((keyword) => {
    const key = normalizeText(keyword);

    if (!seen.has(key)) {
      seen.add(key);
      combined.push(keyword);
    }
  });

  return combined;
};

const TRIBE_LINE_PATTERN =
  /\b([A-Za-z][A-Za-z'\-]*)\s+(Plants?|Zombies?|Tricks?|Environments?|Heroes?)\b/gi;

const toTitleCase = (value) =>
  value.toLowerCase().replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());

const extractTribes = (description, side = "", cardType = "") => {
  if (!description && !side && !cardType) {
    return [];
  }

  const cleaned = removeDiscordEmojis(description)
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();

  const tribes = [];
  const seen = new Set();

  const addTribe = (value) => {
    const clean = toTitleCase(String(value).trim());

    if (!clean) {
      return;
    }

    const key = normalizeText(clean);

    if (!seen.has(key)) {
      seen.add(key);
      tribes.push(clean);
    }
  };

  const knownTribes = [
    "Animal",
    "Fruit",
    "Bean",
    "Berry",
    "Cactus",
    "Corn",
    "Dragon",
    "Flower",
    "Flytrap",
    "Leafy",
    "Mime",
    "Moss",
    "Mushroom",
    "Nut",
    "Pea",
    "Pinecone",
    "Root",
    "Seed",
    "Squash",
    "Tree",
    "Barrel",
    "Dancing",
    "Gargantuar",
    "Gourmet",
    "History",
    "Imp",
    "Monster",
    "Mustache",
    "Party",
    "Pet",
    "Pirate",
    "Professional",
    "Science",
    "Sports",
    "Plant",
    "Hero",
    "Trick",
    "Zombie",
    "Environment",
    "Superpower",
  ];

  let match;

  while ((match = TRIBE_LINE_PATTERN.exec(cleaned)) !== null) {
    const tribe = match[1];

    const knownTribe = knownTribes.find(
      (known) => normalizeText(known) === normalizeText(tribe),
    );

    if (knownTribe) {
      addTribe(knownTribe);
    }
  }

  const words = cleaned.toLowerCase().split(/\s+/);

  knownTribes.forEach((tribe) => {
    if (words.includes(tribe.toLowerCase())) {
      addTribe(tribe);
    }
  });
  const normalizedSide = normalizeText(side);

  if (normalizedSide === "plants" || normalizedSide === "plant") {
    addTribe("Plant");
  }

  if (normalizedSide === "zombies" || normalizedSide === "zombie") {
    addTribe("Zombie");
  }

  const normalizedType = normalizeText(cardType);

  if (/\btrick\b/.test(normalizedType)) {
    addTribe("Trick");
  }

  if (/\benvironment\b/.test(normalizedType)) {
    addTribe("Environment");
  }
  if (/\bsuperpower\b/.test(normalizedType)) {
    addTribe("Superpower");
  }

  return tribes;
};

const getSetName = (setRarity) => {
  if (!setRarity) {
    return "";
  }

  const value = String(setRarity).trim();
  const separatorIndex = value.lastIndexOf(" - ");

  if (separatorIndex === -1) {
    return "";
  }

  return value.slice(0, separatorIndex).trim();
};

const getRarityName = (setRarity) => {
  if (!setRarity) {
    return "";
  }

  const value = String(setRarity).trim();
  const separatorIndex = value.lastIndexOf(" - ");

  if (separatorIndex === -1) {
    const normalized = normalizeText(value);

    const knownRarities = new Set([
      "common",
      "uncommon",
      "rare",
      "super-rare",
      "legendary",
      "event",
      "token",
      "hero",
    ]);

    return knownRarities.has(normalized) ? value : "";
  }

  return value.slice(separatorIndex + 3).trim();
};

const getCardStats = (stats) => {
  const cleanStats = removeDiscordEmojis(stats).replace(/\s+/g, " ").trim();

  const numbers = cleanStats.match(/\d+/g) || [];

  return {
    cost: numbers[0] !== undefined ? Number(numbers[0]) : null,
    attack: numbers[1] !== undefined ? Number(numbers[1]) : null,
    health: numbers[2] !== undefined ? Number(numbers[2]) : null,
  };
};

const isHeroCard = (card) => {
  const rarity = normalizeText(getRarityName(card?.set_rarity));

  return rarity === "hero";
};
const isSuperpowerCard = (card) => {
  const text = normalizeText(
    `${card?.description || ""} ${card?.ability || ""} ${card?.card_type || ""}`,
  );

  return text.includes("superpower trick") || text.includes("superpower");
};

function CardInformation() {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const [side, setSide] = useState("Plants");
  const [search, setSearch] = useState("");

  const [classFilter, setClassFilter] = useState(null);
  const [costFilter, setCostFilter] = useState(null);
  const [attackFilter, setAttackFilter] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [keywordFilter, setKeywordFilter] = useState([]);
  const [tribeFilter, setTribeFilter] = useState([]);
  const [setFilter, setSetFilter] = useState(null);
  const [rarityFilter, setRarityFilter] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getEmojiIcon = (emoji) => {
    const match = String(emoji || "").match(/^<:([^:>]+):\d+>$/);

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
      splashdamage: {
        url: TRAIT_ICON_LINKS.splashdamage,
        alt: "Splash Damage",
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

      if (icon?.url) {
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

      if (icon?.url) {
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

  const renderTraitText = (text) => {
    if (!text) {
      return null;
    }

    const rawText = String(text);
    const pattern = /(<:[^:>]+:\d+>)/gi;
    const matches = [...rawText.matchAll(pattern)];

    if (matches.length === 0) {
      const traitNames = getTraitNames(rawText);

      return (
        <span className="trait-rendered">
          {traitNames.map((trait, index) => (
            <span key={`${trait}-${index}`} className="trait-rendered-item">
              <u>{trait}</u>
              {index < traitNames.length - 1 && ", "}
            </span>
          ))}
        </span>
      );
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullEmoji = match[1];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const textBeforeIcon = rawText
          .slice(lastIndex, matchIndex)
          .replace(/\*\*/g, "")
          .replace(/__/g, "")
          .trim();

        if (textBeforeIcon) {
          parts.push(
            <span key={`trait-text-${index}`}>
              <u>{textBeforeIcon}</u>
            </span>,
          );
        }
      }

      const icon = getEmojiIcon(fullEmoji);

      if (icon?.url) {
        parts.push(
          <img
            key={`trait-icon-${index}`}
            src={icon.url}
            alt={icon.alt}
            className="card-trait-icon"
          />,
        );
      }

      lastIndex = matchIndex + fullEmoji.length;
    });

    if (lastIndex < rawText.length) {
      const remainingText = rawText
        .slice(lastIndex)
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .trim();

      if (remainingText) {
        parts.push(
          <span key="trait-end">
            <u>{remainingText}</u>
          </span>,
        );
      }
    }

    return <span className="trait-rendered">{parts}</span>;
  };

  const renderAbilityText = (text, maxLength = 177) => {
    if (!text) {
      return null;
    }

    let value = String(text);

    if (value.length > maxLength) {
      let cut = value.slice(0, maxLength);

      const lastEmojiStart = cut.lastIndexOf("<:");
      const lastEmojiEnd = cut.lastIndexOf(">");

      if (lastEmojiStart > lastEmojiEnd) {
        cut = cut.slice(0, lastEmojiStart);
      }

      value = `${cut.trimEnd()}…`;
    }

    const pattern =
      /(<:[^:>]+:\d+>)|(\*\*__[\s\S]*?__\*\*)|(__\*\*[\s\S]*?\*\*__)|(\*\*[\s\S]*?\*\*)|(__[\s\S]*?__)/gi;

    const matches = [...value.matchAll(pattern)];

    if (matches.length === 0) {
      return (
        <span>
          {value.replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
        </span>
      );
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const normalText = value.slice(lastIndex, matchIndex);

        parts.push(
          <span key={`ability-text-${index}`}>
            {normalText.replace(
              /<:([^:>]+):\d+>/gi,
              (_, emojiName) => emojiName,
            )}
          </span>,
        );
      }

      if (match[1]) {
        const icon = getEmojiIcon(match[1]);

        if (icon?.url) {
          parts.push(
            <img
              key={`ability-icon-${index}`}
              src={icon.url}
              alt={icon.alt}
              className="card-ability-icon"
            />,
          );
        } else {
          const emojiName = match[1].replace(/^<:([^:>]+):\d+>$/, "$1");

          parts.push(<span key={`ability-unknown-${index}`}>{emojiName}</span>);
        }
      } else if (match[2]) {
        parts.push(
          <strong key={`bold-underline-${index}`}>
            <u>{match[2].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[3]) {
        parts.push(
          <strong key={`underline-bold-${index}`}>
            <u>{match[3].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[4]) {
        parts.push(
          <strong key={`bold-${index}`}>{match[4].slice(2, -2)}</strong>,
        );
      } else if (match[5]) {
        parts.push(<u key={`underline-${index}`}>{match[5].slice(2, -2)}</u>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < value.length) {
      parts.push(
        <span key="ability-text-end">
          {value
            .slice(lastIndex)
            .replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
        </span>,
      );
    }

    return <span>{parts}</span>;
  };

  const getCardGroup = (card) => {
    if (!hasValue(card.description)) {
      return 0;
    }

    const description = normalizeText(card.description);

    if (description.includes("superpower trick")) {
      return 1;
    }

    return 2;
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
          if (responseText.trim().startsWith("<")) {
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

  const normalCards = useMemo(() => {
    return cards.filter((card) => {
      if (normalizeText(card.side) !== normalizeText(side)) {
        return false;
      }

      return !isHeroCard(card);
    });
  }, [cards, side]);

  const filterData = useMemo(() => {
    const classes = new Set();
    const costs = new Set();
    const attacks = new Set();
    const healths = new Set();
    const keywords = new Map();
    const tribes = new Map();
    const sets = new Set();
    const rarities = new Set();

    normalCards.forEach((card) => {
      getClassNames(card.card_type).forEach((className) => {
        classes.add(className);
      });

      const stats = getCardStats(card.stats);

      if (stats.cost !== null) {
        costs.add(stats.cost);
      }

      if (stats.attack !== null) {
        attacks.add(stats.attack);
      }

      if (stats.health !== null) {
        healths.add(stats.health);
      }

      getCardKeywords(card).forEach((keyword) => {
        const key = normalizeText(keyword);

        if (!keywords.has(key)) {
          keywords.set(key, keyword);
        }
      });

      extractTribes(card.description, card.side, card.card_type).forEach(
        (tribe) => {
          const key = normalizeText(tribe);

          if (!tribes.has(key)) {
            tribes.set(key, tribe);
          }
        },
      );

      const rarityName = getRarityName(card.set_rarity);
      const setName = getSetName(card.set_rarity);

      if (setName) {
        sets.add(setName);
      }

      if (rarityName && normalizeText(rarityName) !== "hero") {
        rarities.add(rarityName);
      }
    });

    const sortedTribes = [...tribes.values()].sort((a, b) => {
      const categoryOrder = {
        plant: 1000,
        zombie: 1001,
        trick: 1002,
        environment: 1003,
        hero: 1004,
      };

      const aOrder = categoryOrder[normalizeText(a)] ?? 0;
      const bOrder = categoryOrder[normalizeText(b)] ?? 0;

      if (aOrder !== bOrder) {
        if (aOrder === 0) return -1;
        if (bOrder === 0) return 1;

        return aOrder - bOrder;
      }

      return a.localeCompare(b);
    });

    return {
      classes: [...classes].sort((a, b) => a.localeCompare(b)),

      costs: [...costs].sort((a, b) => a - b),

      attacks: [...attacks].sort((a, b) => a - b),

      healths: [...healths].sort((a, b) => a - b),

      keywords: [...keywords.values()].sort((a, b) => a.localeCompare(b)),

      tribes: sortedTribes,

      sets: [...sets].sort((a, b) => a.localeCompare(b)),

      rarities: [...rarities].sort((a, b) => a.localeCompare(b)),
    };
  }, [normalCards]);

  const classOptions = filterData.classes.map((value) => ({
    value,
    label: value,
  }));

  const costOptions = filterData.costs.map((value) => ({
    value,
    label: `Cost: ${value}`,
  }));

  const attackOptions = filterData.attacks.map((value) => ({
    value,
    label: `Attack: ${value}`,
  }));

  const healthOptions = filterData.healths.map((value) => ({
    value,
    label: `Health: ${value}`,
  }));

  const keywordOptions = filterData.keywords.map((value) => ({
    value,
    label: value,
  }));

  const tribeOptions = filterData.tribes.map((value) => ({
    value,
    label: value,
  }));

  const setOptions = filterData.sets.map((value) => ({
    value,
    label: value,
  }));

  const rarityOptions = filterData.rarities.map((value) => ({
    value,
    label: value,
  }));

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

    multiValue: (base) => ({
      ...base,
      backgroundColor: "#333",
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: "white",
    }),

    multiValueRemove: (base) => ({
      ...base,
      color: "#aaa",
      ":hover": {
        backgroundColor: "#555",
        color: "white",
      },
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

  const filteredCards = useMemo(() => {
    const searchValue = normalizeText(search);

    const selectedKeywords = Array.isArray(keywordFilter) ? keywordFilter : [];

    const selectedTribes = Array.isArray(tribeFilter) ? tribeFilter : [];

    const result = normalCards.filter((card) => {
      const stats = getCardStats(card.stats);

      const cardClasses = getClassNames(card.card_type);

      const cardKeywords = getCardKeywords(card);

      const cardTribes = extractTribes(
        card.description,
        card.side,
        card.card_type,
      );

      const searchableText = [
        card.card_name,
        card.title,
        card.card_type,
        card.description,
        card.ability,
        card.traits,
        ...cardClasses,
        ...cardKeywords,
        ...cardTribes,
        getSetName(card.set_rarity),
        getRarityName(card.set_rarity),
        card.aliases,
      ]
        .filter(hasValue)
        .join(" ")
        .toLowerCase();

      const searchMatch = !searchValue || searchableText.includes(searchValue);

      const classMatch =
        !classFilter ||
        cardClasses.some(
          (className) =>
            normalizeText(className) === normalizeText(classFilter.value),
        );

      const costMatch = !costFilter || stats.cost === Number(costFilter.value);

      const attackMatch =
        !attackFilter || stats.attack === Number(attackFilter.value);

      const healthMatch =
        !healthFilter || stats.health === Number(healthFilter.value);

      const keywordMatch =
        selectedKeywords.length === 0 ||
        selectedKeywords.every((selectedKeyword) =>
          cardKeywords.some(
            (keyword) =>
              normalizeText(keyword) === normalizeText(selectedKeyword.value),
          ),
        );

      const tribeMatch =
        selectedTribes.length === 0 ||
        selectedTribes.every((selectedTribe) =>
          cardTribes.some(
            (tribe) =>
              normalizeText(tribe) === normalizeText(selectedTribe.value),
          ),
        );

      const setMatch =
        !setFilter ||
        normalizeText(getSetName(card.set_rarity)) ===
          normalizeText(setFilter.value);

      const rarityMatch =
        !rarityFilter ||
        normalizeText(getRarityName(card.set_rarity)) ===
          normalizeText(rarityFilter.value);

      return (
        searchMatch &&
        classMatch &&
        costMatch &&
        attackMatch &&
        healthMatch &&
        keywordMatch &&
        tribeMatch &&
        setMatch &&
        rarityMatch
      );
    });

    return result.sort((a, b) => {
      const groupDifference = getCardGroup(a) - getCardGroup(b);

      if (groupDifference !== 0) {
        return groupDifference;
      }

      const aStats = getCardStats(a.stats);
      const bStats = getCardStats(b.stats);

      const aCost = aStats.cost ?? Infinity;
      const bCost = bStats.cost ?? Infinity;

      if (aCost !== bCost) {
        return aCost - bCost;
      }

      return String(a.card_name || "").localeCompare(
        String(b.card_name || ""),
        undefined,
        {
          sensitivity: "base",
        },
      );
    });
  }, [
    normalCards,
    search,
    classFilter,
    costFilter,
    attackFilter,
    healthFilter,
    keywordFilter,
    tribeFilter,
    setFilter,
    rarityFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setClassFilter(null);
    setCostFilter(null);
    setAttackFilter(null);
    setHealthFilter(null);
    setKeywordFilter([]);
    setTribeFilter([]);
    setSetFilter(null);
    setRarityFilter(null);
  };

  const changeSide = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  if (loading) {
    return (
      <div className="card-information-page">
        <nav className="navbar">
          <div className="logo">
            <Link to="/">Tbot</Link>
          </div>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/decklists">Decklists</Link>
            <Link to="/cardinformation">Card Information</Link>
            <Link to="/heroinformation">Hero Information</Link>
            <Link to="/keeporscrap">Keep or Scrap</Link>
          </div>
        </nav>

        <p>Loading Cards...</p>
      </div>
    );
  }

  return (
    <div className="card-information-page">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Tbot</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/decklists">Decklists</Link>
          <Link to="/cardinformation">Card Information</Link>
          <Link to="/heroinformation">Hero information</Link>
          <Link to="/keeporscrap">Keep or Scrap</Link>
        </div>
      </nav>

      <h1>Card Information</h1>

      <div className="card-browser">
        <div className="card-side-tabs">
          <button
            type="button"
            className={side === "Plants" ? "active" : ""}
            onClick={() => changeSide("Plants")}
          >
            Plants
          </button>

          <button
            type="button"
            className={side === "Zombie" ? "active" : ""}
            onClick={() => changeSide("Zombie")}
          >
            Zombies
          </button>
        </div>

        <div className="card-search-container">
          <input
            className="card-search"
            placeholder="Search cards, abilities, traits, aliases..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="card-filters">
          <div className="card-select-wrapper">
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

          <div className="card-select-wrapper">
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

          <div className="card-select-wrapper">
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

          <div className="card-select-wrapper">
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

          <div className="card-select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Keywords"
              options={keywordOptions}
              value={keywordFilter}
              onChange={setKeywordFilter}
              isMulti
              closeMenuOnSelect={false}
            />
          </div>

          <div className="card-select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Tribe"
              options={tribeOptions}
              value={tribeFilter}
              onChange={setTribeFilter}
              isMulti
              closeMenuOnSelect={false}
            />
          </div>

          <div className="card-select-wrapper">
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

          <div className="card-select-wrapper">
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
            className="clear-card-filter-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!error && (
        <p className="card-results-count">
          Showing {filteredCards.length} {side} cards
        </p>
      )}

      {!error && filteredCards.length === 0 ? (
        <p className="no-card-results">No {side} cards found.</p>
      ) : (
        !error && (
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
                      <span>Class:</span> {card.card_type}
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

                  {hasValue(card.set_rarity) && getSetName(card.set_rarity) && (
                    <p>
                      <span>Set:</span> {getSetName(card.set_rarity)}
                    </p>
                  )}

                  {hasValue(card.set_rarity) &&
                    getRarityName(card.set_rarity) && (
                      <p>
                        <span>Rarity:</span> {getRarityName(card.set_rarity)}
                      </p>
                    )}

                  {hasValue(card.ability) && (
                    <p className="card-description-line">
                      <span className="card-field-label">Ability:</span>{" "}
                      <span
                        style={{
                          whiteSpace: "pre-line",
                        }}
                      >
                        {renderAbilityText(card.ability)}
                      </span>
                    </p>
                  )}

                  <button type="button" onClick={() => setSelectedCard(card)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedCard && (
        <CardModal card={selectedCard} close={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default CardInformation;
