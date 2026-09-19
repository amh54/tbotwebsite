export const CARD_SPARK_COSTS = {
  "Exploding Fruitcake": 2000,
  "Hot Date": 2000,
  Transfiguration: 2000,
  "Witch Hazel": 2000,
  "Red Stinger": 2000,
  "Zombology Teacher": 2000,
  "Leprechaun Imp": 2000,
  "Kitchen Sink Zombie": 2000,
  "King of the Grill": 2000,
  "Hippity Hop Gargantuar": 2000,
  "Gargantuar-Throwing Imp": 2000,
};

export const RARITY_SPARK_COSTS = {
  legendary: 4000,
  "super-rare": 1000,
  event: 1000,
  rare: 250,
  uncommon: 50,
  common: 0,
};

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


export const getCardSparkCost = (card) => {
  const name = String(
    card?.card_name ??
      card?.name ??
      card?.title ??
      "",
  ).trim();

  const manualCost = CARD_SPARK_COSTS[name];

  if (manualCost !== undefined) {
    return manualCost;
  }

  const rarity = String(
    card?.set_rarity ??
      card?.setRarity ??
      card?.rarity ??
      "",
  )
    .trim()
    .toLowerCase();


  if (rarity.includes("legendary")) {
    return RARITY_SPARK_COSTS.legendary;
  }

  if (rarity.includes("super")) {
    return RARITY_SPARK_COSTS["super-rare"];
  }

  if (rarity.includes("event")) {
    return RARITY_SPARK_COSTS.event;
  }

  if (rarity.includes("rare")) {
    return RARITY_SPARK_COSTS.rare;
  }

  if (rarity.includes("uncommon")) {
    return RARITY_SPARK_COSTS.uncommon;
  }

  return RARITY_SPARK_COSTS.common;
};


export const calculateDeckCost = (
  cardsSelected,
  allCards,
) => {
  return (cardsSelected || []).reduce(
    (total, selected) => {

      const card = allCards.find(
        (item) =>
          normalizeName(
            item.card_name ??
            item.name ??
            item.title,
          ) ===
          normalizeName(selected.value),
      );


      if (!card) {
        return total;
      }


      const count =
        Number(selected.count) || 0;


      return (
        total +
        getCardSparkCost(card) * count
      );
    },
    0,
  );
};