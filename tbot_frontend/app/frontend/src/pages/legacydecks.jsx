import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import useTemporaryMessage from "../utils/useTemporaryMessage";

import {
  ARCHETYPE_META,
  CATEGORY_META,
  COLLECTION_OPTIONS,
  HERO_ALIAS,
  normalizeKey,
  normalizeText,
  parseDeckCards,
  buildCollectionMap,
  getDeckCollectionStatus,
  getDeckKey,
} from "../utils/deckFilters";

import "../css/decklists.css";
import "../css/navbar.css";
import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const STORAGE_KEYS = {
  decks: "tbot_legacy_decks",
  deckCount: "tbot_legacy_deck_count",
  cards: "tbot_cards",
};

function parseCategories(value) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,;/|]+/)
    .map((category) => category.trim())
    .filter(Boolean);
}

function parseArchetypes(value) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,;/|]+/)
    .map((archetype) => archetype.trim())
    .filter(Boolean);
}

function readSessionCache(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.sessionStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn(`Unable to read session cache "${key}":`, error);
    return fallback;
  }
}

function writeSessionCache(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write session cache "${key}":`, error);
  }
}

function LegacyDecksPage() {
  const initialDecks = readSessionCache(STORAGE_KEYS.decks, []);
  const initialDeckCount = readSessionCache(STORAGE_KEYS.deckCount, null);
  const initialCards = readSessionCache(STORAGE_KEYS.cards, []);

  const hasCachedDecks = Array.isArray(initialDecks) && initialDecks.length > 0;

  const [decks, setDecks] = useState(
    Array.isArray(initialDecks) ? initialDecks : [],
  );

  const [totalDecks, setTotalDecks] = useState(
    Number.isFinite(Number(initialDeckCount)) ? Number(initialDeckCount) : 0,
  );

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collectionFilter, setCollectionFilter] = useState([]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [collectionCards, setCollectionCards] = useState([]);

  const [allCards, setAllCards] = useState(
    Array.isArray(initialCards) ? initialCards : [],
  );

  const [loading, setLoading] = useState(!hasCachedDecks);
  const [error, setError] = useState("");

  const { visible: collectionLoginMessage, show: showCollectionLoginMessage } =
    useTemporaryMessage(4000);

  useEffect(() => {
    document.title = "Legacy Decks";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  /*
   * ============================================================
   * LOAD LEGACY DECKS
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchLegacyDecks = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/legacy-decklists/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          let message = `Legacy deck request failed with status ${response.status}`;

          try {
            const payload = await response.json();

            if (payload?.detail) {
              message += `: ${payload.detail}`;
            } else if (payload?.error) {
              message += `: ${payload.error}`;
            }
          } catch {}

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        if (!contentType.includes("application/json")) {
          throw new Error("The legacy decklist endpoint did not return JSON.");
        }

        const data = await response.json();

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        const normalizedResults = results.map((deck) => ({
          ...deck,
          cards: deck?.cards ?? "",
        }));

        setDecks(normalizedResults);
        setError("");

        writeSessionCache(STORAGE_KEYS.decks, normalizedResults);

        if (normalizedResults.length > 0) {
          setTotalDecks((currentCount) => {
            if (currentCount > 0) {
              return currentCount;
            }

            return normalizedResults.length;
          });
        }

        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load legacy decklists:", err);

        if (hasCachedDecks) {
          setError("");
          setLoading(false);
          return;
        }

        setError(
          `Unable to load legacy decklists right now. ${
            err.message || ""
          }`.trim(),
        );

        setLoading(false);
      }
    };

    fetchLegacyDecks();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * ============================================================
   * LOAD LEGACY DECK COUNT
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchLegacyCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/legacy-decklist-count/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Legacy deck count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        const count = Number(data?.count);

        if (Number.isFinite(count) && count >= 0) {
          setTotalDecks(count);

          writeSessionCache(STORAGE_KEYS.deckCount, count);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to refresh legacy deck count:", err);
        }
      }
    };

    fetchLegacyCount();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * ============================================================
   * LOAD CARD INFORMATION
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Card information request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        const cards = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        setAllCards(cards);
        writeSessionCache(STORAGE_KEYS.cards, cards);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to refresh card information:", err);
        }
      }
    };

    fetchCards();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * ============================================================
   * LOAD USER COLLECTION
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchUserCollection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/user-cards/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          setIsAuthenticated(false);
          setCollectionCards([]);
          setCollectionFilter([]);
          return;
        }

        const data = await response.json();

        if (data?.authenticated !== true) {
          setIsAuthenticated(false);
          setCollectionCards([]);
          setCollectionFilter([]);
          return;
        }

        setIsAuthenticated(true);

        setCollectionCards(
          Array.isArray(data?.cards)
            ? data.cards
            : Array.isArray(data?.results)
              ? data.results
              : [],
        );
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load user collection:", err);

        setIsAuthenticated(false);
        setCollectionCards([]);
        setCollectionFilter([]);
      }
    };

    fetchUserCollection();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * ============================================================
   * COLLECTION MAP
   * ============================================================
   */

  const collectionMap = useMemo(() => {
    if (!isAuthenticated) {
      return new Map();
    }

    return buildCollectionMap(collectionCards);
  }, [collectionCards, isAuthenticated]);

  /*
   * ============================================================
   * SIDE FILTER
   * ============================================================
   */

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeKey(side);

    return decks.filter((deck) => normalizeKey(deck?.side) === selectedSide);
  }, [decks, side]);

  /*
   * ============================================================
   * DECK COLLECTION STATUS
   * ============================================================
   */

  const deckCollectionStatuses = useMemo(() => {
    const statusMap = new Map();

    if (!isAuthenticated) {
      return statusMap;
    }

    decks.forEach((deck) => {
      statusMap.set(
        getDeckKey(deck),
        getDeckCollectionStatus(deck, collectionMap),
      );
    });

    return statusMap;
  }, [decks, collectionMap, isAuthenticated]);

  /*
   * ============================================================
   * FILTER FUNCTION
   * ============================================================
   */

  const getDecksMatchingFilters = useMemo(() => {
    return (sourceDecks, excludedFilter = null) => {
      const searchValue = normalizeKey(search);

      const alias = HERO_ALIAS[searchValue]
        ? normalizeKey(HERO_ALIAS[searchValue])
        : "";

      return sourceDecks.filter((deck) => {
        const deckCards = parseDeckCards(deck.cards);

        const searchableCardValues = deckCards.map((card) =>
          normalizeKey(card),
        );

        const searchableValues = [
          deck.name,
          deck.creator,
          deck.optimization,
          deck.hero,
          deck.archetype,
          deck.category,
        ]
          .filter(Boolean)
          .map((value) => normalizeKey(value));

        searchableValues.push(...searchableCardValues);

        let searchMatch = true;

        if (searchValue) {
          searchMatch = alias
            ? normalizeKey(deck.hero).includes(alias)
            : searchableValues.some((value) => value.includes(searchValue));
        }

        const deckSide = normalizeKey(deck.side);

        const sideMatch = side === "All" || deckSide === normalizeKey(side);

        const heroMatch =
          excludedFilter === "hero" ||
          hero.length === 0 ||
          hero.some(
            (selectedHero) =>
              normalizeKey(deck.hero) === normalizeKey(selectedHero.value),
          );

        const deckCategories = parseCategories(deck.category);

        const categoryMatch =
          excludedFilter === "category" ||
          category.length === 0 ||
          category.some((selectedCategory) =>
            deckCategories.includes(normalizeKey(selectedCategory.value)),
          );

        const deckArchetypes = parseArchetypes(deck.archetype);

        const archetypeMatch =
          excludedFilter === "archetype" ||
          archetype.length === 0 ||
          archetype.some((selectedArchetype) =>
            deckArchetypes.includes(normalizeKey(selectedArchetype.value)),
          );

        let collectionMatch = true;

        if (
          excludedFilter !== "collection" &&
          isAuthenticated &&
          collectionFilter.length > 0
        ) {
          const status = deckCollectionStatuses.get(getDeckKey(deck));

          collectionMatch = collectionFilter.some((selectedCollection) => {
            if (selectedCollection.value === "buildable") {
              return status?.buildable === true;
            }

            if (selectedCollection.value === "close") {
              return status?.close === true;
            }

            return false;
          });
        }

        return (
          searchMatch &&
          sideMatch &&
          heroMatch &&
          categoryMatch &&
          archetypeMatch &&
          collectionMatch
        );
      });
    };
  }, [
    search,
    side,
    hero,
    category,
    archetype,
    collectionFilter,
    isAuthenticated,
    deckCollectionStatuses,
  ]);

  /*
   * ============================================================
   * SORT DECKS
   *
   * When multiple archetypes are selected, decks that match
   * more of the selected archetypes are placed first.
   * ============================================================
   */

  const sortedDecks = useMemo(() => {
    const selectedArchetypes = archetype.map((selectedArchetype) =>
      normalizeKey(selectedArchetype.value),
    );

    return [...decks].sort((a, b) => {
      if (selectedArchetypes.length > 1) {
        const archetypesA = parseArchetypes(a.archetype);

        const archetypesB = parseArchetypes(b.archetype);

        const matchesA = selectedArchetypes.filter((selected) =>
          archetypesA.includes(selected),
        ).length;

        const matchesB = selectedArchetypes.filter((selected) =>
          archetypesB.includes(selected),
        ).length;

        if (matchesA !== matchesB) {
          return matchesB - matchesA;
        }
      }

      const sideOrder = {
        plants: 0,
        zombies: 1,
      };

      const sideA = normalizeKey(a.side);
      const sideB = normalizeKey(b.side);

      const sideCompare = (sideOrder[sideA] ?? 99) - (sideOrder[sideB] ?? 99);

      if (sideCompare !== 0) {
        return sideCompare;
      }

      const heroCompare = normalizeText(a.hero).localeCompare(
        normalizeText(b.hero),
        undefined,
        {
          sensitivity: "base",
        },
      );

      if (heroCompare !== 0) {
        return heroCompare;
      }

      return normalizeText(a.name).localeCompare(
        normalizeText(b.name),
        undefined,
        {
          sensitivity: "base",
        },
      );
    });
  }, [decks, archetype]);

  /*
   * ============================================================
   * FINAL FILTERED DECKS
   * ============================================================
   */

  const filteredDecks = useMemo(() => {
    return getDecksMatchingFilters(sortedDecks);
  }, [sortedDecks, getDecksMatchingFilters]);

  /*
   * ============================================================
   * HERO OPTIONS
   * ============================================================
   */

  const heroOptions = useMemo(() => {
    const availableDecks = getDecksMatchingFilters(sideFilteredDecks, "hero");

    const heroMap = new Map();

    availableDecks.forEach((deck) => {
      const heroName = normalizeText(deck.hero);

      if (!heroName) {
        return;
      }

      const key = normalizeKey(heroName);

      if (!heroMap.has(key)) {
        heroMap.set(key, {
          value: heroName,
          label: heroName,
          count: 0,
          side: normalizeKey(deck.side),
        });
      }

      heroMap.get(key).count += 1;
    });

    return Array.from(heroMap.values())
      .map((option) => {
        const matchedCard = allCards.find(
          (card) =>
            normalizeKey(card?.card_name) === normalizeKey(option.label),
        );

        return {
          ...option,
          description: matchedCard?.flavor_text || "",
          image: matchedCard?.thumbnail || "",
        };
      })
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        }),
      );
  }, [sideFilteredDecks, allCards, getDecksMatchingFilters]);

  /*
   * ============================================================
   * CATEGORY OPTIONS
   * ============================================================
   */

  const categoryOptions = useMemo(() => {
    const availableDecks = getDecksMatchingFilters(
      sideFilteredDecks,
      "category",
    );

    const categoryMap = new Map();

    availableDecks.forEach((deck) => {
      const categories = parseCategories(deck.category);

      categories.forEach((categoryName) => {
        if (!CATEGORY_META[categoryName]) {
          return;
        }

        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            value: categoryName,
            label: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            count: 0,
            ...(CATEGORY_META[categoryName] || {}),
          });
        }

        categoryMap.get(categoryName).count += 1;
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sideFilteredDecks, getDecksMatchingFilters]);

  /*
   * ============================================================
   * ARCHETYPE OPTIONS
   * ============================================================
   */

  const archetypeOptions = useMemo(() => {
    const availableDecks = getDecksMatchingFilters(
      sideFilteredDecks,
      "archetype",
    );

    const counts = {};

    Object.keys(ARCHETYPE_META).forEach((key) => {
      counts[key] = 0;
    });

    availableDecks.forEach((deck) => {
      const deckArchetypes = parseArchetypes(deck.archetype);

      Object.keys(ARCHETYPE_META).forEach((archetypeName) => {
        if (deckArchetypes.includes(archetypeName)) {
          counts[archetypeName] += 1;
        }
      });
    });

    return Object.entries(ARCHETYPE_META)
      .map(([value, meta]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count: counts[value] || 0,
        ...meta,
      }))
      .filter((option) => option.count > 0);
  }, [sideFilteredDecks, getDecksMatchingFilters]);

  /*
   * ============================================================
   * COLLECTION OPTIONS
   * ============================================================
   */

  const collectionOptions = useMemo(() => {
    if (!isAuthenticated) {
      return COLLECTION_OPTIONS;
    }

    const availableDecks = getDecksMatchingFilters(
      sideFilteredDecks,
      "collection",
    );

    let buildableCount = 0;
    let closeCount = 0;

    availableDecks.forEach((deck) => {
      const status = deckCollectionStatuses.get(getDeckKey(deck));

      if (status?.buildable === true) {
        buildableCount += 1;
      }

      if (status?.close === true) {
        closeCount += 1;
      }
    });

    return COLLECTION_OPTIONS.map((option) => {
      if (option.value === "buildable") {
        return {
          ...option,
          count: buildableCount,
        };
      }

      if (option.value === "close") {
        return {
          ...option,
          count: closeCount,
        };
      }

      return option;
    });
  }, [
    sideFilteredDecks,
    isAuthenticated,
    deckCollectionStatuses,
    getDecksMatchingFilters,
  ]);

  /*
   * ============================================================
   * FILTER CONTROLS
   * ============================================================
   */

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollectionFilter([]);
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  const handleCollectionChange = (value) => {
    if (!isAuthenticated) {
      showCollectionLoginMessage();
      return;
    }

    setCollectionFilter(value);
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading legacy decks</h2>

          <p>Preparing the legacy deck browser and loading available decks.</p>

          <div className="loading-status">
            <span>Legacy decks available</span>

            <strong>
              {totalDecks > 0 ? `${totalDecks} decks` : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="deck-page">
      <Navbar />

      <main className="deck-content">
        <h1>Legacy Decks</h1>

        <div className="deck-browser">
          <div className="tabs">
            <button
              type="button"
              className={side === "All" ? "active" : ""}
              onClick={() => handleSideChange("All")}
            >
              All
            </button>

            <button
              type="button"
              className={side === "Plants" ? "active" : ""}
              onClick={() => handleSideChange("Plants")}
            >
              <img
                src="https://i.ibb.co/fYHsRqP0/plants.png"
                alt="Plants"
                className="tab-icon"
              />
              Plants
            </button>

            <button
              type="button"
              className={side === "Zombies" ? "active" : ""}
              onClick={() => handleSideChange("Zombies")}
            >
              <img
                src="https://i.ibb.co/pvT38Y1n/zombies.png"
                alt="Zombies"
                className="tab-icon"
              />
              Zombies
            </button>
          </div>

          <div className="search-container">
            <input
              className="search"
              placeholder="Search legacy decks, creators, heroes, cards..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="filters">
            <div className="select-wrapper">
              <FilterDropdown
                label="Hero"
                options={heroOptions}
                value={hero}
                onChange={setHero}
                multi
              />
            </div>

            <div className="select-wrapper">
              <FilterDropdown
                label="Category"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                multi
              />
            </div>

            <div className="select-wrapper archetype-select-wrapper">
              <FilterDropdown
                label="Archetype"
                options={archetypeOptions}
                value={archetype}
                onChange={setArchetype}
                multi
              />
            </div>

            <div className="select-wrapper">
              <FilterDropdown
                label="Collection"
                options={collectionOptions}
                value={collectionFilter}
                onChange={handleCollectionChange}
                multi
                requiresAuth
                isAuthenticated={isAuthenticated}
                onAuthRequired={showCollectionLoginMessage}
              />
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          {collectionLoginMessage && (
            <div className="collection-login-message">
              <strong>Discord login required</strong>

              <span>Log in with Discord to use the Collection filter.</span>
            </div>
          )}
        </div>

        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p className="results-count">
            Showing {filteredDecks.length} of {totalDecks || decks.length}{" "}
            legacy decks
          </p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No legacy decks found.</p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck, index) => (
                <DeckCard
                  key={
                    deck.deckid ??
                    deck.deckID ??
                    deck.id ??
                    `${deck.side}-${deck.hero}-${deck.name}-${index}`
                  }
                  decklist={deck}
                  allCards={allCards}
                  legacy
                />
              ))}
            </div>
          )
        )}
      </main>

      <Footer credits />
    </div>
  );
}

export default LegacyDecksPage;
