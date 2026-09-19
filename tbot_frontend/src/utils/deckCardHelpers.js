import { API_BASE_URL } from "./api";

export const HERO_COLORS = {
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
  "Wall-Knight": ["brown", "yellow"],
  "Brain Freeze": ["black", "blue"],
  "Electric Boogaloo": ["blue", "purple"],
  "Huge-Gigantacus": ["pink", "black"],
  "Super Brainz": ["pink", "black"],
  Immorticia: ["pink", "blue"],
  Impfinity: ["black", "purple"],
  Neptuna: ["orange", "black"],
  "Professor Brainstorm": ["pink", "purple"],
  Rustbolt: ["pink", "orange"],
  "The Smash": ["orange", "blue"],
  "Z-mech": ["orange", "purple"],
};

export const normalizeHeroName = (hero) =>
  String(hero || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const getHeroColors = (hero) => {
  const normalizedHero = normalizeHeroName(hero);

  const entry = Object.entries(HERO_COLORS).find(
    ([name]) => normalizeHeroName(name) === normalizedHero,
  );

  return entry?.[1] || ["default", "default"];
};

export const getImageUrl = (value) => {
  const image = String(value || "").trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  if (image.startsWith("/media/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("decklists/")) {
    return `${API_BASE_URL}/media/${image}`;
  }

  return `${API_BASE_URL}/${image}`;
};

export const hasValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim() !== "";
};

export const normalizeText = (value) => {
  return String(value ?? "").trim();
};

export const getOwnerName = (deck) => {
  return (
    normalizeText(deck?.owner) ||
    normalizeText(deck?.owner_username) ||
    normalizeText(deck?.owner_name) ||
    normalizeText(deck?.username) ||
    normalizeText(deck?.profile_display_name) ||
    normalizeText(deck?.display_name) ||
    normalizeText(deck?.profile_slug) ||
    normalizeText(deck?.user) ||
    ""
  );
};

export const formatSuggestionCooldown = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).split(".")[0];
  }

  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatCost = (value) => {
  if (!hasValue(value)) {
    return "-";
  }

  const raw = String(value).trim();
  const numericValue = Number(raw.replace(/,/g, ""));

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString("en-US");
  }

  return raw;
};

export const formatDeckDate = (value) => {
  if (!value) {
    return "";
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const toExternalUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const markdownMatch = /\((https?:\/\/[^)]+)\)/i.exec(raw);
  const inlineUrlMatch = /https?:\/\/\S+/i.exec(raw);

  let candidate = (markdownMatch?.[1] || inlineUrlMatch?.[0] || raw)
    .trim()
    .replace(/\s+/g, "");

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

export const parseCardRatioLines = (value) =>
  String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, countPart] = line.split("|");
      const name = String(namePart || "").trim();
      const parsedCount = Number(countPart);

      const count =
        Number.isFinite(parsedCount) && parsedCount > 0
          ? Math.min(parsedCount, 4)
          : 1;

      return {
        name,
        count,
      };
    })
    .filter((entry) => entry.name);

export const formatCardsDisplay = (value) => {
  const entries = parseCardRatioLines(value);

  if (entries.length === 0) {
    return "";
  }

  return entries.map((entry) => `${entry.name} x${entry.count}`).join(", ");
};

export const normalizeDeckShareValue = (value) => {
  try {
    return decodeURIComponent(String(value || "").trim()).toLowerCase();
  } catch {
    return String(value || "")
      .trim()
      .toLowerCase();
  }
};