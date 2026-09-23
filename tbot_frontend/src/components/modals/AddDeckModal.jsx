import { useEffect, useMemo, useState } from "react";

import Select from "react-select";

import { calculateDeckCost } from "../../utils/deckCost";

import "../../css/deckmodal.css";

import CardRatioEditor from "../../components/admin/CardRatioEditor";
import DatePicker from "../../components/admin/DatePicker";
import RequiredLabel from "../../components/admin/RequiredLabel";
import TextArea from "../../components/admin/TextArea";
import TextField from "../../components/admin/TextField";

import {
  ARCHETYPE_OPTIONS,
  CATEGORY_OPTIONS,
  HERO_CLASSES,
  MAX_CARD_RATIO,
  SIDE_OPTIONS,
  TARGET_CARD_RATIO_TOTAL,
} from "../../utils/addDeckModalConstants";

import {
  cardOptionsToRatioLines,
  getCardSide,
  getTodayDate,
  isValidDeckTutorialUrl,
  normalizeCardType,
  normalizeSide,
  optionsToCombinedValue,
  scrollToError,
  selectStyles,
  sumCardRatios,
  validationErrorStyle,
} from "../../utils/addDeckModalUtils";

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
          ? (() => {
              const value = String(form.suggested_date ?? "").trim();

              if (!value) {
                return "";
              }

              const [year, month, day] = value.split("-");

              return `${Number(month)}/${Number(
                day,
              )}/${String(year).slice(-2)}`;
            })()
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
                  <RequiredLabel>Please Upload screenshot of a deck built in game </RequiredLabel>
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
                      options={SIDE_OPTIONS}
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
