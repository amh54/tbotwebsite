import { useEffect, useMemo, useState, useRef } from "react";
import Select from "react-select";
import { calculateDeckCost } from "../utils/deckCost";
import "../css/deckmodal.css";

const HERO_CLASSES = {
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

const CATEGORY_OPTIONS = ["Budget", "Competitive", "Ladder", "Meme"].map(
  (value) => ({
    value,
    label: value,
  }),
);

const ARCHETYPE_OPTIONS = [
  "Aggro",
  "Combo",
  "Control",
  "Midrange",
  "Tempo",
].map((value) => ({
  value,
  label: value,
}));
const MAX_CARD_RATIO = 4;
const TARGET_CARD_RATIO_TOTAL = 40;

const normalizeSide = (side) => {
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

const getCardSide = (card) => {
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
const scrollToError = (field) => {
  const element = document.querySelector(`[data-field="${field}"]`);

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.focus?.();
  }
};
const normalizeCardType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const optionsToCombinedValue = (options) =>
  (options || [])
    .map((option) => String(option?.value || "").trim())
    .filter(Boolean)
    .join(" ");

const cardOptionsToRatioLines = (options) =>
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

const sumCardRatios = (options) =>
  (options || []).reduce(
    (sum, option) => sum + (Number(option?.count) || 0),
    0,
  );

const isValidDeckTutorialUrl = (value) => {
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

    // Google Docs
    if (
      hostname === "docs.google.com" ||
      hostname.endsWith(".docs.google.com")
    ) {
      return true;
    }

    // YouTube
    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtu.be"
    ) {
      return true;
    }

    // Microsoft Word / Office
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

const selectStyles = {
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
const validationErrorStyle = {
  color: "#ff4d4d",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginTop: "6px",
};

const requiredLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const requiredStarStyle = {
  color: "#8b949e",
};

function RequiredLabel({ children }) {
  return (
    <span style={requiredLabelStyle}>
      {children}
      <span style={requiredStarStyle}>*</span>
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  error = "",
  type = "text",
}) {
  return (
    <label className="admin-modal-field">
      <span className="admin-modal-label">
        {required ? <RequiredLabel>{label}</RequiredLabel> : label}
      </span>

      <input
        data-field={label.toLowerCase()}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />

      {error && <span style={validationErrorStyle}>{error}</span>}
    </label>
  );
}

function TextArea({ label, value, onChange, required = false, error = "" }) {
  return (
    <label className="admin-modal-field admin-modal-textarea-field">
      {label && (
        <span className="admin-modal-label">
          {required ? <RequiredLabel>{label}</RequiredLabel> : label}
        </span>
      )}

      <textarea
        data-field={label.toLowerCase()}
        className="admin-modal-textarea"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
      />
      {error && <span style={validationErrorStyle}>{error}</span>}
    </label>
  );
}

function CardRatioEditor({ options, onChange, disabled, total, error }) {
  if (!options?.length) {
    return null;
  }

  return (
    <div className="admin-modal-field admin-modal-cards-ratio">
      <span className="admin-modal-label">
        <RequiredLabel>
          Card Ratios (must total {TARGET_CARD_RATIO_TOTAL})
        </RequiredLabel>
      </span>

      {options.map((option) => {
        const count = option.count ?? 1;

        return (
          <div className="admin-modal-ratio-row" key={option.value}>
            <span className="admin-modal-ratio-name">{option.label}</span>

            <button
              type="button"
              onClick={() => onChange(option.value, -1)}
              disabled={disabled}
              aria-label={`Decrease ${option.label} count`}
            >
              −
            </button>

            <span className="admin-modal-ratio-count">{count}</span>

            <button
              type="button"
              onClick={() => onChange(option.value, 1)}
              disabled={disabled || count >= MAX_CARD_RATIO}
              aria-label={`Increase ${option.label} count`}
            >
              +
            </button>
          </div>
        );
      })}

      <div
        className={`admin-modal-ratio-total ${
          total === TARGET_CARD_RATIO_TOTAL ? "is-valid" : "is-invalid"
        }`}
      >
        Total: {total} / {TARGET_CARD_RATIO_TOTAL}
      </div>

      {error && <div style={validationErrorStyle}>{error}</div>}
    </div>
  );
}

function DatePicker({
  label,
  value,
  onChange,
  pickerId,
  openPicker,
  setOpenPicker,
}) {
  const open = openPicker === pickerId;
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) return new Date(year, month - 1, day);
    }
    return new Date();
  });

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpenPicker(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        setViewDate(new Date(year, month - 1, 1));
      }
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i += 1) days.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day);

  const selectedDate = value
    ? (() => {
        const [y, m, d] = value.split("-").map(Number);
        return y && m && d ? new Date(y, m - 1, d) : null;
      })()
    : null;

  const today = new Date();

  const isSameDate = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const selectDay = (day) => {
    onChange(formatDate(new Date(year, month, day)));
    setOpenPicker(null);
  };

  return (
    <div className="admin-modal-field custom-date-picker" ref={wrapperRef}>
      <span className="admin-modal-label">{label}</span>

      <button
        type="button"
        className={`custom-date-input${open ? " is-open" : ""}${
          value ? " has-value" : ""
        }`}
        onClick={() =>
          setOpenPicker((current) => (current === pickerId ? null : pickerId))
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{displayValue || "Select date..."}</span>
        <span className="custom-date-calendar-icon" aria-hidden="true">
          📅
        </span>
      </button>

      {open && (
        <div className="custom-date-calendar" role="dialog" aria-label={label}>
          <div className="custom-date-calendar-header">
            <button
              type="button"
              className="custom-date-nav"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>

            <strong>
              {viewDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </strong>

            <button
              type="button"
              className="custom-date-nav"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="custom-date-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="custom-date-grid">
            {days.map((day, index) =>
              day === null ? (
                <span key={`empty-${index}`} className="custom-date-empty" />
              ) : (
                <button
                  key={day}
                  type="button"
                  className={`custom-date-day${
                    selectedDate &&
                    isSameDate(new Date(year, month, day), selectedDate)
                      ? " selected"
                      : ""
                  }${
                    isSameDate(new Date(year, month, day), today)
                      ? " today"
                      : ""
                  }`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <div className="custom-date-calendar-footer">
            <button
              type="button"
              className="custom-date-clear"
              onClick={() => {
                onChange("");
                setOpenPicker(null);
              }}
            >
              Clear
            </button>

            <button
              type="button"
              className="custom-date-today"
              onClick={() => {
                const current = new Date();

                onChange(formatDate(current));

                setViewDate(
                  new Date(current.getFullYear(), current.getMonth(), 1),
                );

                setOpenPicker(null);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const getTodayDate = () => {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
};
function AddDeckModal({
  open,
  allCards = [],
  onAdd,
  onClose,
  onComplete,
  isAdmin = false,
}) {
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    hero: "",
    side: "",
    category: "",
    archetype: "",
    description: "",
    image: "",
    image_file: null,

    // CREATOR IS REQUIRED
    creator: "",

    inspiration: "",
    optimization: "",
    suggested_date: "",
    deck_doc: "",
    cards: "",
    categorySelected: [],
    archetypeSelected: [],
    cardsSelected: [],
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValidationError(null);
    setImgError(false);
  }, [open]);

  const normalizedFormSide = normalizeSide(form.side);

  const heroOptions = useMemo(() => {
    const seen = new Set();
    const options = [];

    allCards.forEach((card) => {
      const rarity = String(
        card?.set_rarity ?? card?.setRarity ?? card?.rarity ?? "",
      )
        .trim()
        .toLowerCase();

      if (rarity !== "premium - hero") {
        return;
      }

      const cardSide = getCardSide(card);

      if (normalizedFormSide && cardSide !== normalizedFormSide) {
        return;
      }

      const name = String(
        card?.card_name ?? card?.title ?? card?.name ?? "",
      ).trim();

      if (!name) {
        return;
      }

      const key = name.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      options.push({
        value: name,
        label: name,
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [allCards, normalizedFormSide]);

  const selectedHeroClasses = useMemo(
    () => HERO_CLASSES[form.hero] || [],
    [form.hero],
  );

  const cardOptions = useMemo(() => {
    if (normalizedFormSide !== "Plants" && normalizedFormSide !== "Zombies") {
      return [];
    }

    if (!form.hero) {
      return [];
    }

    const heroClasses = selectedHeroClasses.map(normalizeCardType);

    if (!heroClasses.length) {
      return [];
    }

    const seen = new Set();
    const options = [];

    allCards.forEach((card) => {
      const name = String(
        card?.card_name ?? card?.title ?? card?.name ?? "",
      ).trim();

      if (!name) {
        return;
      }

      const rarity = String(
        card?.set_rarity ?? card?.setRarity ?? card?.rarity ?? "",
      )
        .trim()
        .toLowerCase();

      if (rarity === "premium - hero") {
        return;
      }

      if (rarity.includes("token")) {
        return;
      }

      const description = String(card?.description ?? "")
        .trim()
        .toLowerCase();

      if (description.includes("superpower")) {
        return;
      }

      if (getCardSide(card) !== normalizedFormSide) {
        return;
      }

      const cardTypes = String(
        card?.card_type ?? card?.cardType ?? card?.type ?? "",
      )
        .split(/[,&/|]+/)
        .map(normalizeCardType)
        .filter(Boolean);

      if (!cardTypes.some((type) => heroClasses.includes(type))) {
        return;
      }

      const key = name.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      options.push({
        value: name,
        label: name,
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [allCards, normalizedFormSide, form.hero, selectedHeroClasses]);

  const totalCardRatio = useMemo(
    () => sumCardRatios(form.cardsSelected),
    [form.cardsSelected],
  );

  const calculatedDeckCost = useMemo(
    () => calculateDeckCost(form.cardsSelected, allCards),
    [form.cardsSelected, allCards],
  );
  const selectedHero =
    heroOptions.find(
      (option) =>
        option.value.toLowerCase() ===
        String(form.hero || "")
          .trim()
          .toLowerCase(),
    ) || null;

  const selectedSide = normalizedFormSide
    ? {
        value: normalizedFormSide,
        label: normalizedFormSide,
      }
    : null;

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: field === "side" ? normalizeSide(value) : value,
    }));

    setValidationError((current) =>
      current?.field === field ? null : current,
    );
  };

  const handleSideChange = (selected) => {
    const value = normalizeSide(selected?.value || "");

    setForm((previous) => ({
      ...previous,
      side: value,
      hero: "",
      cardsSelected: [],
      cards: "",
    }));

    setValidationError(null);
  };

  const handleHeroChange = (selected) => {
    setForm((previous) => ({
      ...previous,
      hero: selected?.value || "",
      cardsSelected: [],
      cards: "",
    }));

    setValidationError(null);
  };

  const handleCategoryChange = (selected) => {
    const options = selected || [];

    setForm((previous) => ({
      ...previous,
      categorySelected: options,
      category: optionsToCombinedValue(options),
    }));

    setValidationError(null);
  };

  const handleArchetypeChange = (selected) => {
    const options = selected || [];

    setForm((previous) => ({
      ...previous,
      archetypeSelected: options,
      archetype: optionsToCombinedValue(options),
    }));

    setValidationError(null);
  };

  const handleCardsChange = (selected) => {
    setForm((previous) => {
      const previousCounts = new Map(
        (previous.cardsSelected || []).map((option) => [
          String(option.value).toLowerCase(),
          option.count,
        ]),
      );

      const nextSelected = (selected || []).map((option) => ({
        ...option,
        count: previousCounts.get(String(option.value).toLowerCase()) ?? 1,
      }));

      return {
        ...previous,
        cardsSelected: nextSelected,
      };
    });

    setValidationError(null);
  };

  const handleCardRatioChange = (cardValue, delta) => {
    setForm((previous) => {
      const cardsSelected = previous.cardsSelected || [];

      const index = cardsSelected.findIndex(
        (option) =>
          String(option.value).toLowerCase() ===
          String(cardValue).toLowerCase(),
      );

      if (index === -1) {
        return previous;
      }

      const currentCount = cardsSelected[index].count ?? 1;

      const nextCount = currentCount + delta;

      if (nextCount < 1) {
        return {
          ...previous,
          cardsSelected: cardsSelected.filter((_, i) => i !== index),
        };
      }

      if (nextCount > MAX_CARD_RATIO) {
        return previous;
      }

      const nextSelected = [...cardsSelected];

      nextSelected[index] = {
        ...nextSelected[index],
        count: nextCount,
      };

      return {
        ...previous,
        cardsSelected: nextSelected,
      };
    });

    setValidationError(null);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setImgError(false);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";

      setValidationError({
        field: "image",
        message: "Please select a valid image file.",
      });

      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((previous) => ({
      ...previous,
      image_file: file,
      image: previewUrl,
    }));

    setValidationError((current) =>
      current?.field === "image" ? null : current,
    );
  };

  const validateForm = () => {
    if (!String(form.name || "").trim()) {
      return {
        field: "name",
        message: "Deck name is required.",
      };
    }

    if (
      !(form.image_file instanceof File) &&
      !String(form.image || "").trim()
    ) {
      return {
        field: "image",
        message: "Deck image is required.",
      };
    }

    if (!normalizedFormSide) {
      return {
        field: "side",
        message: "Please select Plants or Zombies.",
      };
    }

    if (!String(form.hero || "").trim()) {
      return {
        field: "hero",
        message: "Please select a hero.",
      };
    }

    if (!form.categorySelected?.length) {
      return {
        field: "category",
        message: "Please select at least one category.",
      };
    }

    if (!form.archetypeSelected?.length) {
      return {
        field: "archetype",
        message: "Please select at least one archetype.",
      };
    }

    if (!String(form.description || "").trim()) {
      return {
        field: "description",
        message: "Deck description is required.",
      };
    }

    if (!isValidDeckTutorialUrl(form.deck_doc)) {
      return {
        field: "deck tutorial url",
        message:
          "Tutorial URL must be a Google Docs, Microsoft Word, or YouTube link.",
      };
    }
    const creator = String(form.creator ?? "").trim();

    if (!creator) {
      return {
        field: "creator",
        message: "Creator is required.",
      };
    }

    if (!form.cardsSelected?.length) {
      return {
        field: "cards",
        message: "Please select at least one card.",
      };
    }

    const ratioTotal = sumCardRatios(form.cardsSelected);

    if (ratioTotal !== TARGET_CARD_RATIO_TOTAL) {
      return {
        field: "cards",
        message: `Card ratios must total ${TARGET_CARD_RATIO_TOTAL}. Currently ${ratioTotal}.`,
      };
    }

    return null;
  };

  const handleSave = async () => {
    if (typeof onAdd !== "function") {
      console.error("onAdd was not provided.");

      setValidationError({
        field: "save",
        message: "Unable to add deck.",
      });

      return;
    }

    const error = validateForm();

    if (error) {
      setValidationError(error);

      setTimeout(() => {
        scrollToError(error.field);
      }, 100);

      return;
    }

    setValidationError(null);

    try {
      setSaving(true);
      const hasNewImage = form.image_file instanceof File;
      const creator = String(form.creator ?? "").trim();
      if (!creator) {
        setValidationError({
          field: "creator",
          message: "Creator is required.",
        });

        setSaving(false);
        return;
      }

      const payload = {
        name: String(form.name ?? "").trim(),
        hero: String(form.hero ?? "").trim(),
        side: normalizedFormSide,

        category: optionsToCombinedValue(form.categorySelected),

        archetype: optionsToCombinedValue(form.archetypeSelected),

        description: String(form.description ?? "").trim(),

        image: hasNewImage ? "" : String(form.image || "").trim(),

        image_file: hasNewImage ? form.image_file : null,
        creator,
        cost: Number(calculatedDeckCost),

        inspiration: String(form.inspiration ?? "").trim(),

        optimization: String(form.optimization ?? "").trim(),

        suggested_date: isAdmin
          ? String(form.suggested_date ?? "").trim()
          : getTodayDate(),

        deck_doc: String(form.deck_doc ?? "").trim(),

        cards: cardOptionsToRatioLines(form.cardsSelected),
      };

      const result = await onAdd(payload);

      if (!result) {
        return;
      }

      if (typeof onComplete === "function") {
        onComplete(result);
      }
    } catch (error) {
      console.error("Failed to add deck:", error);

      setValidationError({
        field: "save",
        message: error?.message || "Failed to add deck.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  const fieldError = (field) =>
    validationError?.field === field ? validationError.message : "";

  return (
    <div className="modal-overlay">
      <dialog
        open
        className="modal"
        aria-label="Add Deck"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close add deck"
        >
          ×
        </button>

        <div className="modal-scroll-content">
          <div className="modal-content">
            <div className="modal-image">
              {form.image && !imgError ? (
                <img
                  src={form.image}
                  alt={form.name || "Deck image"}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="deck-image-placeholder">No image</div>
              )}

              <label className="admin-modal-field">
                <span className="admin-modal-label">
                  <RequiredLabel>Upload Image</RequiredLabel>
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageFileChange}
                  disabled={saving}
                />

                {fieldError("image") && (
                  <span style={validationErrorStyle}>
                    {fieldError("image")}
                  </span>
                )}
              </label>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-edit"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-modal-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Adding..." : "Add Deck"}
                </button>
              </div>

              {fieldError("save") && (
                <div
                  style={{
                    ...validationErrorStyle,
                    textAlign: "center",
                    marginTop: "10px",
                  }}
                >
                  {fieldError("save")}
                </div>
              )}
            </div>

            <div className="modal-info">
              <div className="modal-header">
                <div className="modal-title-content">
                  <TextField
                    label="Deck Name"
                    value={form.name}
                    onChange={(value) => handleChange("name", value)}
                    required
                    error={fieldError("name")}
                  />
                </div>
              </div>

              <section className="modal-section">
                <h3>Deck Setup</h3>

                <div className="modal-metadata">
                  <div className="admin-modal-field" data-field="side">
                    <span className="admin-modal-label">
                      <RequiredLabel>Side</RequiredLabel>
                    </span>

                    <Select
                      className="admin-modal-single-select"
                      classNamePrefix="admin-select"
                      options={[
                        {
                          value: "Plants",
                          label: "Plants",
                        },
                        {
                          value: "Zombies",
                          label: "Zombies",
                        },
                      ]}
                      value={selectedSide}
                      onChange={handleSideChange}
                      placeholder="Select side..."
                      isClearable
                      styles={selectStyles}
                      isDisabled={saving}
                    />

                    {fieldError("side") && (
                      <span style={validationErrorStyle}>
                        {fieldError("side")}
                      </span>
                    )}
                  </div>

                  <div className="admin-modal-field" data-field="hero">
                    <span className="admin-modal-label">
                      <RequiredLabel>Hero</RequiredLabel>
                    </span>

                    <Select
                      className="admin-modal-single-select"
                      classNamePrefix="admin-select"
                      options={heroOptions}
                      value={selectedHero}
                      onChange={handleHeroChange}
                      placeholder={
                        normalizedFormSide
                          ? "Select hero..."
                          : "Select side first..."
                      }
                      isClearable
                      isDisabled={!normalizedFormSide || saving}
                      isSearchable
                      styles={selectStyles}
                    />

                    {fieldError("hero") && (
                      <span style={validationErrorStyle}>
                        {fieldError("hero")}
                      </span>
                    )}
                  </div>

                  <div className="admin-modal-field" data-field="category">
                    <span className="admin-modal-label">
                      <RequiredLabel>Category</RequiredLabel>
                    </span>

                    <Select
                      classNamePrefix="admin-select"
                      isMulti
                      options={CATEGORY_OPTIONS}
                      value={form.categorySelected}
                      onChange={handleCategoryChange}
                      placeholder="Select categories..."
                      styles={selectStyles}
                      closeMenuOnSelect={false}
                      isSearchable
                      isDisabled={saving}
                    />

                    {fieldError("category") && (
                      <span style={validationErrorStyle}>
                        {fieldError("category")}
                      </span>
                    )}
                  </div>

                  <div className="admin-modal-field" data-field="archetype">
                    <span className="admin-modal-label">
                      <RequiredLabel>Archetype</RequiredLabel>
                    </span>

                    <Select
                      classNamePrefix="admin-select"
                      isMulti
                      options={ARCHETYPE_OPTIONS}
                      value={form.archetypeSelected}
                      onChange={handleArchetypeChange}
                      placeholder="Select archetypes..."
                      styles={selectStyles}
                      closeMenuOnSelect={false}
                      isSearchable
                      isDisabled={saving}
                    />

                    {fieldError("archetype") && (
                      <span style={validationErrorStyle}>
                        {fieldError("archetype")}
                      </span>
                    )}
                  </div>
                </div>

                <section
                  className="modal-section description-section"
                  data-field="description"
                >
                  <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(value) => handleChange("description", value)}
                    required
                    error={fieldError("description")}
                  />
                </section>

                <section className="modal-metadata">
                  <TextField
                    label="Creator"
                    value={form.creator}
                    onChange={(value) => handleChange("creator", value)}
                    required
                    error={fieldError("creator")}
                  />

                  <TextField
                    label="Optimization"
                    value={form.optimization}
                    onChange={(value) => handleChange("optimization", value)}
                  />

                  <TextField
                    label="Inspiration"
                    value={form.inspiration}
                    onChange={(value) => handleChange("inspiration", value)}
                  />

                  {isAdmin && (
                    <>
                      <DatePicker
                        label="Suggested Date"
                        value={form.suggested_date}
                        onChange={(value) =>
                          handleChange("suggested_date", value)
                        }
                        pickerId="suggested"
                        openPicker={openDatePicker}
                        setOpenPicker={setOpenDatePicker}
                      />

                    </>
                  )}

                  <TextField
                    label="Deck Tutorial URL"
                    value={form.deck_doc}
                    onChange={(value) => handleChange("deck_doc", value)}
                    error={fieldError("deck tutorial url")}
                  />

                  <div
                    className="admin-modal-field admin-modal-cards-field"
                    data-field="cards"
                  >
                    <span className="admin-modal-label">
                      <RequiredLabel>
                        Cards
                        {form.hero && selectedHeroClasses.length > 0
                          ? ` — ${selectedHeroClasses.join(" / ")}`
                          : ""}
                      </RequiredLabel>
                    </span>

                    <Select
                      classNamePrefix="deck-cards-select"
                      isMulti
                      options={cardOptions}
                      value={form.cardsSelected}
                      onChange={handleCardsChange}
                      placeholder={
                        !normalizedFormSide
                          ? "Select side first..."
                          : !form.hero
                            ? "Select hero first..."
                            : "Search cards..."
                      }
                      styles={selectStyles}
                      closeMenuOnSelect={false}
                      isSearchable
                      isDisabled={!normalizedFormSide || !form.hero || saving}
                    />

                    {!form.cardsSelected?.length && fieldError("cards") && (
                      <div style={validationErrorStyle}>
                        {fieldError("cards")}
                      </div>
                    )}
                  </div>

                  {form.cardsSelected?.length > 0 && (
                    <CardRatioEditor
                      options={form.cardsSelected}
                      onChange={handleCardRatioChange}
                      disabled={saving}
                      total={totalCardRatio}
                      error={fieldError("cards")}
                    />
                  )}
                </section>
              </section>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default AddDeckModal;
