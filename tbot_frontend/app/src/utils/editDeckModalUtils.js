import { MAX_CARD_RATIO } from "./editDeckModalConstants";

export const normalizeSide = (side) => {
  const value = String(side || "")
    .trim()
    .toLowerCase();

  if (value === "plant" || value === "plants") {
    return "Plants";
  }

  if (value === "zombie" || value === "zombies") {
    return "Zombies";
  }

  return "";
};

export const getCardSide = (card) => {
  const side = String(card?.side ?? "")
    .trim()
    .toLowerCase();

  if (side === "plant" || side === "plants") {
    return "Plants";
  }

  if (side === "zombie" || side === "zombies") {
    return "Zombies";
  }

  return "";
};

export const normalizeCardType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const valuesToOptions = (value) =>
  String(value ?? "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      value: item,
      label: item,
    }));

export const optionsToCombinedValue = (options) =>
  (options || [])
    .map((option) => String(option?.value || "").trim())
    .filter(Boolean)
    .join(" ");

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
          ? Math.min(parsedCount, MAX_CARD_RATIO)
          : 1;

      return {
        name,
        count,
      };
    })
    .filter((entry) => entry.name);

export const cardRatioLinesToOptions = (value, options = []) => {
  const optionMap = new Map(
    options.map((option) => [
      String(option.value).trim().toLowerCase(),
      option,
    ]),
  );

  return parseCardRatioLines(value)
    .map((entry) => {
      const matched = optionMap.get(entry.name.toLowerCase());

      if (!matched) {
        return null;
      }

      return {
        ...matched,
        count: entry.count,
      };
    })
    .filter(Boolean);
};

export const cardOptionsToRatioLines = (options) =>
  (options || [])
    .map((option) => {
      const name = String(option?.value || "").trim();
      const count = Number(option?.count) || 0;

      if (!name || count <= 0) {
        return "";
      }

      return `${name}|${count}`;
    })
    .filter(Boolean)
    .join("\n");

export const sumCardRatios = (options) =>
  (options || []).reduce(
    (sum, option) => sum + (Number(option?.count) || 0),
    0,
  );

export const isValidDeckTutorialUrl = (value) => {
  const url = String(value ?? "").trim();

  if (!url) {
    return true;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    return (
      hostname === "docs.google.com" ||
      hostname.endsWith(".docs.google.com") ||
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "word.office.com" ||
      hostname === "office.com" ||
      hostname.endsWith(".office.com") ||
      hostname === "1drv.ms" ||
      hostname.endsWith(".sharepoint.com")
    );
  } catch {
    return false;
  }
};

export const getDeckIdentity = (deck) =>
  String(
    deck?.deckid ??
      deck?.deckID ??
      deck?.id ??
      deck?.deck_id ??
      deck?.name ??
      "",
  );

export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${month}/${day}/${year}`;
};
