import { useCallback, useEffect, useMemo, useState } from "react";

import AddCardsModal from "../components/modals/AddCardsModal.jsx";
import Footer from "../components/footer";
import CardManagerHeader from "../components/cardmanager/CardManagerHeader.jsx";
import CardManagerSummary from "../components/cardmanager/CardManagerSummary.jsx";
import CardManagerFilters from "../components/cardmanager/CardManagerFilters.jsx";
import CollectionCard from "../components/cardmanager/CollectionCard.jsx";

import "../css/cardinfo.css";
import "../css/cardmanager.css";
import "../css/loading.css";

import { API_BASE_URL, ensureCsrfToken } from "../utils/api.js";

import {
  MAX_QUANTITY,
  getCardData,
  getCardStats,
  getCardTypes,
  getClassNames,
  getQuantityValue,
  getRarityName,
  getSetName,
  getSideRank,
  normalizeText,
} from "../utils/cardManagerUtils.js";

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
      const cardData = getCardData(card);

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
      const cardData = getCardData(card);

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

    matches.sort((a, b) => {
      const aData = getCardData(a);
      const bData = getCardData(b);

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

  return (
    <div className="card-manager-page">
      <main className="card-manager-content">
        <CardManagerHeader onAddCards={openAddModal} />

        {error && <div className="card-manager-message error">{error}</div>}

        {successMessage && (
          <div className="card-manager-message success">{successMessage}</div>
        )}

        <CardManagerSummary
          ownedCount={ownedCount}
          totalQuantity={totalQuantity}
        />

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

          <CardManagerFilters
            search={collectionSearch}
            onSearchChange={setCollectionSearch}
            side={collectionSide}
            type={collectionType}
            cardClass={collectionClass}
            cost={collectionCost}
            set={collectionSet}
            rarity={collectionRarity}
            sideOptions={collectionSideOptions}
            typeOptions={collectionTypeOptions}
            classOptions={collectionClassOptions}
            costOptions={collectionCostOptions}
            setOptions={collectionSetOptions}
            rarityOptions={collectionRarityOptions}
            onSideChange={setCollectionSide}
            onTypeChange={setCollectionType}
            onClassChange={setCollectionClass}
            onCostChange={setCollectionCost}
            onSetChange={setCollectionSet}
            onRarityChange={setCollectionRarity}
            onClear={clearCollectionFilters}
          />

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
              {filteredCollection.map((card) => (
                <CollectionCard
                  key={card.id}
                  card={card}
                  saving={savingCardId === card.id}
                  deleting={deletingCardId === card.id}
                  onQuantityChange={handleQuantityChange}
                  onDecrease={(item) => changeQuantity(item, -1)}
                  onIncrease={(item) => changeQuantity(item, 1)}
                  onSave={saveQuantity}
                  onDelete={handleDelete}
                />
              ))}
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
