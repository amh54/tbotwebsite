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
