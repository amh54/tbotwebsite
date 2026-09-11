import { useCallback, useEffect, useMemo, useState } from "react";

import Select from "react-select";

import { Link } from "react-router-dom";

import AddCardsModal from "../components/modals/AddCardsModal.jsx";

import Footer from "../components/footer";

import "../css/cardinfo.css";
import "../css/cardmanager.css";
import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

const MAX_QUANTITY = 4;

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const removeDiscordEmojis = (value) =>
  String(value ?? "").replace(/<a?:[^:>]+:\d+>/gi, "");

const normalizeClassName = (className) => {
  const value = removeDiscordEmojis(className)
    .replace(/[\_\~\`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = normalizeText(value);

  const canonicalClasses = {
    guardian: "Guardian",
    kabloom: "Kabloom",
    megagrow: "Mega-Grow",
    "mega-grow": "Mega-Grow",
    smarty: "Smarty",
    solar: "Solar",
    beastly: "Beastly",
    brainy: "Brainy",
    crazy: "Crazy",
    hearty: "Hearty",
    sneaky: "Sneaky",
  };

  return canonicalClasses[normalized] || value;
};

const getClassNames = (classes) => {
  if (!classes) {
    return [];
  }

  return [
    ...new Set(
      String(classes)
        .split(/[,|;]/)
        .map((className) => normalizeClassName(className))
        .filter(Boolean),
    ),
  ];
};

const getCardTypes = (card) => {
  const types = [];

  const addType = (type) => {
    if (!types.includes(type)) {
      types.push(type);
    }
  };

  const sideValue = normalizeText(
    card?.side || card?.faction || card?.team || "",
  );

  const descriptionValue = normalizeText(
    removeDiscordEmojis(card?.description || ""),
  );

  if (
    sideValue === "plant" ||
    sideValue === "plants" ||
    sideValue.includes("plant")
  ) {
    addType("Plants");
  }

  if (
    sideValue === "zombie" ||
    sideValue === "zombies" ||
    sideValue.includes("zombie")
  ) {
    addType("Zombies");
  }

  if (/\btrick\b|\btricks\b/.test(descriptionValue)) {
    addType("Tricks");
  }

  if (/\benvironment\b|\benvironments\b/.test(descriptionValue)) {
    addType("Environment");
  }

  if (/\bsuperpower\b|\bsuperpowers\b/.test(descriptionValue)) {
    addType("Superpower");
  }

  return types;
};

const getCardStats = (stats) => {
  const cleanStats = removeDiscordEmojis(stats).replace(/\s+/g, " ").trim();

  const numbers = cleanStats.match(/\d+/g) || [];

  return {
    cost: numbers[0] !== undefined ? Number(numbers[0]) : null,
    attack: numbers[1] !== undefined ? Number(numbers[1]) : null,
    health: numbers[2] !== undefined ? Number(numbers[2]) : null,
  };
};

const getSetName = (setRarity) => {
  if (!setRarity) {
    return "";
  }

  const value = String(setRarity).trim();
  const separatorIndex = value.lastIndexOf(" - ");

  if (separatorIndex === -1) {
    return "";
  }

  return value.slice(0, separatorIndex).trim();
};

const getRarityName = (setRarity) => {
  if (!setRarity) {
    return "";
  }

  const value = String(setRarity).trim();
  const separatorIndex = value.lastIndexOf(" - ");

  if (separatorIndex === -1) {
    const normalized = normalizeText(value);

    const knownRarities = new Set([
      "common",
      "uncommon",
      "rare",
      "super-rare",
      "legendary",
      "event",
      "token",
      "hero",
    ]);

    return knownRarities.has(normalized) ? value : "";
  }

  return value.slice(separatorIndex + 3).trim();
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#202020",
    borderColor: state.isFocused ? "#8fe38b" : "#444",
    minHeight: "45px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#8fe38b",
    },
  }),

  valueContainer: (base) => ({
    ...base,
    minWidth: 0,
    flexWrap: "wrap",
    maxHeight: "140px",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),

  indicatorsContainer: (base) => ({
    ...base,
    alignSelf: "flex-start",
    flexShrink: 0,
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#202020",
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
    backgroundColor: state.isFocused ? "#333" : "#202020",
    color: "white",
    cursor: "pointer",
  }),

  multiValue: (base) => ({
    ...base,
    backgroundColor: "#333",
    maxWidth: "100%",
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "#aaa",
    "&:hover": {
      backgroundColor: "#555",
      color: "white",
    },
  }),

  singleValue: (base) => ({
    ...base,
    color: "white",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#888",
  }),

  input: (base) => ({
    ...base,
    color: "white",
  }),
};

const getCookie = (name) => {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }

  return null;
};

const getCsrfToken = () => {
  return getCookie("csrftoken");
};

const ensureCsrfToken = async () => {
  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.detail ||
        `Unable to get CSRF token (${response.status})`,
    );
  }

  const token = data?.csrfToken || data?.csrf_token || getCsrfToken();

  if (!token) {
    throw new Error("Unable to obtain CSRF token");
  }

  return token;
};

const requestJson = async (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...(options.body
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    ...(options.headers || {}),
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    method,
    credentials: "include",
    headers,
  });

  let data = null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();

    if (text) {
      data = {
        error: text
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      };
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.detail ||
      data?.reason ||
      `Request failed with status ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

const getQuantityValue = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(MAX_QUANTITY, Math.max(0, parsed));
};

const UserCardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCardId, setSavingCardId] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionSide, setCollectionSide] = useState([]);
  const [collectionType, setCollectionType] = useState([]);
  const [collectionClass, setCollectionClass] = useState([]);
  const [collectionCost, setCollectionCost] = useState([]);
  const [collectionRarity, setCollectionRarity] = useState([]);
  const [collectionSet, setCollectionSet] = useState([]);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await requestJson(`${API_BASE_URL}/tbotapp/user-cards/`);

      if (!data.authenticated) {
        throw new Error(data.error || "You must be logged in.");
      }

      setCards(Array.isArray(data.cards) ? data.cards : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load your card collection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const handleCardsAdded = async () => {
    setIsAddModalOpen(false);
    await loadCollection();
    setSuccessMessage("Cards added to your collection.");
  };

  const ownedCount = useMemo(() => {
    return cards.length;
  }, [cards]);

  const totalQuantity = useMemo(() => {
    return cards.reduce(
      (total, card) => total + getQuantityValue(card.quantity),
      0,
    );
  }, [cards]);

  const collectionFilterOptions = useMemo(() => {
    const sides = new Set();
    const types = new Set();
    const classes = new Set();
    const costs = new Set();
    const sets = new Set();
    const rarities = new Set();

    cards.forEach((card) => {
      const cardData = card.card || card;

      if (cardData.side) {
        sides.add(cardData.side);
      }

      getCardTypes(cardData).forEach((type) => {
        types.add(type);
      });

      getClassNames(cardData.card_type).forEach((className) => {
        classes.add(className);
      });

      const stats = getCardStats(cardData.stats);

      if (stats.cost !== null) {
        costs.add(stats.cost);
      }

      const setName = getSetName(cardData.set_rarity);
      const rarityName = getRarityName(cardData.set_rarity);

      if (setName) {
        sets.add(setName);
      }

      if (rarityName) {
        rarities.add(rarityName);
      }
    });

    return {
      sides: [...sides].sort(),
      types: [...types].sort(),
      classes: [...classes].sort(),
      costs: [...costs].sort((a, b) => a - b),
      sets: [...sets].sort(),
      rarities: [...rarities].sort(),
    };
  }, [cards]);

  const collectionSideOptions = collectionFilterOptions.sides.map((value) => ({
    value,
    label: value,
  }));

  const collectionTypeOptions = collectionFilterOptions.types.map((value) => ({
    value,
    label: value,
  }));

  const collectionClassOptions = collectionFilterOptions.classes.map(
    (value) => ({
      value,
      label: value,
    }),
  );

  const collectionCostOptions = collectionFilterOptions.costs.map((value) => ({
    value,
    label: `${value}`,
  }));

  const collectionSetOptions = collectionFilterOptions.sets.map((value) => ({
    value,
    label: value,
  }));

  const collectionRarityOptions = collectionFilterOptions.rarities.map(
    (value) => ({
      value,
      label: value,
    }),
  );

  const filteredCollection = useMemo(() => {
    const searchValue = collectionSearch.trim().toLowerCase();

    const selectedSides = Array.isArray(collectionSide) ? collectionSide : [];

    const selectedTypes = Array.isArray(collectionType) ? collectionType : [];

    const selectedClasses = Array.isArray(collectionClass)
      ? collectionClass
      : [];

    const selectedCosts = Array.isArray(collectionCost) ? collectionCost : [];

    const selectedSets = Array.isArray(collectionSet) ? collectionSet : [];

    const selectedRarities = Array.isArray(collectionRarity)
      ? collectionRarity
      : [];

    const matches = cards.filter((card) => {
      const cardData = card.card || card;
      const name = card.card_name?.toLowerCase() || "";

      const searchMatch = !searchValue || name.includes(searchValue);

      const cardClasses = getClassNames(cardData.card_type);
      const cardTypes = getCardTypes(cardData);
      const stats = getCardStats(cardData.stats);
      const setName = getSetName(cardData.set_rarity);
      const rarityName = getRarityName(cardData.set_rarity);

      const sideMatch =
        selectedSides.length === 0 ||
        selectedSides.some((option) => cardData.side === option.value);

      const typeMatch =
        selectedTypes.length === 0 ||
        selectedTypes.some((option) =>
          cardTypes.some(
            (type) => normalizeText(type) === normalizeText(option.value),
          ),
        );

      const classMatch =
        selectedClasses.length === 0 ||
        selectedClasses.some((option) =>
          cardClasses.some(
            (className) =>
              normalizeText(className) === normalizeText(option.value),
          ),
        );

      const costMatch =
        selectedCosts.length === 0 ||
        selectedCosts.some((option) => stats.cost === Number(option.value));

      const setMatch =
        selectedSets.length === 0 ||
        selectedSets.some(
          (option) => normalizeText(setName) === normalizeText(option.value),
        );

      const rarityMatch =
        selectedRarities.length === 0 ||
        selectedRarities.some(
          (option) => normalizeText(rarityName) === normalizeText(option.value),
        );

      return (
        searchMatch &&
        sideMatch &&
        typeMatch &&
        classMatch &&
        costMatch &&
        setMatch &&
        rarityMatch
      );
    });

    const getSideRank = (cardData) => {
      const sideValue = normalizeText(cardData.side);

      if (sideValue.includes("plant")) {
        return 0;
      }

      if (sideValue.includes("zombie")) {
        return 1;
      }

      return 2;
    };

    matches.sort((a, b) => {
      const aData = a.card || a;
      const bData = b.card || b;

      const sideDifference = getSideRank(aData) - getSideRank(bData);

      if (sideDifference !== 0) {
        return sideDifference;
      }

      const aClass = getClassNames(aData.card_type)[0] || "";

      const bClass = getClassNames(bData.card_type)[0] || "";

      const classDifference = aClass.localeCompare(bClass, undefined, {
        sensitivity: "base",
      });

      if (classDifference !== 0) {
        return classDifference;
      }

      const aCost = getCardStats(aData.stats).cost ?? Infinity;

      const bCost = getCardStats(bData.stats).cost ?? Infinity;

      if (aCost !== bCost) {
        return aCost - bCost;
      }

      return String(a.card_name || "").localeCompare(
        String(b.card_name || ""),
        undefined,
        {
          sensitivity: "base",
        },
      );
    });

    return matches;
  }, [
    cards,
    collectionSearch,
    collectionSide,
    collectionType,
    collectionClass,
    collectionCost,
    collectionSet,
    collectionRarity,
  ]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const clearCollectionFilters = () => {
    setCollectionSearch("");
    setCollectionSide([]);
    setCollectionType([]);
    setCollectionClass([]);
    setCollectionCost([]);
    setCollectionSet([]);
    setCollectionRarity([]);
  };

  const openAddModal = () => {
    clearMessages();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleQuantityChange = (cardId, value) => {
    const quantity = Math.min(
      MAX_QUANTITY,
      Math.max(0, Number.parseInt(value, 10) || 0),
    );

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              quantity,
            }
          : card,
      ),
    );
  };

  const saveQuantity = async (card) => {
    const quantity = getQuantityValue(card.quantity);

    setSavingCardId(card.id);
    clearMessages();

    try {
      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            quantity,
          }),
        },
      );

      setCards((current) =>
        current.map((item) =>
          item.id === card.id
            ? {
                ...item,
                quantity: data.quantity ?? quantity,
              }
            : item,
        ),
      );

      setSuccessMessage(`${card.card_name} quantity updated.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update card quantity.");

      await loadCollection();
    } finally {
      setSavingCardId(null);
    }
  };

  const changeQuantity = (card, amount) => {
    const currentQuantity = getQuantityValue(card.quantity);

    const nextQuantity = Math.min(
      MAX_QUANTITY,
      Math.max(0, currentQuantity + amount),
    );

    handleQuantityChange(card.id, nextQuantity);
  };

  const handleDelete = async (card) => {
    const confirmed = window.confirm(
      `Remove ${card.card_name} from your collection?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingCardId(card.id);
    clearMessages();

    try {
      await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/delete/`,
        {
          method: "DELETE",
        },
      );

      setCards((current) => current.filter((item) => item.id !== card.id));

      setSuccessMessage(`${card.card_name} was removed from your collection.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to remove card.");
    } finally {
      setDeletingCardId(null);
    }
  };

  const renderCollectionCard = (card) => {
    const fullCard = card.card || card;
    const quantity = getQuantityValue(card.quantity);

    return (
      <div className="collection-card" key={card.id}>
        <div className="collection-card-image-wrapper">
          {fullCard?.thumbnail ? (
            <img
              className="collection-card-image"
              src={fullCard.thumbnail}
              alt={card.card_name}
            />
          ) : (
            <div className="collection-card-placeholder">
              {card.card_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        <div className="collection-card-content">
          <h3 className="collection-card-name">{card.card_name}</h3>

          {fullCard && (
            <div className="collection-card-meta">
              <span>{fullCard.side || "Unknown side"}</span>

              <span>{fullCard.card_type || "Unknown type"}</span>

              {fullCard.cost !== undefined && (
                <span>Cost: {fullCard.cost}</span>
              )}
            </div>
          )}

          <div className="collection-card-quantity">
            <button
              type="button"
              className="quantity-button"
              onClick={() => changeQuantity(card, -1)}
              disabled={
                quantity <= 0 ||
                savingCardId === card.id ||
                deletingCardId === card.id
              }
            >
              −
            </button>

            <input
              type="number"
              min="0"
              max={MAX_QUANTITY}
              value={card.quantity}
              onChange={(event) =>
                handleQuantityChange(card.id, event.target.value)
              }
              className="quantity-input"
              disabled={savingCardId === card.id || deletingCardId === card.id}
            />

            <button
              type="button"
              className="quantity-button"
              onClick={() => changeQuantity(card, 1)}
              disabled={
                quantity >= MAX_QUANTITY ||
                savingCardId === card.id ||
                deletingCardId === card.id
              }
            >
              +
            </button>
          </div>

          <div className="collection-card-actions">
            <button
              type="button"
              className="card-save-button"
              onClick={() => saveQuantity(card)}
              disabled={savingCardId === card.id || deletingCardId === card.id}
            >
              {savingCardId === card.id ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              className="card-delete-button"
              onClick={() => handleDelete(card)}
              disabled={savingCardId === card.id || deletingCardId === card.id}
            >
              {deletingCardId === card.id ? "Removing..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card-manager-page">
      <main className="card-manager-content">
        <div className="card-manager-header">
          <div>
            <h1>Card Manager</h1>
            <p>Manage the cards in your collection.</p>
          </div>

          <div className="user-card-manager-actions">
            <Link to="/dashboard" className="user-card-manager-back-admin">
              ← Back to Dashboard
            </Link>

            <button
              type="button"
              className="add-cards-button"
              onClick={openAddModal}
            >
              Add Cards
            </button>
          </div>
        </div>

        {error && <div className="card-manager-message error">{error}</div>}

        {successMessage && (
          <div className="card-manager-message success">{successMessage}</div>
        )}

        <section className="card-manager-summary">
          <div className="summary-item">
            <span className="summary-label">Unique Cards</span>

            <strong>{ownedCount}</strong>
          </div>

          <div className="summary-item">
            <span className="summary-label">Total Copies</span>

            <strong>{totalQuantity}</strong>
          </div>
        </section>

        <section className="card-manager-list-section">
          <div className="card-manager-section-header">
            <div>
              <h2>My Collection</h2>

              <span>
                {ownedCount} unique card
                {ownedCount === 1 ? "" : "s"}
              </span>
            </div>

            <button
              type="button"
              className="secondary-add-button"
              onClick={openAddModal}
            >
              + Add Cards
            </button>
          </div>

          <div className="card-search-container">
            <input
              className="card-search"
              placeholder="Search your collection..."
              value={collectionSearch}
              onChange={(event) => setCollectionSearch(event.target.value)}
            />
          </div>

          <div className="card-filters-actions">
            <button
              type="button"
              className="clear-card-filter-btn"
              onClick={clearCollectionFilters}
            >
              Clear
            </button>
          </div>

          <div className="card-filters">
            <div className="card-select-wrapper">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Side"
                options={collectionSideOptions}
                value={collectionSide}
                onChange={setCollectionSide}
                isMulti
                closeMenuOnSelect={false}
              />
            </div>

            <div className="card-select-wrapper">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Type"
                options={collectionTypeOptions}
                value={collectionType}
                onChange={setCollectionType}
                isMulti
                closeMenuOnSelect={false}
              />
            </div>

            <div className="card-select-wrapper">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Class"
                options={collectionClassOptions}
                value={collectionClass}
                onChange={setCollectionClass}
                isMulti
                closeMenuOnSelect={false}
              />
            </div>

            <div className="card-select-wrapper">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Cost"
                options={collectionCostOptions}
                value={collectionCost}
                onChange={setCollectionCost}
                isMulti
                closeMenuOnSelect={false}
              />
            </div>

            <div className="card-select-wrapper">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Set"
                options={collectionSetOptions}
                value={collectionSet}
                onChange={setCollectionSet}
                isMulti
                closeMenuOnSelect={false}
              />
            </div>

            <div className="card-select-wrapper">
              <Select
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Rarity"
                options={collectionRarityOptions}
                value={collectionRarity}
                onChange={setCollectionRarity}
                isMulti
                closeMenuOnSelect={false}
              />
            </div>
          </div>

          {loading ? (
            <div className="card-manager-loading">
              Loading your collection...
            </div>
          ) : cards.length === 0 ? (
            <div className="card-manager-empty">
              <h3>Your collection is empty</h3>

              <p>Add cards to start building your collection.</p>

              <button
                type="button"
                className="add-cards-button"
                onClick={openAddModal}
              >
                Add Cards
              </button>
            </div>
          ) : filteredCollection.length === 0 ? (
            <div className="card-manager-empty">
              <h3>No cards match your filters</h3>

              <p>Try changing your search or collection filters.</p>
            </div>
          ) : (
            <div className="card-manager-grid">
              {filteredCollection.map(renderCollectionCard)}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <AddCardsModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onCardsAdded={handleCardsAdded}
      />
    </div>
  );
};

export default UserCardManager;
