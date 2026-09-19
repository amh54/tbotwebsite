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
    .replace(/\s*-\s*/g, "-")
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
    .replace(/\\\r\n/g, "\n")
    .replace(/\\\n/g, "\n")
    .replace(/\\\r/g, "\r")
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
    .replace(/\\\r\n/g, "\n")
    .replace(/\\\n/g, "\n")
    .replace(/\\\r/g, "\r")
    .split(/\r?\n|,/)
    .map((card) => card.trim())
    .filter(Boolean);

  cards.forEach((rawCard) => {
    let cardName = rawCard;
    let quantity = 1;

    const pipeMatch = rawCard.match(/^(.+?)\s*\|\s*(\d+)\s*$/);

    if (pipeMatch) {
      cardName = pipeMatch[1].trim();
      quantity = Math.max(1, Number(pipeMatch[2]) || 1);
    } else {
      const xMatch = rawCard.match(/^(.+?)\s*[xX]\s*(\d+)\s*$/);

      if (xMatch) {
        cardName = xMatch[1].trim();
        quantity = Math.max(1, Number(xMatch[2]) || 1);
      }
    }

    const key = normalizeCardName(cardName);

    if (!key) {
      return;
    }

    requirements.set(key, (requirements.get(key) || 0) + quantity);
  });

  return requirements;
}

export function getCollectionCardName(item) {
  if (typeof item === "string") {
    const pipeMatch = item.match(/^(.+?)\s*\|\s*(\d+)\s*$/);

    if (pipeMatch) {
      return normalizeText(pipeMatch[1]);
    }

    const xMatch = item.match(/^(.+?)\s*[xX]\s*(\d+)\s*$/);

    if (xMatch) {
      return normalizeText(xMatch[1]);
    }

    return normalizeText(item);
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  const nestedCard =
    item.card ??
    item.card_data ??
    item.cardData ??
    item.web_card ??
    item.webCard ??
    null;

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

export function getCollectionCardQuantity(item) {
  if (typeof item === "string") {
    const pipeMatch = item.match(/^(.+?)\s*\|\s*(\d+)\s*$/);

    if (pipeMatch) {
      return Math.max(0, Number(pipeMatch[2]) || 0);
    }

    const xMatch = item.match(/^(.+?)\s*[xX]\s*(\d+)\s*$/);

    if (xMatch) {
      return Math.max(0, Number(xMatch[2]) || 0);
    }

    return 1;
  }

  if (!item || typeof item !== "object") {
    return 0;
  }

  const nestedCard =
    item.card ??
    item.card_data ??
    item.cardData ??
    item.web_card ??
    item.webCard ??
    null;

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

  if (searchValue) {
    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

    const deckCards = parseDeckCards(deck?.cards);

    const searchableCardValues = deckCards.map((card) => normalizeKey(card));

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

    let searchMatch = false;

    if (alias) {
      searchMatch = normalizeKey(deck?.hero).includes(alias);
    } else {
      const normalFieldMatch = searchableValues.some((value) =>
        value.includes(searchValue),
      );

      const cardMatch = searchableCardValues.some((card) =>
        card.includes(searchValue),
      );

      searchMatch = normalFieldMatch || cardMatch;
    }

    if (!searchMatch) {
      return false;
    }
  }

  if (exclude !== "side" && side !== "All") {
    if (normalizeSide(deck?.side) !== normalizeSide(side)) {
      return false;
    }
  }

  if (exclude !== "hero") {
    const selectedHeroes = heroOption !== null ? [heroOption] : hero;

    if (selectedHeroes.length > 0) {
      const heroMatch = selectedHeroes.some(
        (selectedHero) =>
          normalizeKey(deck?.hero) === normalizeKey(selectedHero?.value),
      );

      if (!heroMatch) {
        return false;
      }
    }
  }

  if (exclude !== "category") {
    const selectedCategories =
      categoryOption !== null ? [categoryOption] : category;

    if (selectedCategories.length > 0) {
      const categoryMatch = selectedCategories.some(
        (selectedCategory) =>
          normalizeKey(deck?.category) ===
          normalizeKey(selectedCategory?.value),
      );

      if (!categoryMatch) {
        return false;
      }
    }
  }

  if (exclude !== "archetype") {
    const selectedArchetypes =
      archetypeOption !== null ? [...archetype, archetypeOption] : archetype;

    if (selectedArchetypes.length > 0) {
      const deckArchetype = normalizeKey(deck?.archetype);

      const archetypeMatch = selectedArchetypes.some((selectedArchetype) =>
        deckArchetype.includes(normalizeKey(selectedArchetype?.value)),
      );

      if (!archetypeMatch) {
        return false;
      }
    }
  }

  return true;
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

    const categoryName = normalizeText(deck?.category);

    if (!categoryName) {
      return;
    }

    const key = normalizeKey(categoryName);

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        value: categoryName,
        label: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
        count: 0,
        ...(CATEGORY_META[key] || {}),
      });
    }

    categoryMap.get(key).count += 1;
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
