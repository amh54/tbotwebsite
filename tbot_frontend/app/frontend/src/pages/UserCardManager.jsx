import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Link } from "react-router-dom";
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

const SIDE_OPTIONS = [
  {
    value: "Plants",
    label: "Plants",
  },
  {
    value: "Zombie",
    label: "Zombies",
  },
];

const MAX_QUANTITY = 4;

// Card data only stores raw fields like card_type, stats, and set_rarity —
// class, cost, set, and rarity all have to be parsed out of those, the same
// way CardBrowser does it, or the filter options end up empty.
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
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "white",
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "#aaa",
    ":hover": {
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
const ensureCsrfToken = async () => {
  let token = getCsrfToken();

  if (token) {
    return token;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
    mode: "cors",
    headers: {
      Accept: "application/json",
    },
  });

  console.log("CSRF RESPONSE:", response.status);
  console.log("SET COOKIE HEADER:", response.headers.get("set-cookie"));

  if (!response.ok) {
    throw new Error("Unable to get CSRF cookie");
  }

  // give browser time to save cookie
  await new Promise((resolve) => setTimeout(resolve, 100));

  token = getCsrfToken();

  console.log("CSRF COOKIE AFTER FETCH:", token);

  if (!token) {
    throw new Error("CSRF cookie was not created");
  }

  return token;
};
const getCsrfToken = () => getCookie("csrftoken");

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.detail ||
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

const getSelectedQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(MAX_QUANTITY, Math.max(1, parsed));
};

const getCardKey = (card) => {
  return String(card.cardid ?? card.card_id ?? card.card_name);
};
const UserCardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [savingCardId, setSavingCardId] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedSide, setSelectedSide] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionSide, setCollectionSide] = useState([]);
  const [collectionType, setCollectionType] = useState([]);
  const [collectionClass, setCollectionClass] = useState([]);
  const [collectionCost, setCollectionCost] = useState([]);
  const [collectionRarity, setCollectionRarity] = useState([]);
  const [collectionSet, setCollectionSet] = useState([]);

  const [classes, setClasses] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const setAllVisibleToFour = () => {
    if (!availableCards.length) {
      return;
    }

    const nextSelected = {};
    const nextQuantities = {
      ...selectedQuantities,
    };

    availableCards.forEach((card) => {
      const key = getCardKey(card);

      if (card.already_owned) {
        return;
      }

      nextSelected[key] = true;
      nextQuantities[key] = MAX_QUANTITY;
    });

    setSelectedCards(nextSelected);
    setSelectedQuantities(nextQuantities);
  };
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

  const loadClasses = useCallback(async (side) => {
    if (!side) {
      setClasses([]);
      return;
    }

    setLoadingClasses(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("side", side);

      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/classes/?${params.toString()}`,
      );

      setClasses(Array.isArray(data.classes) ? data.classes : []);
    } catch (requestError) {
      setClasses([]);
      setError(requestError.message || "Unable to load card classes.");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadAvailableCards = useCallback(async () => {
    if (!selectedSide || !selectedClass) {
      setAvailableCards([]);
      setLoadingCards(false);
      return;
    }

    setLoadingCards(true);

    try {
      const params = new URLSearchParams();

      params.set("side", selectedSide);
      params.set("class", selectedClass);

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/available/?${params.toString()}`,
      );

      setAvailableCards(Array.isArray(data.cards) ? data.cards : []);
    } catch (requestError) {
      setAvailableCards([]);
      setError(requestError.message || "Unable to load available cards.");
    } finally {
      setLoadingCards(false);
    }
  }, [selectedSide, selectedClass, search]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    if (!isAddModalOpen) {
      return;
    }

    loadClasses(selectedSide);
  }, [isAddModalOpen, selectedSide, loadClasses]);

  useEffect(() => {
    if (!isAddModalOpen) {
      return;
    }

    /*
     * Explicitly clear the card list while a class has not been selected.
     */
    if (!selectedSide || !selectedClass) {
      setAvailableCards([]);
      setLoadingCards(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      loadAvailableCards();
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isAddModalOpen, selectedSide, selectedClass, search, loadAvailableCards]);

  const ownedCount = useMemo(() => {
    return cards.length;
  }, [cards]);

  const totalQuantity = useMemo(() => {
    return cards.reduce(
      (total, card) => total + getQuantityValue(card.quantity),
      0,
    );
  }, [cards]);

  // Derived filter values pulled from the collection, using the same
  // parsing CardBrowser applies to card_type / stats / set_rarity before
  // mapping into react-select options.
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

      getCardTypes(cardData).forEach((type) => types.add(type));

      getClassNames(cardData.card_type).forEach((className) =>
        classes.add(className),
      );

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

    return cards.filter((card) => {
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

  const selectedCount = useMemo(() => {
    return Object.values(selectedCards).filter(Boolean).length;
  }, [selectedCards]);

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

  const resetAddModalState = () => {
    setSelectedSide("");
    setSelectedClass("");
    setSearch("");
    setClasses([]);
    setAvailableCards([]);
    setSelectedCards({});
    setSelectedQuantities({});
  };

  const openAddModal = () => {
    clearMessages();
    resetAddModalState();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    if (addingCards) {
      return;
    }

    setIsAddModalOpen(false);
    resetAddModalState();
  };

  const handleSideChange = (side) => {
    clearMessages();

    setSelectedSide(side);
    setSelectedClass("");
    setSearch("");

    setSelectedCards({});
    setSelectedQuantities({});
    setAvailableCards([]);
  };

  const handleClassChange = (cardClass) => {
    clearMessages();

    setSelectedClass(cardClass);
    setSelectedCards({});
    setSelectedQuantities({});
    setAvailableCards([]);
  };

  const toggleCardSelection = (card) => {
    if (card.already_owned) {
      return;
    }

    const key = getCardKey(card);

    setSelectedCards((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSelectedQuantities((current) => {
      if (current[key] !== undefined) {
        return current;
      }

      return {
        ...current,
        [key]: 1,
      };
    });
  };

  const increaseSelectedQuantity = (card) => {
    const key = getCardKey(card);

    setSelectedQuantities((current) => {
      const currentQuantity = getSelectedQuantity(current[key] ?? 1);

      return {
        ...current,
        [key]: Math.min(MAX_QUANTITY, currentQuantity + 1),
      };
    });
  };

  const decreaseSelectedQuantity = (card) => {
    const key = getCardKey(card);

    setSelectedQuantities((current) => {
      const currentQuantity = getSelectedQuantity(current[key] ?? 1);

      return {
        ...current,
        [key]: Math.max(1, currentQuantity - 1),
      };
    });
  };

  const setSelectedQuantity = (card, value) => {
    const key = getCardKey(card);
    const quantity = getSelectedQuantity(value);

    setSelectedQuantities((current) => ({
      ...current,
      [key]: quantity,
    }));
  };

  const selectAllVisible = () => {
    if (!availableCards.length) {
      return;
    }

    const nextSelected = {};
    const nextQuantities = {
      ...selectedQuantities,
    };

    availableCards.forEach((card) => {
      const key = getCardKey(card);

      if (card.already_owned) {
        return;
      }

      nextSelected[key] = true;

      if (nextQuantities[key] === undefined) {
        nextQuantities[key] = 1;
      }
    });

    setSelectedCards(nextSelected);
    setSelectedQuantities(nextQuantities);
  };

  const clearSelectedCards = () => {
    setSelectedCards({});
  };

  const handleAddSelected = async () => {
    const selected = availableCards.filter(
      (card) => selectedCards[getCardKey(card)] && !card.already_owned,
    );

    if (!selected.length) {
      setError("Select at least one card to add.");
      return;
    }

    setAddingCards(true);
    clearMessages();

    let addedCount = 0;
    const failedCards = [];

    try {
      const csrfToken = await ensureCsrfToken();

      for (const card of selected) {
        const key = getCardKey(card);

        const quantity = getSelectedQuantity(selectedQuantities[key] ?? 1);

        try {
          await requestJson(`${API_BASE_URL}/tbotapp/user-cards/create/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({
              card_name: card.card_name,
              quantity,
            }),
          });

          addedCount++;
        } catch (requestError) {
          failedCards.push(`${card.card_name}: ${requestError.message}`);
        }
      }

      await loadCollection();

      if (failedCards.length) {
        setError(
          `Added ${addedCount} cards, but failed: ${failedCards.join(" | ")}`,
        );
      } else {
        setSuccessMessage(`${addedCount} cards added to your collection.`);

        setIsAddModalOpen(false);
        resetAddModalState();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingCards(false);
    }
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
      const csrfToken = getCsrfToken();

      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/`,
        {
          method: "PATCH",
          headers: csrfToken
            ? {
                "X-CSRFToken": csrfToken,
              }
            : {},
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
      const csrfToken = getCsrfToken();

      await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/delete/`,
        {
          method: "DELETE",
          headers: csrfToken
            ? {
                "X-CSRFToken": csrfToken,
              }
            : {},
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

          {/* Search bar + filters below match CardBrowser's card-search /
              card-filters markup, styling, and multi-select behavior. */}
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
          ) : (
            <div className="card-manager-grid">
              {filteredCollection.map(renderCollectionCard)}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {isAddModalOpen && (
        <div
          className="card-manager-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div
            className="card-manager-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-cards-title"
          >
            <div className="card-manager-modal-header">
              <div>
                <h2 id="add-cards-title">Add Cards</h2>

                <p>
                  Select a side and class, then choose the cards you want to
                  add.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeAddModal}
                disabled={addingCards}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="card-manager-filters">
              <div className="filter-group">
                <label htmlFor="card-side">Side</label>

                <select
                  id="card-side"
                  value={selectedSide}
                  onChange={(event) => handleSideChange(event.target.value)}
                  disabled={addingCards}
                >
                  <option value="">Select side</option>

                  {SIDE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="card-class">Class</label>

                <select
                  id="card-class"
                  value={selectedClass}
                  onChange={(event) => handleClassChange(event.target.value)}
                  disabled={!selectedSide || loadingClasses || addingCards}
                >
                  <option value="">
                    {!selectedSide
                      ? "Select side first..."
                      : loadingClasses
                        ? "Loading classes..."
                        : "Select class..."}
                  </option>

                  {classes.map((cardClass) => (
                    <option key={cardClass} value={cardClass}>
                      {cardClass}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group search-group">
                <label htmlFor="card-search">Search</label>

                <input
                  id="card-search"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder={
                    selectedClass
                      ? "Search cards..."
                      : "Select a class first..."
                  }
                  disabled={!selectedClass || addingCards}
                />
              </div>
            </div>

            {!selectedSide ? (
              <div className="modal-empty-state">
                <h3>Choose a side to begin</h3>

                <p>Select Plants or Zombies to load the available classes.</p>
              </div>
            ) : !selectedClass ? (
              <div className="modal-empty-state">
                <h3>Choose a class to see cards</h3>

                <p>
                  Select a class above before the available cards are displayed.
                </p>
              </div>
            ) : (
              <>
                <div className="available-cards-toolbar">
                  <span>
                    {loadingCards
                      ? "Loading cards..."
                      : `${availableCards.length} card${
                          availableCards.length === 1 ? "" : "s"
                        }`}
                  </span>

                  <div className="selection-actions">
                    <button
                      type="button"
                      onClick={selectAllVisible}
                      disabled={
                        loadingCards || !availableCards.length || addingCards
                      }
                    >
                      Select Available
                    </button>

                    <button
                      type="button"
                      onClick={setAllVisibleToFour}
                      disabled={
                        loadingCards || !availableCards.length || addingCards
                      }
                    >
                      Set All +4
                    </button>

                    <button
                      type="button"
                      onClick={clearSelectedCards}
                      disabled={selectedCount === 0 || addingCards}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="available-card-list">
                  {loadingCards ? (
                    <div className="modal-loading">
                      Loading available cards...
                    </div>
                  ) : availableCards.length === 0 ? (
                    <div className="modal-empty-state small">
                      <h3>No cards found</h3>

                      <p>Try another class or search term.</p>
                    </div>
                  ) : (
                    availableCards.map((card) => {
                      const key = getCardKey(card);
                      const isSelected = Boolean(selectedCards[key]);
                      const quantity = getSelectedQuantity(
                        selectedQuantities[key] ?? 1,
                      );

                      return (
                        <div
                          className={`available-card-row ${
                            isSelected ? "selected" : ""
                          } ${card.already_owned ? "already-owned" : ""}`}
                          key={key}
                          onClick={() => {
                            toggleCardSelection(card);
                          }}
                        >
                          <div className="available-card-main">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCardSelection(card)}
                              onClick={(event) => event.stopPropagation()}
                              disabled={card.already_owned || addingCards}
                            />

                            {card.thumbnail ? (
                              <img
                                src={card.thumbnail}
                                alt=""
                                className="available-card-thumbnail"
                              />
                            ) : (
                              <div className="available-card-thumbnail-placeholder">
                                {card.card_name?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}

                            <div className="available-card-info">
                              <strong>{card.card_name}</strong>

                              <span>{card.card_type}</span>
                            </div>
                          </div>

                          <div className="available-card-actions">
                            {card.already_owned ? (
                              <span className="already-owned-label">
                                Already Owned
                              </span>
                            ) : (
                              <div
                                className="card-ratio-controls"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="card-ratio-button"
                                  onClick={() => decreaseSelectedQuantity(card)}
                                  disabled={
                                    !isSelected || quantity <= 1 || addingCards
                                  }
                                  aria-label={`Decrease ${card.card_name} quantity`}
                                >
                                  −
                                </button>

                                <div className="card-ratio-count">
                                  {quantity}
                                </div>

                                <button
                                  type="button"
                                  className="card-ratio-button"
                                  onClick={() => increaseSelectedQuantity(card)}
                                  disabled={
                                    !isSelected ||
                                    quantity >= MAX_QUANTITY ||
                                    addingCards
                                  }
                                  aria-label={`Increase ${card.card_name} quantity`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            <div className="card-manager-modal-footer">
              <span className="selected-count">{selectedCount} selected</span>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeAddModal}
                  disabled={addingCards}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="modal-add-button"
                  onClick={handleAddSelected}
                  disabled={addingCards || selectedCount === 0}
                >
                  {addingCards
                    ? "Adding..."
                    : `Add ${selectedCount || ""} Selected`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCardManager;
