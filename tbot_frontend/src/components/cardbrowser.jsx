import { useCallback, useEffect, useMemo, useState } from "react";

import CardModal from "../components/modals/cardmodal.jsx";
import Filters from "../components/cardInfo/filters.jsx";
import Loading from "../components/cardInfo/loading.jsx";
import GridItem from "../components/cardInfo/gridItem.jsx";
import { API_BASE_URL } from "../utils/api.js";
import {
  CARD_CACHE_KEY,
  getCardCountMemoryCache,
  getCardInfoMemoryCache,
  setCardCountMemoryCache,
  setCardInfoMemoryCache,
} from "../utils/cardInfo/cardCache.js";

import {
  extractTribes,
  getCardKeywords,
  getCardStats,
  getCardTypes,
  getClassNames,
  getRarityName,
  getSetName,
  isHeroCard,
} from "../utils/cardInfo/dataUtils.js";

import {
  buildCardFilters,
  filterAndSortCards,
} from "../utils/cardInfo/filterUtils.js";

import { renderFilterLabel } from "../utils/cardInfo/renderUtils.jsx";
import { normalizeText } from "../utils/cardInfo/textUtils.js";

import "../css/cardinfo.css";
import "../css/loading.css";

const hasValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).trim();

  return normalized !== "" && normalized.toUpperCase() !== "NULL";
};

const getCleanValue = (value) => {
  if (!hasValue(value)) {
    return "";
  }

  return String(value).trim();
};

const getInitialCards = (providedCards, userCollection) => {
  if (userCollection) {
    return providedCards
      .filter((userCard) => userCard?.card)
      .map((userCard) => ({
        ...userCard.card,
        quantity: userCard.quantity,
        collection_id: userCard.id,
      }));
  }

  const memoryCache = getCardInfoMemoryCache();

  if (Array.isArray(memoryCache) && memoryCache.length > 0) {
    return memoryCache;
  }

  try {
    const cachedCards = sessionStorage.getItem(CARD_CACHE_KEY);

    if (cachedCards) {
      const parsedCards = JSON.parse(cachedCards);

      if (Array.isArray(parsedCards) && parsedCards.length > 0) {
        setCardInfoMemoryCache(parsedCards);
        return parsedCards;
      }
    }
  } catch (error) {
    console.error("Unable to read cached card data:", error);
  }

  return [];
};

const findCardByQuery = (cards, cardQuery) => {
  if (!hasValue(cardQuery) || !Array.isArray(cards)) {
    return null;
  }

  const normalizedQuery = normalizeText(cardQuery);

  return (
    cards.find((card) => {
      if (!card) {
        return false;
      }

      const cardName = normalizeText(card.card_name);

      const title = normalizeText(card.title);

      const aliases = String(card.aliases ?? "")
        .split(/[,|;]/)
        .map((alias) => normalizeText(alias))
        .filter(Boolean);

      return (
        cardName === normalizedQuery ||
        title === normalizedQuery ||
        aliases.includes(normalizedQuery)
      );
    }) || null
  );
};

const getErrorMessage = async (response) => {
  const message = `Request failed with status ${response.status}`;

  const contentType = (
    response.headers.get("content-type") || ""
  ).toLowerCase();

  if (!contentType.includes("application/json")) {
    return message;
  }

  try {
    const errorPayload = await response.json();

    if (errorPayload?.detail) {
      return `${message}: ${errorPayload.detail}`;
    }

    if (errorPayload?.error) {
      return `${message}: ${errorPayload.error}`;
    }
  } catch {
    return message;
  }

  return message;
};

const getSideMatches = (cardSide, selectedSide) => {
  const normalizedCardSide = normalizeText(cardSide);

  const normalizedSelectedSide = normalizeText(selectedSide);

  if (!normalizedCardSide) {
    return false;
  }

  if (normalizedSelectedSide === "plants") {
    return (
      normalizedCardSide === "plant" ||
      normalizedCardSide === "plants" ||
      normalizedCardSide.includes("plant")
    );
  }

  return (
    normalizedCardSide === "zombie" ||
    normalizedCardSide === "zombies" ||
    normalizedCardSide.includes("zombie")
  );
};

const buildFilterData = (normalCards) => {
  const classes = new Set();
  const costs = new Set();
  const attacks = new Set();
  const healths = new Set();
  const keywords = new Map();
  const tribes = new Map();
  const types = new Set();
  const sets = new Set();
  const rarities = new Set();

  normalCards.forEach((card) => {
    getClassNames(card.card_type).forEach((className) => {
      classes.add(className);
    });

    getCardTypes(card).forEach((type) => {
      types.add(type);
    });

    const stats = getCardStats(card.stats);

    if (stats.cost !== null) {
      costs.add(stats.cost);
    }

    if (stats.attack !== null) {
      attacks.add(stats.attack);
    }

    if (stats.health !== null) {
      healths.add(stats.health);
    }

    getCardKeywords(card).forEach((keyword) => {
      const key = normalizeText(keyword);

      if (!keywords.has(key)) {
        keywords.set(key, keyword);
      }
    });

    extractTribes(card.description, card.side, card.card_type).forEach(
      (tribe) => {
        const key = normalizeText(tribe);

        if (!tribes.has(key)) {
          tribes.set(key, tribe);
        }
      },
    );

    const rarityName = getRarityName(card.set_rarity);

    const setName = getSetName(card.set_rarity);

    if (setName) {
      sets.add(setName);
    }

    if (rarityName && normalizeText(rarityName) !== "hero") {
      rarities.add(rarityName);
    }
  });

  const typeOrder = {
    plants: 1,
    zombies: 2,
    tricks: 3,
    environment: 4,
    superpower: 5,
  };

  const sortedTypes = [...types].sort((a, b) => {
    const aOrder = typeOrder[normalizeText(a)] ?? 99;

    const bOrder = typeOrder[normalizeText(b)] ?? 99;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.localeCompare(b);
  });

  return {
    classes: [...classes].sort((a, b) => a.localeCompare(b)),

    types: sortedTypes,

    costs: [...costs].sort((a, b) => a - b),

    attacks: [...attacks].sort((a, b) => a - b),

    healths: [...healths].sort((a, b) => a - b),

    keywords: [...keywords.values()].sort((a, b) => a.localeCompare(b)),

    tribes: [...tribes.values()].sort((a, b) => a.localeCompare(b)),

    sets: [...sets].sort((a, b) => a.localeCompare(b)),

    rarities: [...rarities].sort((a, b) => a.localeCompare(b)),
  };
};

function CardBrowser({
  cards: providedCards = [],
  userCollection = false,
  allCards = [],
   profileName
}) {
  const [cards, setCards] = useState(() =>
    getInitialCards(providedCards, userCollection),
  );

  const [totalCards, setTotalCards] = useState(0);

  const [loading, setLoading] = useState(
    !userCollection &&
      getInitialCards(providedCards, userCollection).length === 0,
  );

  const [selectedCard, setSelectedCard] = useState(null);

  const [side, setSide] = useState("Plants");

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState([]);

  const [classFilter, setClassFilter] = useState([]);

  const [costFilter, setCostFilter] = useState([]);

  const [attackFilter, setAttackFilter] = useState([]);

  const [healthFilter, setHealthFilter] = useState([]);

  const [keywordFilter, setKeywordFilter] = useState([]);

  const [tribeFilter, setTribeFilter] = useState([]);

  const [setFilter, setSetFilter] = useState([]);

  const [rarityFilter, setRarityFilter] = useState([]);

  const [error, setError] = useState("");

  const modalCards = useMemo(() => {
    const result = [];
    const seen = new Set();

    const addCards = (source) => {
      if (!Array.isArray(source)) {
        return;
      }

      source.forEach((candidate) => {
        if (!candidate || typeof candidate !== "object") {
          return;
        }

        let key = null;

        if (candidate.cardid !== null && candidate.cardid !== undefined) {
          key = `id:${candidate.cardid}`;
        } else if (hasValue(candidate.card_name)) {
          key = `name:${normalizeText(candidate.card_name)}`;
        }

        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        result.push(candidate);
      });
    };

    addCards(cards);
    addCards(allCards);

    return result;
  }, [cards, allCards]);

  const resolveCanonicalCard = useCallback(
    (card) => {
      if (!card) {
        return null;
      }

      if (card.cardid !== null && card.cardid !== undefined) {
        const byId = modalCards.find(
          (candidate) =>
            candidate?.cardid !== null &&
            candidate?.cardid !== undefined &&
            String(candidate.cardid) === String(card.cardid),
        );

        if (byId) {
          return byId;
        }
      }

      if (hasValue(card.card_name)) {
        const normalizedName = normalizeText(card.card_name);

        const byName = modalCards.find(
          (candidate) => normalizeText(candidate?.card_name) === normalizedName,
        );

        if (byName) {
          return byName;
        }
      }

      return card;
    },
    [modalCards],
  );

  const openCardModal = useCallback(
    (card) => {
      if (!card) {
        return;
      }

      const resolvedCard = resolveCanonicalCard(card);

      if (!resolvedCard) {
        return;
      }

      const cardName = getCleanValue(resolvedCard.card_name);

      if (!cardName) {
        return;
      }

      setSelectedCard(resolvedCard);

      const url = new URL(window.location.href);

      url.searchParams.set("card", cardName);

      window.history.pushState(
        {
          ...(window.history.state),
          card: cardName,
        },
        "",
        url,
      );
    },
    [resolveCanonicalCard],
  );

  useEffect(() => {
    const cachedCount = getCardCountMemoryCache();

    if (cachedCount !== null) {
      setTotalCards(cachedCount);
      return;
    }

    const controller = new AbortController();

    const fetchCardCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/card-count/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Card count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        const count = Number(data?.count) || 0;

        setCardCountMemoryCache(count);
        setTotalCards(count);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card count:", err);
        }
      }
    };

    fetchCardCount();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (userCollection) {
      return;
    }

    if (cards.length > 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/cardinfo/`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        const responseText = await response.text();

        if (!contentType.includes("application/json")) {
          if (responseText.trim().startsWith("<")) {
            throw new Error(`Received HTML instead of JSON from ${endpoint}.`);
          }

          throw new Error(
            `Unexpected response type ${
              contentType || "unknown"
            } from ${endpoint}.`,
          );
        }

        const data = JSON.parse(responseText);

        const loadedCards = Array.isArray(data) ? data : [];

        setCardInfoMemoryCache(loadedCards);

        try {
          sessionStorage.setItem(CARD_CACHE_KEY, JSON.stringify(loadedCards));
        } catch (cacheError) {
          console.error("Unable to cache card data:", cacheError);
        }

        setCards(loadedCards);
        setError("");
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }

        console.error(fetchError);

        setError(
          `Unable to load cards right now. ${fetchError.message || ""}`.trim(),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCards();

    return () => {
      controller.abort();
    };
  }, [userCollection, cards.length]);

  useEffect(() => {
    if (!cards.length) {
      return;
    }

    const syncCardFromUrl = () => {
      const params = new URLSearchParams(window.location.search);

      const cardQuery = params.get("card");

      if (!hasValue(cardQuery)) {
        setSelectedCard(null);
        return;
      }

      const match = findCardByQuery(cards, cardQuery);

      setSelectedCard(match);
    };

    syncCardFromUrl();

    const handlePopState = () => {
      syncCardFromUrl();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [cards]);
  const normalCards = useMemo(() => {
    return cards.filter((card) => {
      if (!getSideMatches(card?.side, side)) {
        return false;
      }

      return !isHeroCard(card);
    });
  }, [cards, side]);

  const filterData = useMemo(() => buildFilterData(normalCards), [normalCards]);

  const typeOptions = filterData.types.map((value) => ({
    value,
    label: value,
  }));

  const classOptions = filterData.classes.map((value) => ({
    value,
    label: value,
  }));

  const costOptions = filterData.costs.map((value) => ({
    value,
    label: renderFilterLabel(`${value}`, "cost", side),
  }));

  const attackOptions = filterData.attacks.map((value) => ({
    value,
    label: renderFilterLabel(`${value}`, "attack", side),
  }));

  const healthOptions = filterData.healths.map((value) => ({
    value,
    label: renderFilterLabel(`${value}`, "health", side),
  }));

  const keywordOptions = filterData.keywords.map((value) => ({
    value,
    label: value,
  }));

  const tribeOptions = filterData.tribes.map((value) => ({
    value,
    label: value,
  }));

  const setOptions = filterData.sets.map((value) => ({
    value,
    label: value,
  }));

  const rarityOptions = filterData.rarities.map((value) => ({
    value,
    label: value,
  }));

  const filteredCards = useMemo(() => {
    const filters = buildCardFilters({
      search,
      keywordFilter,
      tribeFilter,
      typeFilter,
      classFilter,
      costFilter,
      attackFilter,
      healthFilter,
      setFilter,
      rarityFilter,
    });

    return filterAndSortCards(normalCards, filters);
  }, [
    normalCards,
    search,
    typeFilter,
    classFilter,
    costFilter,
    attackFilter,
    healthFilter,
    keywordFilter,
    tribeFilter,
    setFilter,
    rarityFilter,
  ]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter([]);
    setClassFilter([]);
    setCostFilter([]);
    setAttackFilter([]);
    setHealthFilter([]);
    setKeywordFilter([]);
    setTribeFilter([]);
    setSetFilter([]);
    setRarityFilter([]);
  }, []);

  const changeSide = useCallback(
    (newSide) => {
      setSide(newSide);
      clearFilters();
    },
    [clearFilters],
  );

  const closeCardModal = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has("card")) {
      window.history.back();
      return;
    }

    setSelectedCard(null);
  }, []);

  if (loading) {
    return <Loading totalCards={totalCards} />;
  }

  return (
    <div className="card-information-page">
      <h1>
  {userCollection ? `${profileName}'s Card Collection` : "PVZ Heroes Card Database"}
</h1>

      <Filters
        side={side}
        changeSide={changeSide}
        search={search}
        setSearch={setSearch}
        clearFilters={clearFilters}
        costOptions={costOptions}
        costFilter={costFilter}
        setCostFilter={setCostFilter}
        attackOptions={attackOptions}
        attackFilter={attackFilter}
        setAttackFilter={setAttackFilter}
        healthOptions={healthOptions}
        healthFilter={healthFilter}
        setHealthFilter={setHealthFilter}
        classOptions={classOptions}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        tribeOptions={tribeOptions}
        tribeFilter={tribeFilter}
        setTribeFilter={setTribeFilter}
        rarityOptions={rarityOptions}
        rarityFilter={rarityFilter}
        setRarityFilter={setRarityFilter}
        setOptions={setOptions}
        setFilter={setSetFilter}
        typeOptions={typeOptions}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        keywordOptions={keywordOptions}
        keywordFilter={keywordFilter}
        setKeywordFilter={setKeywordFilter}
      />

      {error && <p className="error-message">{error}</p>}

      {!error && (
        <p className="card-results-count">
          Showing {filteredCards.length} {side} cards
        </p>
      )}

      {!error && filteredCards.length === 0 && (
        <p className="no-card-results">No {side} cards found.</p>
      )}

      {!error && filteredCards.length > 0 && (
        <div className="card-grid">
          {filteredCards.map((card) => (
            <GridItem
              key={card.cardid}
              card={card}
              userCollection={userCollection}
              onOpen={openCardModal}
            />
          ))}
        </div>
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          allCards={modalCards}
          onOpenCard={openCardModal}
          showShareCard={!userCollection}
          close={closeCardModal}
        />
      )}
    </div>
  );
}

export default CardBrowser;
