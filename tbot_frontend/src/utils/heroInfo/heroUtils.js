import {
  HERO_COLOR_MAP,
} from "./heroConfig.js";

import {
  normalizeText,
} from "../cardInfo/textUtils.js";

export const getCachedData = (key) => {
  try {
    const cached = sessionStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    if (!Array.isArray(parsed?.results)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(
      `Unable to read ${key}:`,
      error,
    );

    return null;
  }
};

export const getSideHeroes = (cards, side) => {
  const selectedSide = normalizeText(side);

  return cards.filter((card) => {
    const cardSide = normalizeText(card.side);

    if (selectedSide === "plants") {
      return (
        cardSide === "plant" ||
        cardSide === "plants"
      );
    }

    return (
      cardSide === "zombie" ||
      cardSide === "zombies"
    );
  });
};

export const findHeroByQuery = (
  cards,
  cardName,
) => {
  if (!cardName) {
    return null;
  }

  const normalizedName =
    normalizeText(cardName);

  return (
    cards.find(
      (card) =>
        normalizeText(card.card_name) ===
        normalizedName,
    ) || null
  );
};

export const getHeroColors = (hero) => {
  const heroName = String(
    hero?.card_name ||
      hero?.title ||
      "",
  ).trim();

  return (
    HERO_COLOR_MAP[heroName] || [
      "#15181b",
      "#15181b",
    ]
  );
};