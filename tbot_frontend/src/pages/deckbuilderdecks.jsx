import { useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import DeckCard from "../components/modals/deckcomponent.jsx";

import FilterDropdown from "../components/filterdropdown";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import useTemporaryMessage from "../utils/useTemporaryMessage";

import {
  normalizeText,
  normalizeSide,
  sortDecks,
  buildCollectionMap,
  getDeckKey,
  getFilterOptions,
  filterDecks,
} from "../utils/deckFilters";

import "../css/decklists.css";

import "../css/navbar.css";

import "../css/loading.css";

import "../css/userdecklists.css";

import { API_BASE_URL } from "../utils/api.js";

function DeckbuilderDecks() {
  const { deckbuilder_name } = useParams();

  const decodedDeckbuilderName = deckbuilder_name || "";

  const [deckbuilder, setDeckbuilder] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckCount, setDeckCount] = useState(null);
  const [allCards, setAllCards] = useState([]);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  const { visible: collectionLoginMessage, show: showCollectionLoginMessage } =
    useTemporaryMessage(4000);

  const [discordUser, setDiscordUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [userCollection, setUserCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionLoaded, setCollectionLoaded] = useState(false);

  useEffect(() => {
    document.title = `${decodedDeckbuilderName} Decklists`;

    return () => {
      document.title = "Tbot";
    };
  }, [decodedDeckbuilderName]);

  useEffect(() => {
    const controller = new AbortController();

    const loadDeckCount = async () => {
      if (!decodedDeckbuilderName) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/deckbuilders/${encodeURIComponent(
            decodedDeckbuilderName,
          )}/decks/count/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          return;
        }

        const count = Number(data?.deck_count);

        if (Number.isFinite(count)) {
          setDeckCount(count);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load deckbuilder count:", err);
        }
      }
    };

    loadDeckCount();

    return () => controller.abort();
  }, [decodedDeckbuilderName]);

  useEffect(() => {
    const controller = new AbortController();
    const loadingStartTime = Date.now();
    const minimumLoadingTime = 1200;

    const loadDeckbuilderDecks = async () => {
      try {
        setLoading(true);
        setError("");
        setAvatarError(false);

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/deckbuilders/${encodeURIComponent(
            decodedDeckbuilderName,
          )}/decks/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load this deckbuilder's decks.",
          );
        }

        setDeckbuilder(data?.deckbuilder || null);
        setDecks(Array.isArray(data?.decks) ? data.decks : []);

        const returnedCount = Number(data?.deck_count);

        if (Number.isFinite(returnedCount)) {
          setDeckCount(returnedCount);
        }

        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(minimumLoadingTime - elapsed, 0);

        window.setTimeout(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }, remaining);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load deckbuilder decks:", err);

        setError(err.message || "Unable to load this deckbuilder's decks.");

        setLoading(false);
      }
    };

    if (decodedDeckbuilderName) {
      loadDeckbuilderDecks();
    }

    return () => controller.abort();
  }, [decodedDeckbuilderName]);

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
          return;
        }

        const data = await response.json();

        setAllCards(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [],
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card information:", err);
        }
      }
    };

    fetchCards();

    return () => controller.abort();
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

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    if (!discordUser) {
      setUserCollection([]);
      setCollectionLoading(false);
      setCollectionLoaded(false);
      setCollection([]);

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
          setCollection([]);
          setCollectionLoaded(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCollectionLoading(false);
        }
      }
    };

    fetchUserCollection();

    return () => controller.abort();
  }, [discordUser, authLoading]);

  useEffect(() => {
    setAvatarError(false);
  }, [deckbuilder?.avatar, deckbuilder?.discord_id]);

  const getAvatarUrl = (profile) => {
    if (!profile) {
      return "";
    }

    const avatar = normalizeText(profile.avatar);
    const discordId = normalizeText(profile.discord_id);

    if (!avatar) {
      if (discordId) {
        const numericId = Number(discordId);

        if (Number.isSafeInteger(numericId) && numericId >= 0) {
          const defaultAvatarIndex = (numericId >> 22) % 6;

          return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
      }

      return "";
    }

    if (
      avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("//")
    ) {
      return avatar;
    }

    if (discordId) {
      const extension = avatar.startsWith("a_") ? "gif" : "png";

      return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
    }

    return "";
  };

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

  const handleCollectionChange = (value) => {
    if (!discordUser) {
      showCollectionLoginMessage();
      return;
    }

    setCollection(value);
  };

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection([]);
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
          <p>Preparing this deckbuilder's decklists.</p>

          <div className="loading-status">
            <span>Loading deck data</span>
            <strong>
              {deckCount !== null
                ? `${deckCount} ${deckCount === 1 ? "deck" : "decks"}`
                : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deck-page">
        <Navbar />

        <main className="deck-content">
          <div className="user-decklists-empty">
            <h2>Unable to load decklists</h2>
            <p>{error}</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const profile = deckbuilder?.profile || null;

  const displayName =
    normalizeText(deckbuilder?.display_name) ||
    normalizeText(deckbuilder?.deckbuilder_name) ||
    decodedDeckbuilderName;

  const avatarUrl = getAvatarUrl(deckbuilder);

  return (
    <div className="deck-page">
      <Navbar />

      <main className="deck-content">
        <div className="user-decklists-header">
          <div className="user-decklists-profile">
            <div className="user-decklists-avatar">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={`${displayName} avatar`}
                  className="user-decklists-avatar-image"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="user-decklists-avatar-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="user-decklists-profile-info">
              <h1>{displayName} Decklists</h1>

              {deckbuilder?.username && (
                <p className="user-decklists-profile-bio">
                  @{deckbuilder.username}
                </p>
              )}

              {deckbuilder?.bio && (
                <p className="user-decklists-profile-bio">{deckbuilder.bio}</p>
              )}

              <p className="user-decklists-profile-bio">
                {deckCount ?? 0}
                {" Tbot Decks"}
              </p>
            </div>
          </div>
        </div>

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
              placeholder="Search decks, creators, heroes, cards..."
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
                value={collection}
                onChange={handleCollectionChange}
                multi
                requiresAuth
                isAuthenticated={Boolean(discordUser)}
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

        <div className="user-decklists-results-bar">
          <p className="results-count">
            Showing {filteredDecks.length} of {decks.length} decks
          </p>
        </div>

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

        {filteredDecks.length === 0 ? (
          <div className="user-decklists-empty">
            <h2>No decks found</h2>
            <p>
              This deckbuilder hasn't built any decks matching these filters.
            </p>
          </div>
        ) : (
          <div className="deck-grid">
            {filteredDecks.map((deck) => (
              <DeckCard
                key={`${normalizeSide(deck.side)}-${getDeckKey(deck)}`}
                decklist={deck}
                allCards={allCards}
                deckbuilder
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default DeckbuilderDecks;
