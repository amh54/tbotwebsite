import {
  extractTribes,
  getCardKeywords,
  getCardStats,
  getCardTypes,
  getClassNames,
  getRarityName,
  getSetName,
} from "./dataUtils.js";

import { hasValue, normalizeText } from "./textUtils.js";

export const getSelectedValues = (values) =>
  Array.isArray(values) ? values : [];

export const matchesSelectedValues = (
  selectedValues,
  cardValues,
) => {
  if (!selectedValues.length) {
    return true;
  }

  return selectedValues.some((selected) =>
    cardValues.some(
      (value) =>
        normalizeText(value) === normalizeText(selected.value),
    ),
  );
};

export const matchesNumericFilter = (
  selectedValues,
  cardValue,
) => {
  if (!selectedValues.length) {
    return true;
  }

  return selectedValues.some(
    (selected) => cardValue === Number(selected.value),
  );
};

export const matchesSingleValueFilter = (
  selectedValues,
  cardValue,
) => {
  if (!selectedValues.length) {
    return true;
  }

  return selectedValues.some(
    (selected) =>
      normalizeText(cardValue) === normalizeText(selected.value),
  );
};

export const getCardFilterData = (card) => {
  const cardClasses = getClassNames(card.card_type);
  const cardTypes = getCardTypes(card);
  const cardKeywords = getCardKeywords(card);
  const cardTribes = extractTribes(
    card.description,
    card.side,
    card.card_type,
  );
  const stats = getCardStats(card.stats);
  const cardSet = getSetName(card.set_rarity);
  const cardRarity = getRarityName(card.set_rarity);

  return {
    cardClasses,
    cardTypes,
    cardKeywords,
    cardTribes,
    stats,
    cardSet,
    cardRarity,
  };
};

export const matchesCardFilters = (card, filters) => {
  const {
    searchValue,
    selectedKeywords,
    selectedTribes,
    selectedTypes,
    selectedClasses,
    selectedCosts,
    selectedAttacks,
    selectedHealths,
    selectedSets,
    selectedRarities,
  } = filters;

  const {
    cardClasses,
    cardTypes,
    cardKeywords,
    cardTribes,
    stats,
    cardSet,
    cardRarity,
  } = getCardFilterData(card);

  const searchableText = [
    card.card_name,
    card.title,
    card.card_type,
    card.description,
    card.ability,
    card.traits,
    ...cardClasses,
    ...cardTypes,
    ...cardKeywords,
    ...cardTribes,
    cardSet,
    cardRarity,
    card.aliases,
  ]
    .filter(hasValue)
    .join(" ")
    .toLowerCase();

  if (searchValue && !searchableText.includes(searchValue)) {
    return false;
  }

  if (!matchesSelectedValues(selectedClasses, cardClasses)) {
    return false;
  }

  if (!matchesSelectedValues(selectedTypes, cardTypes)) {
    return false;
  }

  if (!matchesNumericFilter(selectedCosts, stats.cost)) {
    return false;
  }

  if (!matchesNumericFilter(selectedAttacks, stats.attack)) {
    return false;
  }

  if (!matchesNumericFilter(selectedHealths, stats.health)) {
    return false;
  }

  if (!matchesSelectedValues(selectedKeywords, cardKeywords)) {
    return false;
  }

  if (!matchesSelectedValues(selectedTribes, cardTribes)) {
    return false;
  }

  if (!matchesSingleValueFilter(selectedSets, cardSet)) {
    return false;
  }

  return matchesSingleValueFilter(
    selectedRarities,
    cardRarity,
  );
};

export const countFilterMatches = (
  selectedValues,
  cardValues,
) => {
  if (!selectedValues.length) {
    return 0;
  }

  return selectedValues.filter((selected) =>
    cardValues.some(
      (value) =>
        normalizeText(value) === normalizeText(selected.value),
    ),
  ).length;
};

export const getCardFilterMatchScore = (
  card,
  filters,
) => {
  const {
    selectedKeywords,
    selectedTribes,
    selectedTypes,
    selectedClasses,
    selectedCosts,
    selectedAttacks,
    selectedHealths,
    selectedSets,
    selectedRarities,
  } = filters;

  const {
    cardClasses,
    cardTypes,
    cardKeywords,
    cardTribes,
    stats,
    cardSet,
    cardRarity,
  } = getCardFilterData(card);

  let score = 0;

  score += countFilterMatches(
    selectedClasses,
    cardClasses,
  );

  score += countFilterMatches(
    selectedTypes,
    cardTypes,
  );

  score += countFilterMatches(
    selectedKeywords,
    cardKeywords,
  );

  score += countFilterMatches(
    selectedTribes,
    cardTribes,
  );

  score += selectedCosts.filter(
    (selected) => stats.cost === Number(selected.value),
  ).length;

  score += selectedAttacks.filter(
    (selected) => stats.attack === Number(selected.value),
  ).length;

  score += selectedHealths.filter(
    (selected) => stats.health === Number(selected.value),
  ).length;

  score += selectedSets.filter(
    (selected) =>
      normalizeText(cardSet) === normalizeText(selected.value),
  ).length;

  score += selectedRarities.filter(
    (selected) =>
      normalizeText(cardRarity) === normalizeText(selected.value),
  ).length;

  return score;
};

export const getCardGroup = (card) => {
  if (!hasValue(card.description)) {
    return 0;
  }

  const description = normalizeText(card.description);

  if (description.includes("superpower trick")) {
    return 1;
  }

  return 2;
};

export const compareCardsByFilters = (filters) => (a, b) => {
  const aScore = getCardFilterMatchScore(a, filters);
  const bScore = getCardFilterMatchScore(b, filters);

  if (aScore !== bScore) {
    return bScore - aScore;
  }

  const groupDifference = getCardGroup(a) - getCardGroup(b);

  if (groupDifference !== 0) {
    return groupDifference;
  }

  const aClass = getClassNames(a.card_type)[0] || "";
  const bClass = getClassNames(b.card_type)[0] || "";

  const classDifference = aClass.localeCompare(
    bClass,
    undefined,
    { sensitivity: "base" },
  );

  if (classDifference !== 0) {
    return classDifference;
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
    { sensitivity: "base" },
  );
};

export const buildCardFilters = ({
  search,
  keywordFilter,
  tribeFilter,
  typeFilter,
  classFilter,
  costFilter,
  attackFilter,
  healthFilter,
  setFilter,
  rarityFilter,
}) => ({
  searchValue: normalizeText(search),
  selectedKeywords: getSelectedValues(keywordFilter),
  selectedTribes: getSelectedValues(tribeFilter),
  selectedTypes: getSelectedValues(typeFilter),
  selectedClasses: getSelectedValues(classFilter),
  selectedCosts: getSelectedValues(costFilter),
  selectedAttacks: getSelectedValues(attackFilter),
  selectedHealths: getSelectedValues(healthFilter),
  selectedSets: getSelectedValues(setFilter),
  selectedRarities: getSelectedValues(rarityFilter),
});

export const filterAndSortCards = (cards, filters) =>
  cards
    .filter((card) => matchesCardFilters(card, filters))
    .sort(compareCardsByFilters(filters));