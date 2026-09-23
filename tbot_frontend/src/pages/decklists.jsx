import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/modals/deckcomponent.jsx";

import FilterDropdown from "../components/filterdropdown";

import Navbar from "../components/navbar";

import Footer from "../components/footer";
import Seo from "../components/seo.jsx";
import useTemporaryMessage from "../utils/useTemporaryMessage";

import {
  normalizeSide,
  buildCollectionMap,
  getFilterOptions,
  sortDecks,
  filterDecks,
  getDeckKey,
} from "../utils/deckFilters";

import "../css/decklists.css";

import "../css/navbar.css";

import "../css/loading.css";

import { API_BASE_URL } from "../utils/api.js";

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
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/auth/discord/me/`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

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

  const sortedDecks = useMemo(() => sortDecks(decks), [decks]);

  const collectionMap = useMemo(() => {
    if (!collectionLoaded || collectionLoading || !discordUser) {
      return new Map();
    }

    return buildCollectionMap(userCollection);
  }, [userCollection, collectionLoaded, collectionLoading, discordUser]);

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
          collection,
          collectionMap,
          collectionLoading,
          collectionLoaded,
          discordUser,
          authLoading,
        }),
      [
        sortedDecks,
        allCards,
        search,
        side,
        hero,
        category,
        archetype,
        collection,
        collectionMap,
        collectionLoading,
        collectionLoaded,
        discordUser,
        authLoading,
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
        collection,
        collectionMap,
        collectionLoading,
        collectionLoaded,
        discordUser,
      }),
    [
      sortedDecks,
      search,
      side,
      hero,
      category,
      archetype,
      collection,
      collectionMap,
      collectionLoading,
      collectionLoaded,
      discordUser,
    ],
  );

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
        <Seo
      title="PVZ Heroes Decks - Plants vs. Zombies Heroes Decklists | Tbot"
      description="Browse the best Plants vs. Zombies Heroes decks on Tbot. Find competitive, budget, ladder, meme, aggro, combo, control, midrange, and tempo PVZ Heroes decks."
      canonical="/decklists"
    />
      <Navbar />

      <main className="deck-content">
        <h1><h1>PVZ Heroes Decks</h1></h1>

        <div className="deck-browser">
          <img
            className="deck-banner"
            src="https://cdn.pvzhtbot.com/art/deckbannerbyairheadz.webp"
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

      <Footer credits="Special thanks to everyone in the PVZH community who continues to contribute great decks and help grow the Tbot website and Discord bot. Credit to AirheadZ for designing the deck banner used on this page." />
    </div>
  );
}

export default DecklistsPage;
