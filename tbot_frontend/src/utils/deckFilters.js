export const ARCHETYPE_META = {
  aggro: {
    icon: "⚡",
    description:
      "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7.",
  },
  combo: {
    icon: "🧩",
    description:
      "Uses a specific card synergy to do massive damage to the opponent (OTK or One Turn Kill decks).",
  },
  midrange: {
    icon: "⚖️",
    description:
      "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game.",
  },
  control: {
    icon: "🛡️",
    description:
      "Focuses on removal and card advantage, winning in the late game.",
  },
  tempo: {
    icon: "🏃",
    description:
      "Focuses on slowly building a big board, winning trades and overwhelming the opponent.",
  },
};

export const CATEGORY_META = {
  budget: {
    icon: "💵",
    description: "Decks that are cheap for new players",
  },
  competitive: {
    icon: "🏆",
    description: "Some of the best decks in the game",
  },
  ladder: {
    icon: "🪜",
    description: "Decks that are mostly only good for ranked games",
  },
  meme: {
    icon: "😂",
    description: "Decks built for fun or unusual combos",
  },
};

export const COLLECTION_OPTIONS = [
  {
    value: "buildable",
    label: "Can Build",
    description: "Decks you have every required card for",
  },
  {
    value: "close",
    label: "Close to Building (70%)",
    description: "Decks you are close to completing",
  },
];

export const HERO_ALIAS = {
  bc: "beta-carrotina",
  ct: "citron",
  sf: "solar flare",
  cz: "chompzilla",
  gs: "green shadow",
  gk: "grass knuckles",
  sp: "spudow",
  nc: "night cap",
  ro: "rose",
  cc: "captain combustible",
  sb: "super brainz",
  sm: "the smash",
  if: "impfinity",
  rb: "rustbolt",
  eb: "electric boogaloo",
  bf: "brain freeze",
  pb: "professor brainstorm",
  im: "immorticia",
  zm: "z-mech",
  nt: "neptuna",
  hg: "huge-giganticus",
};

export function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCardName(value) {
  return normalizeKey(value)
    .replace(/[’‘`´]/g, "'")
    .replace(/[‐-‒–—―]/g, "-")
    .split("-")
    .map((part) => part.trim())
    .join("-")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSide(value) {
  const normalized = normalizeKey(value);

  if (normalized === "zombie" || normalized === "zombies") {
    return "zombies";
  }

  if (normalized === "plant" || normalized === "plants") {
    return "plants";
  }

  return normalized;
}

export function parseDeckCards(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          return (
            item.card_name ?? item.cardName ?? item.name ?? item.card ?? ""
          );
        }

        return "";
      })
      .join("\n")
      .split(/\r?\n|,/)
      .map((card) => normalizeText(card))
      .filter(Boolean);
  }

  return String(value ?? "")
    .replaceAll("\\\r\n", "\n")
    .replaceAll("\\\n", "\n")
    .replaceAll("\\\r", "\r")
    .split(/\r?\n|,/)
    .map((card) => normalizeText(card))
    .filter(Boolean);
}

export function parseCategories(value) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,;/|]+/)
    .map((category) => category.trim())
    .filter(Boolean);
}

export function parseArchetypes(value) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,;/|]+/)
    .map((archetype) => archetype.trim())
    .filter(Boolean);
}

export function parseDeckCardRequirements(value) {
  const requirements = new Map();

  if (Array.isArray(value)) {
    value = value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          return (
            item.card_name ?? item.cardName ?? item.name ?? item.card ?? ""
          );
        }

        return "";
      })
      .join("\n");
  }

  const cards = String(value ?? "")
    .replaceAll("\\\r\n", "\n")
    .replaceAll("\\\n", "\n")
    .replaceAll("\\\r", "\r")
    .split(/\r?\n|,/)
    .map((card) => card.trim())
    .filter(Boolean);
  const parseCardRequirement = (rawCard) => {
    const pipeIndex = rawCard.lastIndexOf("|");

    if (pipeIndex !== -1) {
      return {
        cardName: rawCard.slice(0, pipeIndex).trim(),
        quantity: Math.max(1, Number(rawCard.slice(pipeIndex + 1).trim()) || 1),
      };
    }

    const trimmed = rawCard.trimEnd();
    const lastSpace = trimmed.lastIndexOf(" ");

    if (lastSpace === -1) {
      return { cardName: rawCard, quantity: 1 };
    }

    let digitStart = trimmed.length;

    while (
      digitStart > lastSpace + 1 &&
      trimmed[digitStart - 1] >= "0" &&
      trimmed[digitStart - 1] <= "9"
    ) {
      digitStart--;
    }

    const markerIndex = digitStart - 1;

    if (
      digitStart === trimmed.length ||
      markerIndex <= lastSpace + 1 ||
      (trimmed[markerIndex] !== "x" && trimmed[markerIndex] !== "X")
    ) {
      return { cardName: rawCard, quantity: 1 };
    }

    return {
      cardName: trimmed.slice(0, markerIndex).trim(),
      quantity: Math.max(1, Number(trimmed.slice(digitStart)) || 1),
    };
  };
  cards.forEach((rawCard) => {
    const { cardName, quantity } = parseCardRequirement(rawCard);
    const key = normalizeCardName(cardName);

    if (!key) {
      return;
    }

    requirements.set(key, (requirements.get(key) || 0) + quantity);
  });

  return requirements;
}
function getCardNameFromString(item) {
  const pipeIndex = item.lastIndexOf("|");

  if (pipeIndex !== -1) {
    const quantity = item.slice(pipeIndex + 1).trim();

    if (
      quantity &&
      [...quantity].every((char) => char >= "0" && char <= "9")
    ) {
      return normalizeText(item.slice(0, pipeIndex));
    }
  }

  const trimmed = item.trimEnd();
  let digitStart = trimmed.length;

  while (
    digitStart > 0 &&
    trimmed[digitStart - 1] >= "0" &&
    trimmed[digitStart - 1] <= "9"
  ) {
    digitStart--;
  }

  if (digitStart === trimmed.length) {
    return normalizeText(item);
  }

  let markerIndex = digitStart;

  while (markerIndex > 0 && trimmed[markerIndex - 1] === " ") {
    markerIndex--;
  }

  if (markerIndex === 0) {
    return normalizeText(item);
  }

  const marker = trimmed[markerIndex - 1];
  const nameEnd = markerIndex - 1;

  if (
    (marker === "x" || marker === "X") &&
    nameEnd > 0 &&
    trimmed[nameEnd - 1] === " "
  ) {
    return normalizeText(trimmed.slice(0, nameEnd));
  }

  return normalizeText(item);
}

function getNestedCollectionCard(item) {
  return (
    item.card ??
    item.card_data ??
    item.cardData ??
    item.web_card ??
    item.webCard ??
    null
  );
}

function getCollectionCardNameFromObject(item) {
  const nestedCard = getNestedCollectionCard(item);

  return normalizeText(
    item.card_name ??
      item.cardName ??
      item.name ??
      item.title ??
      nestedCard?.card_name ??
      nestedCard?.cardName ??
      nestedCard?.name ??
      nestedCard?.title ??
      "",
  );
}

export function getCollectionCardName(item) {
  if (typeof item === "string") {
    return getCardNameFromString(item);
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  return getCollectionCardNameFromObject(item);
}

function getQuantityAfterSeparator(value, separator) {
  const separatorIndex = value.lastIndexOf(separator);

  if (separatorIndex === -1) {
    return null;
  }

  const quantityText = value.slice(separatorIndex + 1).trim();

  if (
    !quantityText ||
    ![...quantityText].every((char) => char >= "0" && char <= "9")
  ) {
    return null;
  }

  return Math.max(0, Number(quantityText) || 0);
}

function getXQuantity(value) {
  const trimmed = value.trimEnd();
  let digitStart = trimmed.length;

  while (
    digitStart > 0 &&
    trimmed[digitStart - 1] >= "0" &&
    trimmed[digitStart - 1] <= "9"
  ) {
    digitStart--;
  }

  if (digitStart === trimmed.length) {
    return null;
  }

  let markerIndex = digitStart;

  while (markerIndex > 0 && trimmed[markerIndex - 1] === " ") {
    markerIndex--;
  }

  if (
    markerIndex > 0 &&
    (trimmed[markerIndex - 1] === "x" ||
      trimmed[markerIndex - 1] === "X")
  ) {
    const nameEnd = markerIndex - 1;

    if (nameEnd > 0 && trimmed[nameEnd - 1] === " ") {
      return Math.max(0, Number(trimmed.slice(digitStart)) || 0);
    }
  }

  return null;
}

function getStringCollectionQuantity(item) {
  const pipeQuantity = getQuantityAfterSeparator(item, "|");

  if (pipeQuantity !== null) {
    return pipeQuantity;
  }

  return getXQuantity(item) ?? 1;
}


function getObjectCollectionQuantity(item) {
  const nestedCard = getNestedCollectionCard(item);

  const quantity =
    item.quantity ??
    item.count ??
    item.amount ??
    item.owned ??
    item.copies ??
    nestedCard?.quantity ??
    nestedCard?.count ??
    nestedCard?.amount ??
    nestedCard?.owned ??
    nestedCard?.copies ??
    0;

  return Math.max(0, Number(quantity) || 0);
}

export function getCollectionCardQuantity(item) {
  if (typeof item === "string") {
    return getStringCollectionQuantity(item);
  }

  if (!item || typeof item !== "object") {
    return 0;
  }

  return getObjectCollectionQuantity(item);
}

export function buildCollectionMap(collectionCards) {
  const collectionMap = new Map();

  if (!Array.isArray(collectionCards)) {
    return collectionMap;
  }

  collectionCards.forEach((item) => {
    const cardName = getCollectionCardName(item);

    if (!cardName) {
      return;
    }

    const key = normalizeCardName(cardName);

    if (!key) {
      return;
    }

    const quantity = getCollectionCardQuantity(item);

    if (quantity <= 0) {
      return;
    }

    collectionMap.set(key, (collectionMap.get(key) || 0) + quantity);
  });

  return collectionMap;
}

export function getDeckCollectionStatus(deck, collectionMap) {
  const requirements = parseDeckCardRequirements(deck?.cards);

  if (requirements.size === 0) {
    return {
      buildable: false,
      close: false,
      missingCards: 0,
      missingQuantity: 0,
      ownedQuantity: 0,
      totalCards: 0,
      quantityPercent: 0,
      cardTypePercent: 0,
      completedCardTypes: 0,
      totalCardTypes: 0,
    };
  }

  let missingCards = 0;
  let missingQuantity = 0;
  let ownedQuantity = 0;
  let totalCards = 0;
  let completedCardTypes = 0;

  requirements.forEach((requiredQuantity, cardKey) => {
    totalCards += requiredQuantity;

    const owned = Number(collectionMap?.get(cardKey)) || 0;
    const usableOwned = Math.min(owned, requiredQuantity);

    ownedQuantity += usableOwned;

    if (owned >= requiredQuantity) {
      completedCardTypes += 1;
    } else {
      missingCards += 1;
      missingQuantity += requiredQuantity - owned;
    }
  });

  const totalCardTypes = requirements.size;

  const quantityPercent = totalCards > 0 ? ownedQuantity / totalCards : 0;

  const cardTypePercent =
    totalCardTypes > 0 ? completedCardTypes / totalCardTypes : 0;

  const buildable = missingQuantity === 0 && missingCards === 0;

  const close = !buildable && quantityPercent >= 0.7 && cardTypePercent >= 0.75;

  return {
    buildable,
    close,
    missingCards,
    missingQuantity,
    ownedQuantity,
    totalCards,
    quantityPercent,
    cardTypePercent,
    completedCardTypes,
    totalCardTypes,
  };
}

export function getDeckKey(deck) {
  return String(
    deck?.deckid ??
      deck?.deckID ??
      deck?.id ??
      `${normalizeSide(deck?.side)}-${normalizeKey(
        deck?.hero,
      )}-${normalizeKey(deck?.name)}`,
  );
}

export function getCollectionValues(value) {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => item?.value)
      .filter(Boolean);
  }

  if (value?.value) {
    return [value.value];
  }

  if (typeof value === "string" && value) {
    return [value];
  }

  return [];
}

function matchesSearchFilter(deck, searchValue) {
  if (!searchValue) {
    return true;
  }

  const alias = HERO_ALIAS[searchValue]
    ? normalizeKey(HERO_ALIAS[searchValue])
    : "";

  if (alias) {
    return normalizeKey(deck?.hero).includes(alias);
  }

  const searchableValues = [
    deck?.name,
    deck?.creator,
    deck?.optimization,
    deck?.hero,
    deck?.archetype,
    deck?.category,
    deck?.aliases,
  ]
    .filter(Boolean)
    .map((value) => normalizeKey(value));

  const normalFieldMatch = searchableValues.some((value) =>
    value.includes(searchValue),
  );

  if (normalFieldMatch) {
    return true;
  }

  return parseDeckCards(deck?.cards).some((card) =>
    normalizeKey(card).includes(searchValue),
  );
}

function matchesSideFilter(deck, side, exclude) {
  return (
    exclude === "side" ||
    side === "All" ||
    normalizeSide(deck?.side) === normalizeSide(side)
  );
}

function matchesHeroFilter(deck, hero, heroOption, exclude) {
  if (exclude === "hero") {
    return true;
  }

  const selectedHeroes = heroOption !== null ? [heroOption] : hero;

  return (
    selectedHeroes.length === 0 ||
    selectedHeroes.some(
      (selectedHero) =>
        normalizeKey(deck?.hero) === normalizeKey(selectedHero?.value),
    )
  );
}

function matchesCategoryFilter(deck, category, categoryOption, exclude) {
  if (exclude === "category") {
    return true;
  }

  const selectedCategories =
    categoryOption !== null ? [categoryOption] : category;

  if (selectedCategories.length === 0) {
    return true;
  }

  const deckCategories = parseCategories(deck?.category);

  return selectedCategories.some((selectedCategory) =>
    deckCategories.includes(normalizeKey(selectedCategory?.value)),
  );
}

function matchesArchetypeFilter(
  deck,
  archetype,
  archetypeOption,
  exclude,
) {
  if (exclude === "archetype") {
    return true;
  }

  const selectedArchetypes =
    archetypeOption !== null
      ? [...archetype, archetypeOption]
      : archetype;

  if (selectedArchetypes.length === 0) {
    return true;
  }

  const deckArchetype = normalizeKey(deck?.archetype);

  return selectedArchetypes.some((selectedArchetype) =>
    deckArchetype.includes(normalizeKey(selectedArchetype?.value)),
  );
}

export function matchesNonCollectionFilters(
  deck,
  {
    search = "",
    side = "All",
    hero = [],
    category = [],
    archetype = [],
    exclude = null,
    heroOption = null,
    categoryOption = null,
    archetypeOption = null,
  } = {},
) {
  const searchValue = normalizeKey(search);

  return (
    matchesSearchFilter(deck, searchValue) &&
    matchesSideFilter(deck, side, exclude) &&
    matchesHeroFilter(deck, hero, heroOption, exclude) &&
    matchesCategoryFilter(deck, category, categoryOption, exclude) &&
    matchesArchetypeFilter(deck, archetype, archetypeOption, exclude)
  );
}
export function matchesDeckFilters(
  deck,
  {
    search = "",
    side = "All",
    hero = [],
    category = [],
    archetype = [],
    exclude = null,
    heroOption = null,
    categoryOption = null,
    archetypeOption = null,
    collection = null,
    collectionOption = null,
    collectionMap = null,
    collectionLoading = false,
    collectionLoaded = false,
    discordUser = null,
  } = {},
) {
  if (
    !matchesNonCollectionFilters(deck, {
      search,
      side,
      hero,
      category,
      archetype,
      exclude,
      heroOption,
      categoryOption,
      archetypeOption,
    })
  ) {
    return false;
  }

  if (exclude !== "collection") {
    const selectedCollection =
      collectionOption !== null ? collectionOption : collection;

    const collectionValues = getCollectionValues(selectedCollection);

    if (collectionValues.length > 0) {
      if (
        !discordUser ||
        !collectionLoaded ||
        collectionLoading ||
        !collectionMap
      ) {
        return true;
      }

      const status = getDeckCollectionStatus(deck, collectionMap);

      return collectionValues.some((value) => {
        if (value === "buildable") {
          return status?.buildable === true;
        }

        if (value === "close") {
          return status?.close === true;
        }

        return true;
      });
    }
  }

  return true;
}

export function sortDecks(decks = []) {
  const sideOrder = {
    plants: 0,
    zombies: 1,
  };

  return [...decks].sort((a, b) => {
    const sideA = normalizeSide(a?.side);
    const sideB = normalizeSide(b?.side);

    const sideCompare = (sideOrder[sideA] ?? 99) - (sideOrder[sideB] ?? 99);

    if (sideCompare !== 0) {
      return sideCompare;
    }

    const heroCompare = normalizeText(a?.hero).localeCompare(
      normalizeText(b?.hero),
      undefined,
      {
        sensitivity: "base",
      },
    );

    if (heroCompare !== 0) {
      return heroCompare;
    }

    return normalizeText(a?.name).localeCompare(
      normalizeText(b?.name),
      undefined,
      {
        sensitivity: "base",
      },
    );
  });
}
export function getHeroOptions(decks = [], allCards = [], filterOptions = {}) {
  const heroMap = new Map();

  decks.forEach((deck) => {
    if (
      !matchesDeckFilters(deck, {
        ...filterOptions,
        exclude: "hero",
      })
    ) {
      return;
    }

    const heroName = normalizeText(deck?.hero);

    if (!heroName) {
      return;
    }

    const key = normalizeKey(heroName);

    if (!heroMap.has(key)) {
      heroMap.set(key, {
        value: heroName,
        label: heroName,
        count: 0,
        side: normalizeSide(deck?.side),
      });
    }

    heroMap.get(key).count += 1;
  });

  // Always work with an array.
  const cards = Array.isArray(allCards) ? allCards : [];

  return Array.from(heroMap.values())
    .map((option) => {
      const matchedCard = cards.find(
        (card) =>
          normalizeCardName(card?.card_name) ===
          normalizeCardName(option.label),
      );

      return {
        ...option,
        description: matchedCard?.flavor_text || "",
        image: matchedCard?.thumbnail || "",
      };
    })
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
}

export function getCategoryOptions(decks = [], filterOptions = {}) {
  const categoryMap = new Map();

  decks.forEach((deck) => {
    if (
      !matchesDeckFilters(deck, {
        ...filterOptions,
        exclude: "category",
      })
    ) {
      return;
    }

    const categories = parseCategories(deck?.category);

    categories.forEach((category) => {
      const key = normalizeKey(category);

      if (!key) {
        return;
      }

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          value: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          count: 0,
          ...(CATEGORY_META[key]),
        });
      }

      categoryMap.get(key).count += 1;
    });
  });

  return Array.from(categoryMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, {
      sensitivity: "base",
    }),
  );
}
export function getArchetypeOptions(decks = [], filterOptions = {}) {
  const options = Object.entries(ARCHETYPE_META).map(([value, meta]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    count: 0,
    ...meta,
  }));

  decks.forEach((deck) => {
    options.forEach((option) => {
      if (
        !matchesDeckFilters(deck, {
          ...filterOptions,
          exclude: "archetype",
          archetypeOption: option,
        })
      ) {
        return;
      }

      const deckArchetype = normalizeKey(deck?.archetype);

      if (deckArchetype.includes(normalizeKey(option.value))) {
        option.count += 1;
      }
    });
  });

  return options.filter((option) => option.count > 0);
}

export function getCollectionOptions(
  decks = [],
  {
    search = "",
    side = "All",
    hero = [],
    category = [],
    archetype = [],
    collectionMap = null,
    collectionLoading = false,
    collectionLoaded = false,
    discordUser = null,
    authLoading = false,
  } = {},
) {
  if (!discordUser || authLoading || collectionLoading || !collectionLoaded) {
    return COLLECTION_OPTIONS;
  }

  let buildableCount = 0;
  let closeCount = 0;

  decks.forEach((deck) => {
    if (
      !matchesNonCollectionFilters(deck, {
        search,
        side,
        hero,
        category,
        archetype,
      })
    ) {
      return;
    }

    const status = getDeckCollectionStatus(deck, collectionMap);

    if (status?.buildable === true) {
      buildableCount += 1;
    }

    if (status?.close === true) {
      closeCount += 1;
    }
  });

  return COLLECTION_OPTIONS.map((option) => {
    if (option.value === "buildable") {
      return {
        ...option,
        count: buildableCount,
      };
    }

    if (option.value === "close") {
      return {
        ...option,
        count: closeCount,
      };
    }

    return option;
  });
}

export function filterDecks({
  decks = [],
  search = "",
  side = "All",
  hero = [],
  category = [],
  archetype = [],
  collection = null,
  collectionMap = null,
  collectionLoading = false,
  collectionLoaded = false,
  discordUser = null,
} = {}) {
  const filtered = decks.filter((deck) =>
    matchesDeckFilters(deck, {
      search,
      side,
      hero,
      category,
      archetype,
      collection,
      collectionMap,
      collectionLoading,
      collectionLoaded,
      discordUser,
    }),
  );

  if (category.length > 1) {
    const selectedCategories = category.map((selected) =>
      normalizeKey(selected?.value),
    );

    return [...filtered].sort((a, b) => {
      const aCategories = parseCategories(a?.category);
      const bCategories = parseCategories(b?.category);

      const aMatchesAll = selectedCategories.every((selected) =>
        aCategories.includes(selected),
      );

      const bMatchesAll = selectedCategories.every((selected) =>
        bCategories.includes(selected),
      );

      if (aMatchesAll !== bMatchesAll) {
        return aMatchesAll ? -1 : 1;
      }

      return 0;
    });
  }

  if (archetype.length > 1) {
    const selectedArchetypes = archetype.map((selected) =>
      normalizeKey(selected?.value),
    );

    return [...filtered].sort((a, b) => {
      const aArchetype = normalizeKey(a?.archetype);
      const bArchetype = normalizeKey(b?.archetype);

      const aMatchesAll = selectedArchetypes.every((selected) =>
        aArchetype.includes(selected),
      );

      const bMatchesAll = selectedArchetypes.every((selected) =>
        bArchetype.includes(selected),
      );

      if (aMatchesAll !== bMatchesAll) {
        return aMatchesAll ? -1 : 1;
      }

      return 0;
    });
  }

  return filtered;
}

export function getFilterOptions({
  decks = [],
  allCards = [],
  search = "",
  side = "All",
  hero = [],
  category = [],
  archetype = [],
  collection = null,
  collectionMap = null,
  collectionLoading = false,
  collectionLoaded = false,
  discordUser = null,
  authLoading = false,
} = {}) {
  const filterOptions = {
    search,
    side,
    hero,
    category,
    archetype,
    collection,
    collectionMap,
    collectionLoading,
    collectionLoaded,
    discordUser,
  };

  return {
    heroOptions: getHeroOptions(decks, allCards, filterOptions),
    categoryOptions: getCategoryOptions(decks, filterOptions),
    archetypeOptions: getArchetypeOptions(decks, filterOptions),
    collectionOptions: getCollectionOptions(decks, {
      search,
      side,
      hero,
      category,
      archetype,
      collectionMap,
      collectionLoading,
      collectionLoaded,
      discordUser,
      authLoading,
    }),
  };
}
