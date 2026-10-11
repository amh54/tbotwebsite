import { useCallback, useEffect, useMemo, useState } from "react";
import AddCardsModal from "../../components/modals/addCardsModal.jsx";
import Footer from "../../components/footer.jsx";
import CardManagerHeader from "../../components/cardmanager/CardManagerHeader.jsx";
import CardManagerSummary from "../../components/cardmanager/CardManagerSummary.jsx";
import CardManagerFilters from "../../components/cardmanager/CardManagerFilters.jsx";
import CollectionCard from "../../components/cardmanager/CollectionCard.jsx";
import DeckCard from "../../components/modals/deckComponent.jsx";
import FilterDropdown from "../../components/filterDropdown.jsx";
import Seo from "../../components/seo.jsx";

import "../../css/cardInfo.css";
import "../../css/profile/cardManager.css";
import "../../css/decklists.css";
import "../../css/navbar.css";
import "../../css/loading.css";
import { API_BASE_URL, ensureCsrfToken } from "../../utils/api.js";
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
} from "../../utils/cardManagerUtils.js";
import {
  normalizeSide,
  buildCollectionMap,
  getFilterOptions,
  sortDecks,
  filterDecks,
  getDeckKey,
  normalizeKey,
  getDeckCollectionStatus,
  parseDeckCardRequirements,
} from "../../utils/deckFilters.js";

const requestJson = async (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
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
          .replace(/<[^<>]*>/g, " ")
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

const compareStrings = (a, b) =>
  String(a).localeCompare(String(b), undefined, {
    sensitivity: "base",
  });
const canonicalKey = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const canonicalizeCards = (cards, catalog) => {
  const catalogByKey = new Map(
    catalog.map((entry) => [canonicalKey(entry.card_name), entry]),
  );
  const result = new Map();

  cards.forEach((card) => {
    const key = canonicalKey(card.card_name);
    const match = catalogByKey.get(key);
    const fixed = match ? { ...card, card_name: match.card_name } : card;
    const existing = result.get(key);

    if (!existing) {
      result.set(key, fixed);
      return;
    }

    const preferred =
      match &&
      existing.card_name !== match.card_name &&
      card.card_name === match.card_name
        ? fixed
        : existing;

    result.set(key, {
      ...preferred,
      quantity: Math.max(
        getQuantityValue(existing.quantity),
        getQuantityValue(card.quantity),
      ),
    });
  });

  return [...result.values()];
};
const UserCardManager = () => {
  const [cards, setCards] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionLoaded, setCollectionLoaded] = useState(false);
  const [discordUser, setDiscordUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);
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

  const [activeTab, setActiveTab] = useState("collection");

  const [sourceDecks, setSourceDecks] = useState([]);
  const [missingDecksLoading, setMissingDecksLoading] = useState(true);
  const [missingDecksError, setMissingDecksError] = useState("");

  const [deckSearch, setDeckSearch] = useState("");
  const [deckSide, setDeckSide] = useState("All");
  const [deckHero, setDeckHero] = useState([]);
  const [deckCategory, setDeckCategory] = useState([]);
  const [deckArchetype, setDeckArchetype] = useState([]);
  const [deckCollection, setDeckCollection] = useState(null);
  const [deckPage, setDeckPage] = useState("All");

  const loadCollection = useCallback(async () => {
    setLoading(true);
    setCollectionLoaded(false);
    setError("");

    try {
      const data = await requestJson(`${API_BASE_URL}/tbotapp/user-cards/`);

      if (!data.authenticated) {
        setDiscordUser(null);
        setAuthLoading(false);
        throw new Error(data.error || "You must be logged in.");
      }

      setDiscordUser({ authenticated: true });
      setAuthLoading(false);
           setCards(Array.isArray(data.cards) ? data.cards : []);
      setCatalog(Array.isArray(data.catalog) ? data.catalog : []);
      setCollectionLoaded(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to load your card collection.");
      setCollectionLoaded(false);
    } finally {
      setLoading(false);
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollection();
  }, [loadCollection]);
  useEffect(() => {
    let cancelled = false;

    const loadCardInfo = async () => {
      try {
        const data = await requestJson(`${API_BASE_URL}/tbotapp/cardinfo/`);

        if (!cancelled) {
          setAllCards(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Unable to load card information:", error);
      }
    };

    void loadCardInfo();

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;

    const getList = (data, key) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.[key])) return data[key];
      if (Array.isArray(data?.results)) return data.results;
      return [];
    };

    const loadDeckSources = async () => {
      setMissingDecksLoading(true);
      setMissingDecksError("");

      try {
        const [mainData, legacyData, publicData] = await Promise.all([
          requestJson(`${API_BASE_URL}/tbotapp/decklists/`),
          requestJson(`${API_BASE_URL}/tbotapp/legacy-decklists/`),
          requestJson(`${API_BASE_URL}/tbotapp/public-decks/`),
        ]);

        const allDecks = [
          ...getList(mainData).map((deck) => ({
            ...deck,
            missingDeckSource: "Main Decks",
          })),
          ...getList(legacyData).map((deck) => ({
            ...deck,
            missingDeckSource: "Legacy Decks",
          })),
          ...getList(publicData, "decks").map((deck) => ({
            ...deck,
            missingDeckSource: "Public Decks",
          })),
        ];

        if (!cancelled) {
          setSourceDecks(allDecks);
        }
      } catch (requestError) {
        if (!cancelled) {
          setMissingDecksError(requestError.message || "Unable to load decks.");
        }
      } finally {
        if (!cancelled) {
          setMissingDecksLoading(false);
        }
      }
    };

    void loadDeckSources();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCardsAdded = async () => {
    setIsAddModalOpen(false);
    await loadCollection();
    setSuccessMessage("Cards added to your collection.");
  };

  const ownedCount = useMemo(() => cards.length, [cards]);

  const totalQuantity = useMemo(
    () =>
      cards.reduce((total, card) => total + getQuantityValue(card.quantity), 0),
    [cards],
  );

  const collectionCompletion = useMemo(() => {
    const quantities = new Map(
      cards.map((card) => [
        String(card.card_name || "").toLowerCase(),
        getQuantityValue(card.quantity),
      ]),
    );

    const groups = new Map();
    let ownedUnique = 0;
    let completePlaysets = 0;
    let missingCopies = 0;

    catalog.forEach((card) => {
      const cardName = card.card_name || "";
      const quantity = quantities.get(cardName.toLowerCase()) || 0;
      const setName = getSetName(card.set_rarity) || "Unknown Set";
      const rarityName = getRarityName(card.set_rarity) || "Unknown Rarity";
      const groupKey = `${setName}|||${rarityName}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          setName,
          rarityName,
          total: 0,
          owned: 0,
          missing: 0,
          incomplete: 0,
          complete: 0,
          copiesNeeded: 0,
          missingCards: [],
          incompleteCards: [],
        });
      }

      const group = groups.get(groupKey);
      group.total += 1;

      if (quantity > 0) {
        ownedUnique += 1;
        group.owned += 1;
      }

      if (quantity === 0) {
        group.missing += 1;
        group.missingCards.push({
  cardName,
  owned: quantity,
});
      } else if (quantity < 4) {
        group.incomplete += 1;
        group.incompleteCards.push({
          cardName,
          owned: quantity,
          needed: 4 - quantity,
        });
      } else {
        completePlaysets += 1;
        group.complete += 1;
      }

      const needed = Math.max(0, 4 - quantity);
      group.copiesNeeded += needed;
      missingCopies += needed;
    });

    const total = catalog.length;
    const breakdown = [...groups.values()].sort(
      (a, b) =>
        a.setName.localeCompare(b.setName) ||
        a.rarityName.localeCompare(b.rarityName),
    );

    return {
      total,
      ownedUnique,
      completePlaysets,
      collectionPercent: total ? (ownedUnique / total) * 100 : 0,
      playsetPercent: total ? (completePlaysets / total) * 100 : 0,
      missingCards: total - ownedUnique,
      missingCopies,
      breakdown,
    };
  }, [catalog, cards]);

  const collectionFilterOptions = useMemo(() => {
    const sides = new Set();
    const types = new Set();
    const classes = new Set();
    const costs = new Set();
    const sets = new Set();
    const rarities = new Set();

    cards.forEach((card) => {
      const cardData = getCardData(card);

      if (cardData.side) sides.add(cardData.side);

      getCardTypes(cardData).forEach((type) => types.add(type));
      getClassNames(cardData.card_type).forEach((className) =>
        classes.add(className),
      );

      const stats = getCardStats(cardData.stats);
      if (stats.cost !== null) costs.add(stats.cost);

      const setName = getSetName(cardData.set_rarity);
      const rarityName = getRarityName(cardData.set_rarity);

      if (setName) sets.add(setName);
      if (rarityName) rarities.add(rarityName);
    });

    return {
      sides: [...sides].sort(compareStrings),
      types: [...types].sort(compareStrings),
      classes: [...classes].sort(compareStrings),
      costs: [...costs].sort((a, b) => a - b),
      sets: [...sets].sort(compareStrings),
      rarities: [...rarities].sort(compareStrings),
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
      const name = String(card.card_name || "").toLowerCase();
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

      if (sideDifference !== 0) return sideDifference;

      const aClass = getClassNames(aData.card_type)[0] || "";
      const bClass = getClassNames(bData.card_type)[0] || "";
      const classDifference = aClass.localeCompare(bClass, undefined, {
        sensitivity: "base",
      });

      if (classDifference !== 0) return classDifference;

      const aCost = getCardStats(aData.stats).cost ?? Infinity;
      const bCost = getCardStats(bData.stats).cost ?? Infinity;

      if (aCost !== bCost) return aCost - bCost;

      return String(a.card_name || "").localeCompare(
        String(b.card_name || ""),
        undefined,
        { sensitivity: "base" },
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

  const missingDecks = useMemo(() => {
    const collectionMap = buildCollectionMap(cards);
    const cardNames = new Map();

    [...catalog, ...cards].forEach((card) => {
      const name = card.card_name || card.name || card.cardName;

      if (name) {
        cardNames.set(normalizeKey(name), name);
      }
    });

    return sourceDecks
      .map((deck, index) => {
        const deckCards =
          deck.cards ??
          deck.deck_cards ??
          deck.decklist ??
          deck.card_list ??
          "";

        const requirements = parseDeckCardRequirements(deckCards);
        const normalizedDeck = { ...deck, cards: deckCards };
        const status = getDeckCollectionStatus(normalizedDeck, collectionMap);

        const missingCards = [...requirements.entries()]
          .map(([cardKey, required]) => {
            const owned = collectionMap.get(cardKey) || 0;
            const missing = Math.max(0, Number(required) - owned);

            return {
              cardName: cardNames.get(cardKey) || cardKey,
              required: Number(required) || 0,
              owned,
              missing,
            };
          })
          .filter((card) => card.missing > 0)
          .sort(
            (a, b) =>
              b.missing - a.missing || compareStrings(a.cardName, b.cardName),
          );

        return {
          ...deck,
          missingDeckKey: `${deck.missingDeckSource}-${deck.deckid ?? deck.deckID ?? deck.id ?? index}`,
          missingDeckName:
            deck.name || deck.deck_name || deck.title || "Untitled Deck",
          missingDeckHero: deck.hero || deck.hero_name || "",
          missingCards,
          missingQuantity: missingCards.reduce(
            (total, card) => total + card.missing,
            0,
          ),
          buildable: status.buildable,
        };
      })
      .filter((deck) => !deck.buildable && deck.missingQuantity > 0)
      .sort(
        (a, b) =>
          a.missingQuantity - b.missingQuantity ||
          compareStrings(a.missingDeckName, b.missingDeckName),
      );
  }, [cards, catalog, sourceDecks]);

  const collectionMap = useMemo(() => {
    if (!collectionLoaded || loading || !discordUser) {
      return new Map();
    }

    return buildCollectionMap(cards);
  }, [cards, collectionLoaded, loading, discordUser]);

  const sortedMissingDecks = useMemo(
    () => sortDecks(missingDecks),
    [missingDecks],
  );

  const pageFilteredMissingDecks = useMemo(
    () =>
      deckPage === "All"
        ? sortedMissingDecks
        : sortedMissingDecks.filter(
            (deck) => deck.missingDeckSource === deckPage,
          ),
    [sortedMissingDecks, deckPage],
  );

  const missingDeckFilterOptions = useMemo(
    () =>
      getFilterOptions({
        decks: pageFilteredMissingDecks,
        allCards,
        search: deckSearch,
        side: deckSide,
        hero: deckHero,
        category: deckCategory,
        archetype: deckArchetype,
        collection: deckCollection,
        collectionMap,
        collectionLoading: loading,
        collectionLoaded,
        discordUser,
        authLoading,
      }),
    [
      pageFilteredMissingDecks,
      allCards,
      deckSearch,
      deckSide,
      deckHero,
      deckCategory,
      deckArchetype,
      deckCollection,
      collectionMap,
      loading,
      collectionLoaded,
      discordUser,
      authLoading,
    ],
  );

  const filteredMissingDecks = useMemo(
    () =>
      filterDecks({
        decks: pageFilteredMissingDecks,
        search: deckSearch,
        side: deckSide,
        hero: deckHero,
        category: deckCategory,
        archetype: deckArchetype,
        collection: deckCollection,
        collectionMap,
        collectionLoading: loading,
        collectionLoaded,
        discordUser,
      }),
    [
      pageFilteredMissingDecks,
      deckSearch,
      deckSide,
      deckHero,
      deckCategory,
      deckArchetype,
      deckCollection,
      collectionMap,
      loading,
      collectionLoaded,
      discordUser,
    ],
  );

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

  const clearDeckFilters = () => {
    setDeckSearch("");
    setDeckPage("All");
    setDeckHero([]);
    setDeckCategory([]);
    setDeckArchetype([]);
    setDeckCollection(null);
  };

  const handleDeckSideChange = (newSide) => {
    setDeckSide(newSide);
    clearDeckFilters();
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
        card.id === cardId ? { ...card, quantity } : card,
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
          body: JSON.stringify({ quantity }),
        },
      );

      setCards((current) =>
        current.map((item) =>
          item.id === card.id
            ? { ...item, quantity: data.quantity ?? quantity }
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

    if (!confirmed) return;

    setDeletingCardId(card.id);
    clearMessages();

    try {
      await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/delete/`,
        { method: "DELETE" },
      );

      setCards((current) => current.filter((item) => item.id !== card.id));
      setSuccessMessage(`${card.card_name} was removed from your collection.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to remove card.");
    } finally {
      setDeletingCardId(null);
    }
  };

  let collectionContent;

  if (loading) {
    collectionContent = (
      <div className="card-manager-loading">Loading your collection...</div>
    );
  } else if (cards.length === 0) {
    collectionContent = (
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
    );
  } else if (filteredCollection.length === 0) {
    collectionContent = (
      <div className="card-manager-empty">
        <h3>No cards match your filters</h3>
        <p>Try changing your search or collection filters.</p>
      </div>
    );
  } else {
    collectionContent = (
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
    );
  }

  return (
    <div className="card-manager-page">
      <Seo
        title="My Card Collection - Tbot"
        description="Manage your Plants vs. Zombies Heroes card collection on Tbot."
        canonical="/dashboard/card-manager"
        noindex
      />

      <main className="card-manager-content">
        <CardManagerHeader onAddCards={openAddModal} />

        {error && <div className="card-manager-message error">{error}</div>}

        {successMessage && (
          <div className="card-manager-message success">{successMessage}</div>
        )}

        <CardManagerSummary
          ownedCount={ownedCount}
          totalQuantity={totalQuantity}
          completion={collectionCompletion}
        />

        <section className="card-manager-list-section">
          <div className="card-manager-section-header">
            <div>
              <h2>
                {activeTab === "collection" ? "My Collection" : "Missing Decks"}
              </h2>
              <span>
                {activeTab === "collection"
                  ? `${ownedCount} unique card${ownedCount === 1 ? "" : "s"}`
                  : `${missingDecks.length} deck${missingDecks.length === 1 ? "" : "s"} you cannot fully build`}
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

          <div
            className="card-manager-tabs"
            role="tablist"
            aria-label="Card manager views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "collection"}
              className={`card-manager-tab ${activeTab === "collection" ? "active" : ""}`}
              onClick={() => setActiveTab("collection")}
            >
              My Collection
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "missing"}
              className={`card-manager-tab ${activeTab === "missing" ? "active" : ""}`}
              onClick={() => setActiveTab("missing")}
            >
              Missing Decks
              {!missingDecksLoading && (
                <span className="card-manager-tab-count">
                  {missingDecks.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "collection" ? (
            <>
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

              {collectionContent}
            </>
          ) : (
            <div className="missing-decks-content">
              {missingDecksLoading ? (
                <div className="card-manager-loading">Loading decks...</div>
              ) : missingDecksError ? (
                <div className="card-manager-empty">
                  <h3>Unable to load decks</h3>
                  <p>{missingDecksError}</p>
                </div>
              ) : (
                <>
                  <div className="deck-browser">
                    <div className="tabs">
                      <button
                        type="button"
                        className={deckSide === "All" ? "active" : ""}
                        onClick={() => handleDeckSideChange("All")}
                      >
                        All
                      </button>

                      <button
                        type="button"
                        className={deckSide === "Plants" ? "active" : ""}
                        onClick={() => handleDeckSideChange("Plants")}
                      >
                        <img
                          src="https://cdn.pvzhtbot.com/icons/plants.png"
                          alt="Plants"
                          className="tab-icon"
                        />
                        Plants
                      </button>

                      <button
                        type="button"
                        className={deckSide === "Zombies" ? "active" : ""}
                        onClick={() => handleDeckSideChange("Zombies")}
                      >
                        <img
                          src="https://cdn.pvzhtbot.com/icons/zombies.png"
                          alt="Zombies"
                          className="tab-icon"
                        />
                        Zombies
                      </button>
                    </div>

                    <div className="search-container">
                      <input
                        className="search"
                        placeholder="Search decks, creators, heroes, cards..."
                        value={deckSearch}
                        onChange={(event) => setDeckSearch(event.target.value)}
                      />
                    </div>

                    <div className="filters">
                      <div className="select-wrapper">
                        <FilterDropdown
                          label="Page"
                          options={[
                            { value: "All", label: "All Pages" },
                            { value: "Main Decks", label: "Main Decks" },
                            { value: "Legacy Decks", label: "Legacy Decks" },
                            { value: "Public Decks", label: "Public Decks" },
                          ]}
                          value={
                            deckPage === "All"
                              ? []
                              : [{ value: deckPage, label: deckPage }]
                          }
                          onChange={(value) => {
                            const selected = Array.isArray(value)
                              ? value[0]
                              : value;
                            setDeckPage(selected?.value || "All");
                          }}
                        />
                      </div>
                      <div className="select-wrapper">
                        <FilterDropdown
                          label="Hero"
                          options={missingDeckFilterOptions.heroOptions}
                          value={deckHero}
                          onChange={setDeckHero}
                          multi
                        />
                      </div>

                      <div className="select-wrapper">
                        <FilterDropdown
                          label="Category"
                          options={missingDeckFilterOptions.categoryOptions}
                          value={deckCategory}
                          onChange={setDeckCategory}
                          multi
                        />
                      </div>

                      <div className="select-wrapper archetype-select-wrapper">
                        <FilterDropdown
                          label="Archetype"
                          options={missingDeckFilterOptions.archetypeOptions}
                          value={deckArchetype}
                          onChange={setDeckArchetype}
                          multi
                        />
                      </div>
                      <button
                        type="button"
                        className="clear-filter-btn"
                        onClick={clearDeckFilters}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {loading && discordUser && (
                    <p className="results-count">Loading your collection...</p>
                  )}

                  {!authLoading &&
                    discordUser &&
                    !loading &&
                    !collectionLoaded && (
                      <p className="results-count">
                        Unable to load your collection. Collection filters are
                        temporarily unavailable.
                      </p>
                    )}

                  {missingDecks.length === 0 ? (
                    <div className="card-manager-empty">
                      <h3>You can build every available deck!</h3>
                      <p>
                        Your collection has all the required cards for the main,
                        legacy, and public decks.
                      </p>
                    </div>
                  ) : filteredMissingDecks.length === 0 ? (
                    <p className="no-results">No decklists found.</p>
                  ) : (
                    <>
                      <p className="results-count">
                        Showing {filteredMissingDecks.length} of{" "}
                        {missingDecks.length} decks you cannot fully build
                      </p>

                      <div className="deck-grid">
                        {filteredMissingDecks.map((deck) => (
                          <DeckCard
                            key={`${deck.missingDeckKey}-${normalizeSide(deck.side)}-${getDeckKey(deck)}`}
                            decklist={deck}
                            decklists
                            userCollection={cards}
                            collectionLoaded={collectionLoaded}
                            discordUser={discordUser}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
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
