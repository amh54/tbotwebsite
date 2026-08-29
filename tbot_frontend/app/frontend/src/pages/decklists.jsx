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
  normalizeText,
  normalizeKey,
  normalizeCardName,
  normalizeSide,
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
  decks: "tbot_decks",
  cards: "tbot_cards",
  deckCount: "tbot_deck_count",
};

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

function DecklistsPage() {
  const initialDecks = readSessionCache(STORAGE_KEYS.decks, []);
  const initialCards = readSessionCache(STORAGE_KEYS.cards, []);
  const initialDeckCount = readSessionCache(STORAGE_KEYS.deckCount, null);

  const hasCachedDecks = Array.isArray(initialDecks) && initialDecks.length > 0;

  const [decks, setDecks] = useState(
    Array.isArray(initialDecks) ? initialDecks : [],
  );
  const {
    visible: collectionLoginMessage,
    show: showCollectionLoginMessage,
    hide: hideCollectionLoginMessage,
  } = useTemporaryMessage(4000);
  const [allCards, setAllCards] = useState(
    Array.isArray(initialCards) ? initialCards : [],
  );

  const [totalDecks, setTotalDecks] = useState(
    Number.isFinite(Number(initialDeckCount)) ? Number(initialDeckCount) : null,
  );

  const [loading, setLoading] = useState(!hasCachedDecks);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState(null);

  const [discordUser, setDiscordUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [userCollection, setUserCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionLoaded, setCollectionLoaded] = useState(false);

  useEffect(() => {
    document.title = "Decklists";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDecks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/decklists/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;

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

        const text = await response.text();

        if (!contentType.includes("application/json")) {
          throw new Error("The decklist endpoint did not return JSON.");
        }

        const data = JSON.parse(text);

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        setDecks(results);
        writeSessionCache(STORAGE_KEYS.decks, results);

        setTotalDecks((currentCount) => {
          if (currentCount !== null && currentCount > 0) {
            return currentCount;
          }

          return results.length;
        });

        setLoading(false);
        setError("");
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load decklists:", err);

        if (hasCachedDecks) {
          setLoading(false);
          setError("");
          return;
        }

        setLoading(false);

        setError(
          `Unable to load decklists right now. ${err.message || ""}`.trim(),
        );
      }
    };

    fetchDecks();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDiscordUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/discord/me/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Discord authentication request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        if (data?.authenticated && data?.user) {
          setDiscordUser(data.user);
        } else {
          setDiscordUser(null);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to check Discord authentication:", err);

          setDiscordUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAuthLoading(false);
        }
      }
    };

    fetchDiscordUser();

    return () => {
      controller.abort();
    };
  }, []);

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

        const cards = Array.isArray(data) ? data : [];

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

  useEffect(() => {
    const controller = new AbortController();

    const fetchDeckCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/decklist-count/`,
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
            `Deck count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        const count = Number(data?.count);

        if (Number.isFinite(count)) {
          setTotalDecks(count);
          writeSessionCache(STORAGE_KEYS.deckCount, count);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to refresh deck count:", err);
        }
      }
    };

    fetchDeckCount();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    if (!discordUser) {
      setUserCollection([]);
      setCollectionLoading(false);
      setCollectionLoaded(false);
      setCollection(null);
      return undefined;
    }

    const controller = new AbortController();

    const fetchUserCollection = async () => {
      setCollectionLoading(true);
      setCollectionLoaded(false);

      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/user-cards/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `User collection request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        let collectionData = [];

        if (Array.isArray(data)) {
          collectionData = data;
        } else if (Array.isArray(data?.cards)) {
          collectionData = data.cards;
        } else if (Array.isArray(data?.results)) {
          collectionData = data.results;
        }

        setUserCollection(collectionData);
        setCollectionLoaded(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load user collection:", err);

          setUserCollection([]);
          setCollection(null);
          setCollectionLoaded(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCollectionLoading(false);
        }
      }
    };

    fetchUserCollection();

    return () => {
      controller.abort();
    };
  }, [discordUser, authLoading]);

  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const sideOrder = {
        plants: 0,
        zombies: 1,
      };

      const sideA = normalizeSide(a.side);
      const sideB = normalizeSide(b.side);

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
  }, [decks]);

  const collectionMap = useMemo(() => {
    if (!collectionLoaded || collectionLoading || !discordUser) {
      return new Map();
    }

    return buildCollectionMap(userCollection);
  }, [userCollection, collectionLoaded, collectionLoading, discordUser]);

  const deckCollectionStatus = useMemo(() => {
    const statusMap = new Map();

    if (!discordUser || !collectionLoaded || collectionLoading) {
      return statusMap;
    }

    sortedDecks.forEach((deck) => {
      statusMap.set(
        getDeckKey(deck),
        getDeckCollectionStatus(deck, collectionMap),
      );
    });

    return statusMap;
  }, [
    sortedDecks,
    collectionMap,
    discordUser,
    collectionLoaded,
    collectionLoading,
  ]);

  const getCollectionValues = (value) => {
    if (Array.isArray(value)) {
      return value
        .filter(Boolean)
        .map((item) => item?.value)
        .filter(Boolean);
    }

    if (value?.value) {
      return [value.value];
    }

    if (typeof value === "string" && value) {
      return [value];
    }

    return [];
  };

  const matchesNonCollectionFilters = useMemo(() => {
    return (deck, options = {}) => {
      const {
        exclude = null,
        heroOption = null,
        categoryOption = null,
        archetypeOption = null,
      } = options;

      const searchValue = normalizeKey(search);

      if (searchValue) {
        const alias = HERO_ALIAS[searchValue]
          ? normalizeKey(HERO_ALIAS[searchValue])
          : "";

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

        let searchMatch = false;

        if (alias) {
          searchMatch = normalizeKey(deck.hero).includes(alias);
        } else {
          const normalFieldMatch = searchableValues.some((value) =>
            value.includes(searchValue),
          );

          const cardMatch = searchableCardValues.some((card) =>
            card.includes(searchValue),
          );

          searchMatch = normalFieldMatch || cardMatch;
        }

        if (!searchMatch) {
          return false;
        }
      }

      if (side !== "All") {
        if (normalizeSide(deck.side) !== normalizeSide(side)) {
          return false;
        }
      }

      if (exclude !== "hero") {
        const selectedHeroes = heroOption !== null ? [heroOption] : hero;

        if (selectedHeroes.length > 0) {
          const heroMatch = selectedHeroes.some(
            (selectedHero) =>
              normalizeKey(deck.hero) === normalizeKey(selectedHero.value),
          );

          if (!heroMatch) {
            return false;
          }
        }
      }

      if (exclude !== "category") {
        const selectedCategories =
          categoryOption !== null ? [categoryOption] : category;

        if (selectedCategories.length > 0) {
          const categoryMatch = selectedCategories.some(
            (selectedCategory) =>
              normalizeKey(deck.category) ===
              normalizeKey(selectedCategory.value),
          );

          if (!categoryMatch) {
            return false;
          }
        }
      }

      if (exclude !== "archetype") {
        const selectedArchetypes =
          archetypeOption !== null
            ? [...archetype, archetypeOption]
            : archetype;

        if (selectedArchetypes.length > 0) {
          const deckArchetype = normalizeKey(deck.archetype);

          const archetypeMatch = selectedArchetypes.some((selectedArchetype) =>
            deckArchetype.includes(normalizeKey(selectedArchetype.value)),
          );
          if (!archetypeMatch) {
            return false;
          }
        }
      }

      return true;
    };
  }, [search, side, hero, category, archetype]);

  const deckMatchesFilters = useMemo(() => {
    return (deck, options = {}) => {
      const { exclude = null, collectionOption = null } = options;

      if (
        !matchesNonCollectionFilters(deck, {
          exclude,
        })
      ) {
        return false;
      }

      if (exclude !== "collection") {
        const selectedCollection =
          collectionOption !== null ? collectionOption : collection;

        const collectionValues = getCollectionValues(selectedCollection);

        if (collectionValues.length > 0) {
          if (!discordUser || !collectionLoaded || collectionLoading) {
            return true;
          }

          const status = deckCollectionStatus.get(getDeckKey(deck));

          const collectionMatch = collectionValues.every((value) => {
            if (value === "buildable") {
              return status?.buildable === true;
            }

            if (value === "close") {
              return status?.close === true;
            }

            return true;
          });

          if (!collectionMatch) {
            return false;
          }
        }
      }

      return true;
    };
  }, [
    matchesNonCollectionFilters,
    collection,
    discordUser,
    collectionLoaded,
    collectionLoading,
    deckCollectionStatus,
  ]);

  const heroOptions = useMemo(() => {
    const heroMap = new Map();

    sortedDecks.forEach((deck) => {
      if (
        !deckMatchesFilters(deck, {
          exclude: "hero",
        })
      ) {
        return;
      }

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
          side: normalizeSide(deck.side),
        });
      }

      heroMap.get(key).count += 1;
    });

    return Array.from(heroMap.values())
      .map((option) => {
        const matchedCard = allCards.find(
          (card) =>
            normalizeCardName(card.card_name) ===
            normalizeCardName(option.label),
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
  }, [sortedDecks, allCards, deckMatchesFilters]);

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    sortedDecks.forEach((deck) => {
      if (
        !deckMatchesFilters(deck, {
          exclude: "category",
        })
      ) {
        return;
      }

      const categoryName = normalizeText(deck.category);

      if (!categoryName) {
        return;
      }

      const key = normalizeKey(categoryName);

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          value: categoryName,
          label: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
          count: 0,
          ...(CATEGORY_META[key] || {}),
        });
      }

      categoryMap.get(key).count += 1;
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sortedDecks, deckMatchesFilters]);

  const archetypeOptions = useMemo(() => {
    const options = Object.entries(ARCHETYPE_META).map(([value, meta]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      count: 0,
      ...meta,
    }));

    sortedDecks.forEach((deck) => {
      if (
        !deckMatchesFilters(deck, {
          exclude: "archetype",
        })
      ) {
        return;
      }

      const deckArchetype = normalizeKey(deck.archetype);

      if (!deckArchetype) {
        return;
      }

      options.forEach((option) => {
        if (deckArchetype.includes(normalizeKey(option.value))) {
          option.count += 1;
        }
      });
    });

    return options.filter((option) => option.count > 0);
  }, [sortedDecks, deckMatchesFilters]);

  const collectionOptions = useMemo(() => {
    if (!discordUser || authLoading || collectionLoading || !collectionLoaded) {
      return COLLECTION_OPTIONS;
    }

    let buildableCount = 0;
    let closeCount = 0;

    sortedDecks.forEach((deck) => {
      if (!matchesNonCollectionFilters(deck)) {
        return;
      }

      const status = deckCollectionStatus.get(getDeckKey(deck));

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
    sortedDecks,
    matchesNonCollectionFilters,
    deckCollectionStatus,
    discordUser,
    authLoading,
    collectionLoading,
    collectionLoaded,
  ]);

  const filteredDecks = useMemo(() => {
    const filtered = sortedDecks.filter((deck) => deckMatchesFilters(deck));
    if (archetype.length > 1) {
      const selectedArchetypes = archetype.map((selected) =>
        normalizeKey(selected.value),
      );

      return [...filtered].sort((a, b) => {
        const aArchetype = normalizeKey(a.archetype);
        const bArchetype = normalizeKey(b.archetype);

        const aMatchesAll = selectedArchetypes.every((selected) =>
          aArchetype.includes(selected),
        );

        const bMatchesAll = selectedArchetypes.every((selected) =>
          bArchetype.includes(selected),
        );

        if (aMatchesAll !== bMatchesAll) {
          return aMatchesAll ? -1 : 1;
        }

        return 0;
      });
    }

    return filtered;
  }, [sortedDecks, deckMatchesFilters, archetype]);

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection(null);
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h2>Loading decklists</h2>
          <p>Preparing the deck browser and loading available decks.</p>

          <div className="loading-status">
            <span>Loading deck data</span>

            <strong>
              {totalDecks !== null ? `${totalDecks} decks` : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <Navbar />

      <main className="deck-content">
        <h1>Decklists</h1>

        <div className="deck-browser">
          <img
            className="deck-banner"
            src="https://i.ibb.co/8nBNRL66/deckbannerbyairheadz.webp"
            alt="Deck Banner"
          />

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
              placeholder="Search decks, creators, heroes, cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                value={collection}
                onChange={(value) => {
                  setCollection(value);
                  hideCollectionLoginMessage();
                }}
                requiresAuth
                isAuthenticated={!authLoading && Boolean(discordUser)}
                onAuthRequired={showCollectionLoginMessage}
                multi
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
            Showing {filteredDecks.length} of{" "}
            {totalDecks !== null ? totalDecks : decks.length} decks
          </p>
        )}

        {!authLoading && discordUser && collectionLoading && (
          <p className="results-count">Loading your collection...</p>
        )}

        {!authLoading &&
          discordUser &&
          !collectionLoading &&
          !collectionLoaded && (
            <p className="results-count">
              Unable to load your collection. Collection filters are temporarily
              unavailable.
            </p>
          )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No decklists found.</p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck) => (
                <DeckCard
                  key={`${normalizeSide(deck.side)}-${getDeckKey(deck)}`}
                  decklist={deck}
                  decklists
                />
              ))}
            </div>
          )
        )}
      </main>

      <Footer credits="Special thanks to rip for uploading all of the deck images, and to everyone in the PVZH community who continues to contribute great decks and help grow the Tbot website and Discord bot. Credit to AirheadZ for designing the deck banner used on this page." />
    </div>
  );
}

export default DecklistsPage;
