import { ABILITY_KEYWORDS } from "./iconLinks.js";
import {
  cleanTraitValue,
  normalizeText,
  removeDiscordEmojis,
  replaceDiscordEmojisWithNames,
  simplifyForMatch,
  toTitleCase,
} from "./textUtils.js";

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

export const getClassNames = (classes) => {
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

export const getTraitNames = (traits) => {
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

const keywordMatchesText = (keyword, text) => {
  const normalized = simplifyForMatch(text);

  if (keyword === "Dino-Roar") {
    return /dino[\s-]*roar/i.test(normalized);
  }

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

export const getCardKeywords = (card) => {
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

export const extractTribes = (description, side = "", cardType = "") => {
  const source = `${description || ""} ${side || ""} ${cardType || ""}`;

  if (!source.trim()) {
    return [];
  }

  const cleaned = removeDiscordEmojis(source)
    .replace(/\*\*/g, "")
    .replace(/\_\_/g, "")
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

  return tribes;
};

export const getCardTypes = (card) => {
  const types = [];

  const addType = (type) => {
    if (!types.includes(type)) {
      types.push(type);
    }
  };

  const descriptionValue = normalizeText(
    removeDiscordEmojis(card?.description || ""),
  );

  if (/\bplants?\b/.test(descriptionValue)) {
    addType("Plants");
  }

  if (/\bzombies?\b/.test(descriptionValue)) {
    addType("Zombies");
  }

  if (/\btrick\b|\btricks\b/.test(descriptionValue)) {
    addType("Tricks");
  }

  if (/\benvironment\b|\benvironments\b/.test(descriptionValue)) {
    addType("Environment");
  }

  return types;
};

export const getSetName = (setRarity) => {
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

export const getRarityName = (setRarity) => {
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

export const getCardStats = (stats) => {
  const cleanStats = removeDiscordEmojis(stats).replace(/\s+/g, " ").trim();

  const numbers = cleanStats.match(/\d+/g) || [];

  return {
    cost: numbers[0] !== undefined ? Number(numbers[0]) : null,
    attack: numbers[1] !== undefined ? Number(numbers[1]) : null,
    health: numbers[2] !== undefined ? Number(numbers[2]) : null,
  };
};

export const isHeroCard = (card) => {
  const rarity = normalizeText(getRarityName(card?.set_rarity));
  return rarity === "hero";
};