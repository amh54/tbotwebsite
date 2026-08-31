import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { calculateDeckCost } from "../utils/deckCost";
import Select from "react-select";
import "../css/adminmodal.css";
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

const normalizeCardType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const valuesToOptions = (value) =>
  String(value ?? "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      value: item,
      label: item,
    }));

const optionsToCombinedValue = (options) =>
  (options || [])
    .map((option) => String(option?.value || "").trim())
    .filter(Boolean)
    .join(" ");

const parseCardRatioLines = (value) =>
  String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, countPart] = line.split("|");
      const name = String(namePart || "").trim();
      const parsedCount = Number(countPart);
      const count =
        Number.isFinite(parsedCount) && parsedCount > 0
          ? Math.min(parsedCount, MAX_CARD_RATIO)
          : 1;

      return {
        name,
        count,
      };
    })
    .filter((entry) => entry.name);

const cardRatioLinesToOptions = (value, options = []) => {
  const optionMap = new Map(
    options.map((option) => [
      String(option.value).trim().toLowerCase(),
      option,
    ]),
  );

  return parseCardRatioLines(value)
    .map((entry) => {
      const matched = optionMap.get(entry.name.toLowerCase());

      if (!matched) {
        return null;
      }

      return {
        ...matched,
        count: entry.count,
      };
    })
    .filter(Boolean);
};

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

    return (
      hostname === "docs.google.com" ||
      hostname.endsWith(".docs.google.com") ||
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "word.office.com" ||
      hostname === "office.com" ||
      hostname.endsWith(".office.com") ||
      hostname === "1drv.ms" ||
      hostname.endsWith(".sharepoint.com")
    );
  } catch {
    return false;
  }
};

const getDeckIdentity = (deck) =>
  String(
    deck?.deckid ??
      deck?.deckID ??
      deck?.id ??
      deck?.deck_id ??
      deck?.name ??
      "",
  );

const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function AdminModalField({ label, value, onChange, type = "text" }) {
  return (
    <label className="admin-modal-field">
      <span className="admin-modal-label">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AdminModalTextArea({ label, value, onChange }) {
  return (
    <label className="admin-modal-field admin-modal-textarea-field">
      {label && <span className="admin-modal-label">{label}</span>}
      <textarea
        className="admin-modal-textarea"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
      />
    </label>
  );
}

function CardRatioEditor({ options, onChange, disabled, total }) {
  if (!options?.length) {
    return null;
  }

  return (
    <div className="admin-modal-field admin-modal-cards-ratio">
      <span className="admin-modal-label">
        Card Ratios (must total {TARGET_CARD_RATIO_TOTAL})
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
    </div>
  );
}

const EditDeckModal = forwardRef(function EditDeckModal(
  {
    deck,
    allCards = [],
    onSave,
    onComplete,
    imageFile,
    imageUrl,
    onSavingChange,
  },
  ref,
) {
  const [cardsError, setCardsError] = useState("");
  const cardsInitializedRef = useRef(false);
  const initializedDeckRef = useRef("");
  const originalFormRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    hero: "",
    side: "",
    category: "",
    archetype: "",
    description: "",
    image: "",
    creator: "",
    cost: "",
    inspiration: "",
    optimization: "",
    deck_doc: "",
    cards: "",
    suggested_date: "",
    categorySelected: [],
    archetypeSelected: [],
    cardsSelected: [],
  });

  const deckIdentity = getDeckIdentity(deck);

  useEffect(() => {
    if (!deck) {
      initializedDeckRef.current = "";
      cardsInitializedRef.current = false;
      originalFormRef.current = null;
      return;
    }

    if (initializedDeckRef.current === deckIdentity && deckIdentity !== "") {
      return;
    }

    initializedDeckRef.current = deckIdentity;
    cardsInitializedRef.current = false;
    setCardsError("");

    const initialForm = {
      name: deck?.name ?? "",
      hero: deck?.hero ?? "",
      side: normalizeSide(deck?.side ?? ""),
      category: deck?.category ?? "",
      archetype: deck?.archetype ?? "",
      description: deck?.description ?? "",
      image: deck?.image ?? "",
      creator: deck?.creator ?? "",
      cost: deck?.cost ?? "",
      inspiration: deck?.inspiration ?? "",
      optimization: deck?.optimization ?? "",
      deck_doc: deck?.deck_doc ?? "",
      cards: deck?.cards ?? "",
      suggested_date: deck?.suggested_date ?? "",
      categorySelected: valuesToOptions(deck?.category ?? ""),
      archetypeSelected: valuesToOptions(deck?.archetype ?? ""),
      cardsSelected: [],
    };

    originalFormRef.current = {
      name: String(initialForm.name ?? "").trim(),
      hero: String(initialForm.hero ?? "").trim(),
      side: normalizeSide(initialForm.side),
      category: optionsToCombinedValue(initialForm.categorySelected),
      archetype: optionsToCombinedValue(initialForm.archetypeSelected),
      description: String(initialForm.description ?? ""),
      image: String(initialForm.image ?? "").trim(),
      creator: String(initialForm.creator ?? "").trim(),
      cost: String(initialForm.cost ?? ""),
      inspiration: String(initialForm.inspiration ?? ""),
      optimization: String(initialForm.optimization ?? ""),
      deck_doc: String(initialForm.deck_doc ?? "").trim(),
      cards: String(initialForm.cards ?? "").trim(),
      suggested_date: String(initialForm.suggested_date ?? "").trim(),
    };

    setForm(initialForm);
  }, [deck, deckIdentity]);

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    setForm((previous) => {
      if (previous.image === imageUrl) {
        return previous;
      }

      return {
        ...previous,
        image: imageUrl,
      };
    });
  }, [imageUrl]);

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
        card,
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

  useEffect(() => {
    if (!deck || !cardOptions.length) {
      return;
    }

    if (cardsInitializedRef.current) {
      return;
    }

    const loadedCards = cardRatioLinesToOptions(deck.cards ?? "", cardOptions);

    const cardsValue = cardOptionsToRatioLines(loadedCards);

    setForm((previous) => ({
      ...previous,
      cardsSelected: loadedCards,
      cards: cardsValue,
    }));

    cardsInitializedRef.current = true;
  }, [deck, cardOptions]);

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

  const handleChange = useCallback((field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: field === "side" ? normalizeSide(value) : value,
    }));
  }, []);

  const handleSideChange = useCallback((selected) => {
    const value = normalizeSide(selected?.value || "");

    cardsInitializedRef.current = true;

    setForm((previous) => ({
      ...previous,
      side: value,
      hero: "",
      cardsSelected: [],
      cards: "",
    }));

    setCardsError("");
  }, []);

  const handleHeroChange = useCallback((selected) => {
    cardsInitializedRef.current = true;

    setForm((previous) => ({
      ...previous,
      hero: selected?.value || "",
      cardsSelected: [],
      cards: "",
    }));

    setCardsError("");
  }, []);

  const handleCategoryChange = useCallback((selected) => {
    const options = selected || [];

    setForm((previous) => ({
      ...previous,
      categorySelected: options,
      category: optionsToCombinedValue(options),
    }));
  }, []);

  const handleArchetypeChange = useCallback((selected) => {
    const options = selected || [];

    setForm((previous) => ({
      ...previous,
      archetypeSelected: options,
      archetype: optionsToCombinedValue(options),
    }));
  }, []);

  const handleCardsChange = useCallback((selected) => {
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
        cards: cardOptionsToRatioLines(nextSelected),
      };
    });

    setCardsError("");
  }, []);

  const handleCardRatioChange = useCallback((cardValue, delta) => {
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

      const currentCount = Number(cardsSelected[index].count) || 1;
      const nextCount = currentCount + delta;

      if (nextCount < 1) {
        const nextSelected = cardsSelected.filter((_, i) => i !== index);

        return {
          ...previous,
          cardsSelected: nextSelected,
          cards: cardOptionsToRatioLines(nextSelected),
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
        cards: cardOptionsToRatioLines(nextSelected),
      };
    });

    setCardsError("");
  }, []);

  const hasActualChanges = useCallback((payload) => {
    const original = originalFormRef.current;

    if (!original) {
      return true;
    }

    return (
      String(payload.name ?? "").trim() !== original.name ||
      String(payload.hero ?? "").trim() !== original.hero ||
      normalizeSide(payload.side) !== original.side ||
      String(payload.category ?? "").trim() !== original.category ||
      String(payload.archetype ?? "").trim() !== original.archetype ||
      String(payload.description ?? "") !== original.description ||
      String(payload.image ?? "").trim() !== original.image ||
      String(payload.creator ?? "").trim() !== original.creator ||
      String(payload.inspiration ?? "") !== original.inspiration ||
      String(payload.optimization ?? "") !== original.optimization ||
      String(payload.deck_doc ?? "").trim() !== original.deck_doc ||
      String(payload.cards ?? "").trim() !== original.cards ||
      String(payload.cost ?? "") !== String(original.cost ?? "")
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (typeof onSave !== "function") {
      setCardsError("Save handler is unavailable.");
      return null;
    }

    if (!isValidDeckTutorialUrl(form.deck_doc)) {
      setCardsError(
        "Tutorial URL must be a Google Docs, Word, or YouTube link.",
      );
      return null;
    }

    if (!normalizedFormSide) {
      setCardsError("Please select Plants or Zombies.");
      return null;
    }

    if (!form.hero) {
      setCardsError("Please select a hero.");
      return null;
    }

    if (!form.cardsSelected?.length) {
      setCardsError("Please select at least one card.");
      return null;
    }

    const ratioTotal = sumCardRatios(form.cardsSelected);

    if (ratioTotal !== TARGET_CARD_RATIO_TOTAL) {
      setCardsError(
        `Card ratios must add up to ${TARGET_CARD_RATIO_TOTAL} (currently ${ratioTotal}).`,
      );
      return null;
    }

    setCardsError("");

    try {
      onSavingChange?.(true);

      const hasNewImage = imageFile instanceof File;

      const validCards = form.cardsSelected.filter((option) =>
        cardOptions.some(
          (cardOption) =>
            String(cardOption.value).toLowerCase() ===
            String(option?.value || "").toLowerCase(),
        ),
      );

      const cardsValue = cardOptionsToRatioLines(validCards);

      const payload = {
        name: form.name ?? "",
        hero: form.hero ?? "",
        side: normalizedFormSide,
        category: optionsToCombinedValue(form.categorySelected),
        archetype: optionsToCombinedValue(form.archetypeSelected),
        description: form.description ?? "",
        image: hasNewImage ? "" : String(imageUrl ?? form.image ?? "").trim(),
        image_file: hasNewImage ? imageFile : null,
        creator: form.creator ?? "",
        cost: String(calculatedDeckCost),
        inspiration: form.inspiration ?? "",
        optimization: form.optimization ?? "",
        deck_doc: form.deck_doc ?? "",
        cards: cardsValue,
        suggested_date: String(
          originalFormRef.current?.suggested_date ?? deck?.suggested_date ?? "",
        ).trim(),
      };

      const changed = hasActualChanges(payload);

      if (changed) {
        payload.updated_date = getTodayDate();
      } else if (deck?.updated_date) {
        payload.updated_date = deck.updated_date;
      }

      const result = await onSave(deck, payload);

      if (!result) {
        setCardsError("The server did not return an updated deck.");
        return null;
      }

      if (typeof onComplete === "function") {
        onComplete(result);
      }

      return result;
    } catch (error) {
      console.error("Failed to save deck:", error);
      setCardsError(error?.message || "Failed to save deck.");
      return null;
    } finally {
      onSavingChange?.(false);
    }
  }, [
    onSave,
    onComplete,
    onSavingChange,
    deck,
    imageFile,
    imageUrl,
    form,
    cardOptions,
    normalizedFormSide,
    calculatedDeckCost,
    hasActualChanges,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
    }),
    [handleSave],
  );

  if (!deck) {
    return null;
  }

  return (
    <div className="edit-deck-fields">
      <div className="modal-info">
        <div className="modal-header">
          <div className="modal-title-content">
            <AdminModalField
              label="Deck Name"
              value={form.name}
              onChange={(value) => handleChange("name", value)}
            />
          </div>
        </div>

        <section className="modal-section">
          <h3>Deck Setup</h3>

          <div className="modal-metadata">
            <div className="admin-modal-field">
              <span className="admin-modal-label">Side</span>

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
            </div>

            <div className="admin-modal-field">
              <span className="admin-modal-label">Hero</span>

              <Select
                className="admin-modal-single-select"
                classNamePrefix="admin-select"
                options={heroOptions}
                value={selectedHero}
                onChange={handleHeroChange}
                placeholder={
                  normalizedFormSide ? "Select hero..." : "Select side first..."
                }
                isClearable
                isDisabled={!normalizedFormSide}
                isSearchable
                styles={selectStyles}
              />
            </div>

            <div className="admin-modal-field">
              <span className="admin-modal-label">Category</span>

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
            </div>

            <div className="admin-modal-field">
              <span className="admin-modal-label">Archetype</span>

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
            </div>
          </div>
        </section>

        <section className="modal-section description-section">
          <h3>Description</h3>

          <AdminModalTextArea
            value={form.description}
            onChange={(value) => handleChange("description", value)}
          />
        </section>

        <section className="modal-metadata">
          <AdminModalField
            label="Creator"
            value={form.creator}
            onChange={(value) => handleChange("creator", value)}
          />

          <AdminModalField
            label="Optimization"
            value={form.optimization}
            onChange={(value) => handleChange("optimization", value)}
          />

          <AdminModalField
            label="Inspiration"
            value={form.inspiration}
            onChange={(value) => handleChange("inspiration", value)}
          />

          <AdminModalField
            label="Deck Tutorial URL"
            value={form.deck_doc}
            onChange={(value) => handleChange("deck_doc", value)}
          />

          <div className="admin-modal-field admin-modal-cards-field">
            <span className="admin-modal-label">
              Cards
              {form.hero && selectedHeroClasses.length > 0
                ? ` — ${selectedHeroClasses.join(" / ")}`
                : ""}
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
          </div>

          <CardRatioEditor
            options={form.cardsSelected}
            onChange={handleCardRatioChange}
            disabled={false}
            total={totalCardRatio}
          />

          {cardsError && <div className="admin-modal-error">{cardsError}</div>}
        </section>
      </div>
    </div>
  );
});

export default EditDeckModal;
