import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

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
import "../css/userdecklists.css";

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

function DeckbuilderDecks() {
  const { deckbuilder_name } = useParams();

  const decodedDeckbuilderName = decodeURIComponent(deckbuilder_name || "");

  const [deckbuilder, setDeckbuilder] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckCount, setDeckCount] = useState(null);
  const [allCards, setAllCards] = useState([]);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);

  // Collection is a MULTISELECT.
  const [collection, setCollection] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  // Temporary collection login message.
  const { visible: collectionLoginMessage, show: showCollectionLoginMessage } =
    useTemporaryMessage(4000);

  // --------------------------------------------------------------------------
  // Discord authentication
  // --------------------------------------------------------------------------

  const [discordUser, setDiscordUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --------------------------------------------------------------------------
  // User collection
  // --------------------------------------------------------------------------

  const [userCollection, setUserCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionLoaded, setCollectionLoaded] = useState(false);

  // --------------------------------------------------------------------------
  // Document title
  // --------------------------------------------------------------------------

  useEffect(() => {
    document.title = `${decodedDeckbuilderName} Decklists`;

    return () => {
      document.title = "Tbot";
    };
  }, [decodedDeckbuilderName]);

  // --------------------------------------------------------------------------
  // Load deck count
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Load deckbuilder decks
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Load all card information
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Check Discord authentication
  // --------------------------------------------------------------------------

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

    return () => controller.abort();
  }, []);

  // --------------------------------------------------------------------------
  // Load user collection ONLY after authentication succeeds
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Avatar error reset
  // --------------------------------------------------------------------------

  useEffect(() => {
    setAvatarError(false);
  }, [deckbuilder?.avatar, deckbuilder?.discord_id]);

  // --------------------------------------------------------------------------
  // Avatar URL
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Side filtering
  // --------------------------------------------------------------------------

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeSide(side);

    return decks.filter((deck) => normalizeSide(deck?.side) === selectedSide);
  }, [decks, side]);

  // --------------------------------------------------------------------------
  // Hero options
  // --------------------------------------------------------------------------

  const heroOptions = useMemo(() => {
    const heroMap = new Map();

    sideFilteredDecks.forEach((deck) => {
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
  }, [sideFilteredDecks, allCards]);

  // --------------------------------------------------------------------------
  // Category options
  // --------------------------------------------------------------------------

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    sideFilteredDecks.forEach((deck) => {
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
  }, [sideFilteredDecks]);

  // --------------------------------------------------------------------------
  // Archetype options
  // --------------------------------------------------------------------------

  const archetypeOptions = useMemo(() => {
    const counts = {};

    Object.keys(ARCHETYPE_META).forEach((key) => {
      counts[key] = 0;
    });

    sideFilteredDecks.forEach((deck) => {
      const deckArchetype = normalizeKey(deck.archetype);

      if (!deckArchetype) {
        return;
      }

      Object.keys(ARCHETYPE_META).forEach((archetypeName) => {
        if (deckArchetype.includes(archetypeName)) {
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
  }, [sideFilteredDecks]);

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

  // --------------------------------------------------------------------------
  // Collection map
  // --------------------------------------------------------------------------

  const collectionMap = useMemo(() => {
    if (!collectionLoaded || collectionLoading || !discordUser) {
      return new Map();
    }

    return buildCollectionMap(userCollection);
  }, [userCollection, collectionLoaded, collectionLoading, discordUser]);

  // --------------------------------------------------------------------------
  // Deck collection status
  // --------------------------------------------------------------------------

  const deckCollectionStatus = useMemo(() => {
    const statusMap = new Map();

    if (!discordUser || !collectionLoaded || collectionLoading) {
      return statusMap;
    }

    decks.forEach((deck) => {
      statusMap.set(
        getDeckKey(deck),
        getDeckCollectionStatus(deck, collectionMap),
      );
    });

    return statusMap;
  }, [decks, collectionMap, discordUser, collectionLoaded, collectionLoading]);

  // --------------------------------------------------------------------------
  // Apply NON-COLLECTION filters
  //
  // Collection dropdown counts are based on these decks so that:
  //
  // Side -> Hero -> Category -> Archetype -> Search
  //
  // all change the Buildable / Close numbers.
  //
  // The currently selected Collection filter is NOT applied here.
  // --------------------------------------------------------------------------

  const collectionCountBaseDecks = useMemo(() => {
    const searchValue = normalizeKey(search);

    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

    return sortedDecks.filter((deck) => {
      // ----------------------------------------------------------------------
      // Search
      // ----------------------------------------------------------------------

      const deckCards = parseDeckCards(deck.cards);

      const searchableCardValues = deckCards.map((card) => normalizeKey(card));

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

      let searchMatch = true;

      if (searchValue) {
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
      }

      // ----------------------------------------------------------------------
      // Side
      // ----------------------------------------------------------------------

      const deckSide = normalizeSide(deck.side);

      const sideMatch = side === "All" || deckSide === normalizeSide(side);

      // ----------------------------------------------------------------------
      // Hero
      // ----------------------------------------------------------------------

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selectedHero) =>
            normalizeKey(deck.hero) === normalizeKey(selectedHero.value),
        );

      // ----------------------------------------------------------------------
      // Category
      // ----------------------------------------------------------------------

      const categoryMatch =
        category.length === 0 ||
        category.some(
          (selectedCategory) =>
            normalizeKey(deck.category) ===
            normalizeKey(selectedCategory.value),
        );

      const deckArchetype = normalizeKey(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.some((selectedArchetype) =>
          deckArchetype.includes(normalizeKey(selectedArchetype.value)),
        );

      return (
        searchMatch && sideMatch && heroMatch && categoryMatch && archetypeMatch
      );
    });
  }, [sortedDecks, search, side, hero, category, archetype]);

  const collectionOptions = useMemo(() => {
    if (!discordUser || authLoading || collectionLoading || !collectionLoaded) {
      return COLLECTION_OPTIONS;
    }

    let buildableCount = 0;
    let closeCount = 0;

    collectionCountBaseDecks.forEach((deck) => {
      const status = deckCollectionStatus.get(getDeckKey(deck));

      if (status?.buildable) {
        buildableCount += 1;
      }

      if (status?.close) {
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
    collectionCountBaseDecks,
    deckCollectionStatus,
    discordUser,
    authLoading,
    collectionLoading,
    collectionLoaded,
  ]);

  const filteredDecks = useMemo(() => {
    const matchingDecks = collectionCountBaseDecks.filter((deck) => {
      let collectionMatch = true;

      if (collection.length > 0) {
        if (!discordUser || !collectionLoaded || collectionLoading) {
          collectionMatch = false;
        } else {
          const status = deckCollectionStatus.get(getDeckKey(deck));

          collectionMatch = collection.every((selectedCollection) => {
            if (selectedCollection.value === "buildable") {
              return status?.buildable === true;
            }

            if (selectedCollection.value === "close") {
              return status?.close === true;
            }

            return true;
          });
        }
      }

      return collectionMatch;
    });
    if (archetype.length > 1) {
      const selectedArchetypes = archetype
        .map((selectedArchetype) => normalizeKey(selectedArchetype.value))
        .filter(Boolean);

      return [...matchingDecks].sort((a, b) => {
        const archetypeA = normalizeKey(a.archetype);
        const archetypeB = normalizeKey(b.archetype);

        const matchesA = selectedArchetypes.every((selected) =>
          archetypeA.includes(selected),
        );

        const matchesB = selectedArchetypes.every((selected) =>
          archetypeB.includes(selected),
        );

        if (matchesA !== matchesB) {
          return matchesA ? -1 : 1;
        }

        return 0;
      });
    }

    return matchingDecks;
  }, [
    collectionCountBaseDecks,
    collection,
    deckCollectionStatus,
    discordUser,
    collectionLoaded,
    collectionLoading,
    archetype,
  ]);

  // --------------------------------------------------------------------------
  // Collection change
  // --------------------------------------------------------------------------

  const handleCollectionChange = (value) => {
    if (!discordUser) {
      showCollectionLoginMessage();
      return;
    }

    setCollection(value);
  };

  // --------------------------------------------------------------------------
  // Clear filters
  // --------------------------------------------------------------------------

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection([]);
  };

  // --------------------------------------------------------------------------
  // Side change
  // --------------------------------------------------------------------------

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  // --------------------------------------------------------------------------
  // Loading screen
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Error
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Profile / deckbuilder information
  // --------------------------------------------------------------------------

  const profile = deckbuilder?.profile || null;

  const displayName =
    normalizeText(deckbuilder?.display_name) ||
    normalizeText(deckbuilder?.deckbuilder_name) ||
    decodedDeckbuilderName;

  const avatarUrl = getAvatarUrl(deckbuilder);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

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

          <div className="user-decklists-header-actions">
            {profile?.profile_slug && (
              <Link
                to={`/profile/${encodeURIComponent(profile.profile_slug)}`}
                className="user-decklists-share"
              >
                View Profile
              </Link>
            )}
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
