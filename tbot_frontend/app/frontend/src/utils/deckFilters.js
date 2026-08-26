/*
 * --------------------------------------------------------------------------
 * Shared deck filtering / collection helpers
 * --------------------------------------------------------------------------
 */

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

/*
 * --------------------------------------------------------------------------
 * Normalization
 * --------------------------------------------------------------------------
 */

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

/*
 * --------------------------------------------------------------------------
 * Deck card parsing
 * --------------------------------------------------------------------------
 */

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

    /*
     * Supported formats:
     *
     * Card Name|4
     * Card Name | 4
     * Card Name x4
     * Card Name X4
     */

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

/*
 * --------------------------------------------------------------------------
 * Collection parsing
 * --------------------------------------------------------------------------
 */

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

  if (typeof nestedCard === "string") {
    return normalizeText(
      item.card_name ?? item.cardName ?? item.name ?? item.title ?? nestedCard,
    );
  }

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

    /*
     * A plain string in the collection represents one copy.
     */
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

/*
 * --------------------------------------------------------------------------
 * Collection / deck comparison
 * --------------------------------------------------------------------------
 *
 * Close means:
 * - At least 70% of required copies are owned.
 * - At least 75% of individual card types are complete.
 * - The deck is not already buildable.
 */

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

    const owned = Number(collectionMap.get(cardKey)) || 0;

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
