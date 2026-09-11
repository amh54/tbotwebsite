const CLASS_EMOJI_NAMES = new Set([
  "guardian",
  "kabloom",
  "megagrow",
  "smarty",
  "solar",
  "beastly",
  "brainy",
  "crazy",
  "hearty",
  "sneaky",
]);

const normalizeCardName = (value) =>
  String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/<:[^:>]+:\d+>/gi, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const isClassEmoji = (emojiName) => {
  const normalized = String(
    emojiName || "",
  )
    .toLowerCase()
    .replace(/[-_\s]/g, "");

  return CLASS_EMOJI_NAMES.has(normalized);
};

const getSortedCards = (allCards) =>
  [...allCards]
    .filter((card) => card?.card_name)
    .sort(
      (a, b) =>
        normalizeCardName(b.card_name)
          .length -
        normalizeCardName(a.card_name).length,
    );

const findMatchingCard = (
  cards,
  textBeforeEmoji,
) => {
  const normalizedBeforeEmoji =
    normalizeCardName(textBeforeEmoji);

  return cards.find((card) => {
    const normalizedName =
      normalizeCardName(card.card_name);

    if (!normalizedName) {
      return false;
    }

    if (
      !normalizedBeforeEmoji.endsWith(
        normalizedName,
      )
    ) {
      return false;
    }

    const startIndex =
      normalizedBeforeEmoji.length -
      normalizedName.length;

    if (startIndex === 0) {
      return true;
    }

    const characterBefore =
      normalizedBeforeEmoji[startIndex - 1];

    return /\s/.test(characterBefore);
  });
};

export const getSuperpowerCards = (
  hero,
  allCards,
) => {
  if (
    !hero?.ability ||
    !Array.isArray(allCards) ||
    allCards.length === 0
  ) {
    return [];
  }

  const sortedCards =
    getSortedCards(allCards);

  const result = [];
  const ability = String(hero.ability);
  const lines = ability.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const emojiMatches = [
      ...line.matchAll(
        /<:([^:>]+):\d+>/gi,
      ),
    ];

    const classEmojiMatches =
      emojiMatches.filter((match) =>
        isClassEmoji(match[1]),
      );

    if (classEmojiMatches.length === 0) {
      continue;
    }

    for (const emojiMatch of classEmojiMatches) {
      const emojiIndex = emojiMatch.index;

      if (typeof emojiIndex !== "number") {
        continue;
      }

      const textBeforeEmoji = line.slice(
        0,
        emojiIndex,
      );

      const matchingCard =
        findMatchingCard(
          sortedCards,
          textBeforeEmoji,
        );

      if (
        matchingCard &&
        !result.some(
          (card) =>
            card.cardid ===
            matchingCard.cardid,
        )
      ) {
        result.push(matchingCard);
      }

      if (result.length === 4) {
        return result;
      }
    }
  }

  return result;
};