export const MAX_QUANTITY = 4;

export const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const removeDiscordEmojis = (value) =>
  String(value ?? "").replace(/<a?:[^:>]+:\d+>/gi, "");

export const normalizeClassName = (className) => {
  const value = removeDiscordEmojis(className)
    .replace(/[\\_\\~\\`]/g, "")
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

export const getCardTypes = (card) => {
  const types = [];

  const addType = (type) => {
    if (!types.includes(type)) {
      types.push(type);
    }
  };

  const sideValue = normalizeText(
    card?.side || card?.faction || card?.team || "",
  );

  const descriptionValue = normalizeText(
    removeDiscordEmojis(card?.description || ""),
  );

  if (
    sideValue === "plant" ||
    sideValue === "plants" ||
    sideValue.includes("plant")
  ) {
    addType("Plants");
  }

  if (
    sideValue === "zombie" ||
    sideValue === "zombies" ||
    sideValue.includes("zombie")
  ) {
    addType("Zombies");
  }

  if (/\btrick\b|\btricks\b/.test(descriptionValue)) {
    addType("Tricks");
  }

  if (/\benvironment\b|\benvironments\b/.test(descriptionValue)) {
    addType("Environment");
  }

  if (/\bsuperpower\b|\bsuperpowers\b/.test(descriptionValue)) {
    addType("Superpower");
  }

  return types;
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

const KNOWN_RARITIES = new Set([
  "common",
  "uncommon",
  "rare",
  "super-rare",
  "legendary",
  "event",
  "token",
  "hero",
]);

// Matches a trailing rarity word, with any dash/space/colon separator before it.
const TRAILING_RARITY_PATTERN =
  /^(.*?)[\s\-–—:|/]*\b(super[\s-]?rare|uncommon|common|rare|legendary)\s*$/i;

const parseSetRarity = (setRarity) => {
  if (!setRarity) {
    return { setName: "", rarityName: "" };
  }

  const value = String(setRarity).trim();
  const separatorIndex = value.lastIndexOf(" - ");

  // Standard format: "Set - Rarity"
  if (separatorIndex !== -1) {
    return {
      setName: value.slice(0, separatorIndex).trim(),
      rarityName: value.slice(separatorIndex + 3).trim(),
    };
  }

  const normalized = normalizeText(value);

  // Event cards have no rarity tier; "Event" is both the set and the rarity.
  if (normalized === "event") {
    return { setName: value, rarityName: value };
  }

  // Fallback for variants like "Colossal Super-Rare" or "Colossal – Super-Rare".
  const match = TRAILING_RARITY_PATTERN.exec(value);

  if (match && match[1].trim()) {
    return { setName: match[1].trim(), rarityName: match[2].trim() };
  }

  return {
    setName: "",
    rarityName: KNOWN_RARITIES.has(normalized) ? value : "",
  };
};

export const getSetName = (setRarity) => parseSetRarity(setRarity).setName;

export const getRarityName = (setRarity) =>
  parseSetRarity(setRarity).rarityName;

export const getQuantityValue = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(MAX_QUANTITY, Math.max(0, parsed));
};

export const getCardData = (card) => card?.card || card;

export const getSideRank = (cardData) => {
  const sideValue = normalizeText(cardData?.side);

  if (sideValue.includes("plant")) {
    return 0;
  }

  if (sideValue.includes("zombie")) {
    return 1;
  }

  return 2;
};