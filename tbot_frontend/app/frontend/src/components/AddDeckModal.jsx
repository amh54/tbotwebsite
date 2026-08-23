import { useEffect, useMemo, useState } from "react";
import Select from "react-select";

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
  "Z-mech": ["Crazy", "Hearty"],
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

function AddDeckModal({ open, allCards = [], onAdd, onClose, onComplete }) {
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
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
    creator: "",
    cost: "",
    inspiration: "",
    optimization: "",
    suggested_date: "",
    updated_date: "",
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

    if (!form.hero) {
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
    const costString = String(form.cost ?? "").trim();

    if (!costString) {
      return {
        field: "cost",
        message: "Deck cost is required.",
      };
    }

    const numericCost = Number(costString);

    if (!Number.isFinite(numericCost) || numericCost < 0) {
      return {
        field: "cost",
        message: "Deck cost must be a valid number.",
      };
    }

    /*
     * CREATOR IS REQUIRED.
     */
    if (!String(form.creator || "").trim()) {
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
      return;
    }

    setValidationError(null);

    try {
      setSaving(true);

      const hasNewImage = form.image_file instanceof File;

      const payload = {
        name: form.name ?? "",
        hero: form.hero ?? "",
        side: normalizedFormSide,

        category: optionsToCombinedValue(form.categorySelected),

        archetype: optionsToCombinedValue(form.archetypeSelected),

        description: form.description ?? "",

        image: hasNewImage ? "" : String(form.image || "").trim(),

        image_file: hasNewImage ? form.image_file : null,
        creator: String(form.creator ?? "").trim(),

        cost: Number(form.cost),

        inspiration: form.inspiration ?? "",

        optimization: form.optimization ?? "",

        suggested_date: form.suggested_date ?? "",

        updated_date: form.updated_date ?? "",

        deck_doc: form.deck_doc ?? "",

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
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
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
                  <div className="admin-modal-field">
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
                    />

                    {fieldError("side") && (
                      <span style={validationErrorStyle}>
                        {fieldError("side")}
                      </span>
                    )}
                  </div>

                  <div className="admin-modal-field">
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
                      isDisabled={!normalizedFormSide}
                      isSearchable
                      styles={selectStyles}
                    />

                    {fieldError("hero") && (
                      <span style={validationErrorStyle}>
                        {fieldError("hero")}
                      </span>
                    )}
                  </div>

                  <div className="admin-modal-field">
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
                    />

                    {fieldError("category") && (
                      <span style={validationErrorStyle}>
                        {fieldError("category")}
                      </span>
                    )}
                  </div>

                  <div className="admin-modal-field">
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
                    />

                    {fieldError("archetype") && (
                      <span style={validationErrorStyle}>
                        {fieldError("archetype")}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section className="modal-section description-section">
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
                  label="Cost"
                  type="number"
                  value={form.cost}
                  onChange={(value) => handleChange("cost", value)}
                  required
                  error={fieldError("cost")}
                />
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

                <TextField
                  label="Suggested Date"
                  value={form.suggested_date}
                  onChange={(value) => handleChange("suggested_date", value)}
                />

                <TextField
                  label="Updated Date"
                  value={form.updated_date}
                  onChange={(value) => handleChange("updated_date", value)}
                />
                <TextField
                  label="Deck Tutorial URL"
                  value={form.deck_doc}
                  onChange={(value) => handleChange("deck_doc", value)}
                />
                <div className="admin-modal-field admin-modal-cards-field">
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
                    isDisabled={!normalizedFormSide || !form.hero}
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
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default AddDeckModal;
