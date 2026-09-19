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

export const CATEGORY_OPTIONS = ["Budget", "Competitive", "Ladder", "Meme"].map(
  (value) => ({
    value,
    label: value,
  }),
);

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

export const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#1b1f23",
    borderColor: state.isFocused ? "#8b949e" : "#3b4148",
    borderRadius: "8px",
    minHeight: "45px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(139, 148, 158, 0.12)" : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#646d76",
    },
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#1b1f23",
    border: "1px solid #3b4148",
    borderRadius: "12px",
    overflow: "hidden",
    zIndex: 100000,
  }),

  menuList: (base) => ({
    ...base,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#343b43"
      : state.isFocused
        ? "#2a3036"
        : "#1b1f23",
    color: "#f2f2f2",
    cursor: "pointer",
    padding: "10px 12px",
  }),

  valueContainer: (base) => ({
    ...base,
    gap: "6px",
    padding: "6px 8px",
    minWidth: 0,
    overflow: "hidden",
  }),

  multiValue: (base) => ({
    ...base,
    backgroundColor: "#303740",
    border: "1px solid #505a65",
    borderRadius: "999px",
    overflow: "hidden",
    margin: 0,
    maxWidth: "100%",
    flexShrink: 0,
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "#d7dce1",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "3px 4px 3px 10px",
    whiteSpace: "nowrap",
    overflow: "visible",
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "#aeb5bc",
    borderRadius: "0 999px 999px 0",
    padding: "3px 8px 3px 4px",
    flexShrink: 0,
    "&:hover": {
      backgroundColor: "#4a535d",
      color: "#ffffff",
    },
  }),

  singleValue: (base) => ({
    ...base,
    position: "static",
    transform: "none",
    maxWidth: "100%",
    width: "fit-content",
    minWidth: 0,
    overflow: "visible",
    textOverflow: "clip",
    whiteSpace: "nowrap",
    backgroundColor: "#303740",
    border: "1px solid #505a65",
    borderRadius: "999px",
    color: "#d7dce1",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "3px 10px",
    margin: 0,
    flexShrink: 1,
  }),

  placeholder: (base) => ({
    ...base,
    color: "#7d858e",
    fontSize: "0.9rem",
  }),

  input: (base) => ({
    ...base,
    color: "#ffffff",
    margin: 0,
    padding: 0,
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base) => ({
    ...base,
    color: "#737b84",
    padding: "8px",
    flexShrink: 0,
    "&:hover": {
      color: "#c7cbd1",
    },
  }),

  clearIndicator: (base) => ({
    ...base,
    color: "#aeb5bc",
    padding: "0",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    flexShrink: 0,
    "&:hover": {
      backgroundColor: "#4a535d",
      color: "#ffffff",
    },
  }),
};
