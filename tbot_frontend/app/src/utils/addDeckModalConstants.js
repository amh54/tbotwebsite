export const HERO_CLASSES = {
  "Beta-Carrotina": ["Guardian", "Smarty"],
  Citron: ["Guardian", "Smarty"],
  "Captain Combustible": ["Kabloom", "Mega-Grow"],
  Chompzilla: ["Mega-Grow", "Solar"],
  "Grass Knuckles": ["Guardian", "Mega-Grow"],
  "Green Shadow": ["Mega-Grow", "Smarty"],
  "Night Cap": ["Kabloom", "Smarty"],
  Rose: ["Smarty", "Solar"],
  "Solar Flare": ["Kabloom", "Solar"],
  Spudow: ["Guardian", "Kabloom"],
  "Wall-Knight": ["Guardian", "Solar"],
  "Brain Freeze": ["Sneaky", "Beastly"],
  "Electric Boogaloo": ["Crazy", "Beastly"],
  "Huge-Gigantacus": ["Brainy", "Sneaky"],
  "Super Brainz": ["Brainy", "Sneaky"],
  Immorticia: ["Brainy", "Beastly"],
  Impfinity: ["Crazy", "Sneaky"],
  Neptuna: ["Hearty", "Sneaky"],
  "Professor Brainstorm": ["Brainy", "Crazy"],
  Rustbolt: ["Hearty", "Brainy"],
  "The Smash": ["Beastly", "Hearty"],
  "Z-Mech": ["Crazy", "Hearty"],
};

export const CATEGORY_OPTIONS = [
  "Budget",
  "Competitive",
  "Ladder",
  "Meme",
].map((value) => ({
  value,
  label: value,
}));

export const ARCHETYPE_OPTIONS = [
  "Aggro",
  "Combo",
  "Control",
  "Midrange",
  "Tempo",
].map((value) => ({
  value,
  label: value,
}));

export const MAX_CARD_RATIO = 4;
export const TARGET_CARD_RATIO_TOTAL = 40;

export const SIDE_OPTIONS = [
  {
    value: "Plants",
    label: "Plants",
  },
  {
    value: "Zombies",
    label: "Zombies",
  },
];