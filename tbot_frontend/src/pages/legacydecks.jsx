import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/modals/deckcomponent.jsx";

import FilterDropdown from "../components/filterdropdown";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import Seo from "../components/seo.jsx";

import useTemporaryMessage from "../utils/useTemporaryMessage";

import {
  sortDecks,
  buildCollectionMap,
  getFilterOptions,
  filterDecks,
} from "../utils/deckFilters";

import "../css/decklists.css";

import "../css/navbar.css";

import "../css/loading.css";

import { API_BASE_URL } from "../utils/api.js";

const STORAGE_KEYS = {
  decks: "tbot_legacy_decks",
  deckCount: "tbot_legacy_deck_count",
  cards: "tbot_cards",
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

  const collectionMap = useMemo(() => {
    if (!isAuthenticated) {
      return new Map();
    }

    return buildCollectionMap(collectionCards);
  }, [collectionCards, isAuthenticated]);

  const sortedDecks = useMemo(() => sortDecks(decks), [decks]);

  const { heroOptions, categoryOptions, archetypeOptions, collectionOptions } =
    useMemo(
      () =>
        getFilterOptions({
          decks: sortedDecks,
          allCards,
          search,
          side,
          hero,
          category,
          archetype,
          collection: collectionFilter,
          collectionMap,
          collectionLoading: false,
          collectionLoaded: isAuthenticated,
          discordUser: isAuthenticated ? {} : null,
          authLoading: false,
        }),
      [
        sortedDecks,
        allCards,
        search,
        side,
        hero,
        category,
        archetype,
        collectionFilter,
        collectionMap,
        isAuthenticated,
      ],
    );

  const filteredDecks = useMemo(
    () =>
      filterDecks({
        decks: sortedDecks,
        search,
        side,
        hero,
        category,
        archetype,
        collection: collectionFilter,
        collectionMap,
        collectionLoading: false,
        collectionLoaded: isAuthenticated,
        discordUser: isAuthenticated ? {} : null,
      }),
    [
      sortedDecks,
      search,
      side,
      hero,
      category,
      archetype,
      collectionFilter,
      collectionMap,
      isAuthenticated,
    ],
  );

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

  return (
    <div className="deck-page">
      <Seo
        title="PVZ Heroes Legacy Decks | Tbot"
        description="Browse legacy Plants vs. Zombies Heroes decks on Tbot. Explore classic PVZ Heroes decklists by hero, category, archetype, creator, and collection."
        canonical="/legacy"
      />

      <Navbar />

      <main className="deck-content">
        <h1>PVZ Heroes Legacy Decks</h1>

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
                src="https://cdn.pvzhtbot.com/icons/plants.png"
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
