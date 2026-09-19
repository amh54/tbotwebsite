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

export const scrollToError = (field) => {
  const element = document.querySelector(`[data-field="${field}"]`);

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.focus?.();
  }
};

export const normalizeCardType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const optionsToCombinedValue = (options) =>
  (options || [])
    .map((option) => String(option?.value || "").trim())
    .filter(Boolean)
    .join(" ");

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

    if (
      hostname === "docs.google.com" ||
      hostname.endsWith(".docs.google.com")
    ) {
      return true;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtu.be"
    ) {
      return true;
    }

    if (
      hostname === "word.office.com" ||
      hostname === "office.com" ||
      hostname.endsWith(".office.com") ||
      hostname === "1drv.ms" ||
      hostname.endsWith(".sharepoint.com")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const getTodayDate = () => {
  const today = new Date();

  return `${String(today.getMonth() + 1).padStart(2, "0")}/${String(
    today.getDate(),
  ).padStart(2, "0")}/${today.getFullYear()}`;
};

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

export const validationErrorStyle = {
  color: "#ff4d4d",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginTop: "6px",
};
