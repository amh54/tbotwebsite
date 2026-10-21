import { useEffect, useMemo, useState } from "react";

import { useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DeckCard from "../../components/modals/deckComponent.jsx";
import RandomDeckButton from "../../components/decks/randomDeckButton.jsx";
import FilterDropdown from "../../components/filterDropdown.jsx";

import Navbar from "../../components/navbar";

import Footer from "../../components/footer";

import useTemporaryMessage from "../../utils/useTemporaryMessage";
import Seo from "../../components/seo.jsx";
import {
  normalizeText,
  normalizeKey,
  normalizeSide,
  sortDecks,
  buildCollectionMap,
  getDeckKey,
  getFilterOptions,
  getHeroOptions,
  getCategoryOptions,
  getArchetypeOptions,
  COLLECTION_OPTIONS,
  filterDecks,
} from "../../utils/deckFilters";

import "../../css/decklists.css";

import "../../css/navbar.css";

import "../../css/loading.css";

import "../../css/userDecklists.css";

import { API_BASE_URL } from "../../utils/api.js";

const socialConnections = [
  {
    key: "youtube_url",
    label: "YouTube",
    path: "M23 12s0-4-1-5-2-1-4-1H6C4 6 3 6 2 7s-1 5-1 5 0 4 1 5 2 1 4 1h12c2 0 3 0 4-1s1-5 1-5Z",
  },
  {
    key: "twitch_url",
    label: "Twitch",
    path: "M4 2h17v12l-5 5h-4l-3 3v-3H4V2Zm3 3v10h3v3l3-3h4l2-2V5H7Zm3 2h2v5h-2V7Zm5 0h2v5h-2V7Z",
  },
  {
    key: "tiktok_url",
    label: "TikTok",
    path: "M15 3c.3 2 1.4 3.5 3.5 4.1V10c-1.4-.1-2.7-.6-3.5-1.4v6.2a5.2 5.2 0 1 1-4.5-5.1v2.9a2.3 2.3 0 1 0 1.6 2.2V3H15Z",
  },
  {
    key: "instagram_url",
    label: "Instagram",
    type: "instagram",
  },
  {
    key: "twitter_url",
    label: "Twitter/X",
    path: "M18.9 2H22l-6.8 7.8L23.2 22h-6.2l-4.9-6.4L6.5 22H3.4l7.3-8.4L2.8 2H9l4.4 5.8L18.9 2Zm-1.1 17.7h1.7L8.3 4.2H6.5l11.3 15.5Z",
  },
  {
    key: "discord_server_url",
    label: "Discord Server",
    path: "M19.5 5.2A16.7 16.7 0 0 0 15.3 4l-.5 1a15 15 0 0 0-5.6 0l-.5-1a16.7 16.7 0 0 0-4.2 1.2C1.8 9.1 1.1 13 1.4 16.9a16.9 16.9 0 0 0 5.2 2.6l1.3-1.8c-.7-.3-1.3-.7-1.9-1.1l.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4c-.6.4-1.2.8-1.9 1.1l1.3 1.8a16.9 16.9 0 0 0 5.2-2.6c.4-4.5-.8-8.4-3.5-11.7ZM8.5 14.1c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm7 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z",
  },
];
const MarkdownLink = ({ node, ...props }) => (
  <a {...props} target="_blank" rel="noopener noreferrer" />
);
function DeckbuilderDecks() {
  const { deckbuilder_name } = useParams();

  const decodedDeckbuilderName = deckbuilder_name || "";

  const [deckbuilder, setDeckbuilder] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckCount, setDeckCount] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [shareLabel, setShareLabel] = useState("Share Deckbuilder");
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const side = searchParams.get("side") || "All";

  const selectedHeroValues = searchParams.getAll("hero");
  const selectedCategoryValues = searchParams.getAll("category");
  const selectedArchetypeValues = searchParams.getAll("archetype");
  const selectedCollectionValues = searchParams.getAll("collection");

  const updateFilters = (updates) => {
    const replace = Object.keys(updates).length === 1 && "search" in updates;

    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        Object.entries(updates).forEach(([key, value]) => {
          nextParams.delete(key);

          const values = Array.isArray(value) ? value : [value];

          values.forEach((item) => {
            const paramValue =
              item && typeof item === "object" ? item.value : item;

            if (
              paramValue === null ||
              paramValue === undefined ||
              paramValue === "" ||
              (key === "side" && paramValue === "All")
            ) {
              return;
            }

            nextParams.append(key, String(paramValue));
          });
        });

        return nextParams;
      },
      { replace },
    );
  };

  const setSearch = (value) => updateFilters({ search: value });
  const setHero = (value) => updateFilters({ hero: value });
  const setCategory = (value) => updateFilters({ category: value });
  const setArchetype = (value) => updateFilters({ archetype: value });
  const setCollection = (value) => updateFilters({ collection: value });

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
  const [randomSelection, setRandomSelection] = useState({
    deckKey: null,
    version: 0,
  });

  const handleRandomDeck = (deck) => {
    const deckKey = `${normalizeSide(deck.side)}-${getDeckKey(deck)}`;

    setRandomSelection((current) => ({
      deckKey,
      version: current.version + 1,
    }));
  };
  const handleRandomDeckOpened = () => {
    setRandomSelection((current) => ({
      ...current,
      deckKey: null,
    }));
  };
  const handleShareDeckbuilder = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Link Copied!");
      window.setTimeout(() => setShareLabel("Share Deckbuilder"), 2000);
    } catch {
      setShareLabel("Unable to Copy Link");
      window.setTimeout(() => setShareLabel("Share Deckbuilder"), 2000);
    }
  };
  const availableSocialConnections = socialConnections.filter(({ key }) =>
    normalizeText(deckbuilder?.[key]),
  );
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

    void loadDeckCount();

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
      void loadDeckbuilderDecks();
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

        let cards = [];

        if (Array.isArray(data)) {
          cards = data;
        } else if (Array.isArray(data?.results)) {
          cards = data.results;
        }

        setAllCards(cards);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card information:", err);
        }
      }
    };

    void fetchCards();

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

    void fetchDiscordUser();

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

    void fetchUserCollection();

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
  const baseHeroOptions = useMemo(
    () => getHeroOptions(sortedDecks, allCards),
    [sortedDecks, allCards],
  );

  const baseCategoryOptions = useMemo(
    () => getCategoryOptions(sortedDecks),
    [sortedDecks],
  );

  const baseArchetypeOptions = useMemo(
    () => getArchetypeOptions(sortedDecks),
    [sortedDecks],
  );

  const resolveSelectedOptions = (values, options) => {
    const optionsByValue = new Map(
      options.map((option) => [normalizeKey(option.value), option]),
    );

    return values
      .map((value) => optionsByValue.get(normalizeKey(value)))
      .filter(Boolean);
  };

  const hero = resolveSelectedOptions(selectedHeroValues, baseHeroOptions);

  const category = resolveSelectedOptions(
    selectedCategoryValues,
    baseCategoryOptions,
  );

  const archetype = resolveSelectedOptions(
    selectedArchetypeValues,
    baseArchetypeOptions,
  );

  const collection = resolveSelectedOptions(
    selectedCollectionValues,
    COLLECTION_OPTIONS,
  );
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
    updateFilters({
      search: "",
      hero: [],
      category: [],
      archetype: [],
      collection: [],
    });
  };

  const handleSideChange = (newSide) => {
    updateFilters({
      side: newSide,
      search: "",
      hero: [],
      category: [],
      archetype: [],
      collection: [],
    });
  };
  let deckCountLabel;

  if (deckCount === null) {
    deckCountLabel = "Loading...";
  } else if (deckCount === 1) {
    deckCountLabel = "1 deck";
  } else {
    deckCountLabel = `${deckCount} decks`;
  }
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h2>Loading decklists</h2>
          <p>Preparing this deckbuilder's decklists.</p>

          <div className="loading-status">
            <span>Loading deck data</span>
            <strong>{deckCountLabel}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deck-page">
        <Seo
          title="Deckbuilder Not Found | Tbot"
          description="The requested Tbot deckbuilder could not be found."
          canonical="/deckbuilders"
          noindex
        />
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

  const displayName =
    normalizeText(deckbuilder?.display_name) ||
    normalizeText(deckbuilder?.deckbuilder_name) ||
    decodedDeckbuilderName;

  const avatarUrl = getAvatarUrl(deckbuilder);

  return (
    <div className="deck-page">
      <Seo
        title={`${displayName} Decklists - PVZH Decks | PVZ Heroes | Tbot`}
        description={`Browse ${displayName}'s Plants vs. Zombies Heroes decklists on Tbot. Explore their PVZH and PVZ Heroes decks and deckbuilding history.`}
        canonical={`/deckbuilders/${encodeURIComponent(decodedDeckbuilderName)}/decks`}
      />
      <Navbar />

      <main className="deck-content">
        <section className="profile-header deckbuilder-profile-header">
          <div className="profile-avatar">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1>{displayName}</h1>

            <div className="profile-username">
              @{deckbuilder?.username || displayName}
            </div>

            {deckbuilder?.bio && (
              <div className="profile-bio">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  components={{ a: MarkdownLink }}
                >
                  {deckbuilder.bio}
                </ReactMarkdown>
              </div>
            )}

            {availableSocialConnections.length > 0 && (
              <div className="profile-social-links">
                {availableSocialConnections.map(
                  ({ key, label, path, type }) => (
                    <a
                      key={key}
                      href={normalizeText(deckbuilder[key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-social-link"
                      aria-label={label}
                      title={label}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="profile-social-icon"
                      >
                        {type === "instagram" ? (
                          <>
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <circle
                              cx="17.5"
                              cy="6.5"
                              r="1"
                              fill="currentColor"
                            />
                          </>
                        ) : (
                          <>
                            <path d={path} fill="currentColor" />
                            {key === "youtube_url" && (
                              <path d="m10 9 5 3-5 3V9Z" fill="#101416" />
                            )}
                          </>
                        )}
                      </svg>
                      <span className="profile-social-label">{label}</span>
                    </a>
                  ),
                )}
              </div>
            )}

            <div className="profile-meta">
              {deckCount ?? 0} {deckCount === 1 ? "deck" : "decks"}
            </div>
          </div>
          <div className="profile-share-inline">
            <button
              type="button"
              className="profile-share-button"
              onClick={handleShareDeckbuilder}
            >
              {shareLabel}
            </button>
          </div>
        </section>

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
              <span>Plants </span>
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
              <span> Zombies</span>
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
          <div className="random-deck-toolbar">
            <RandomDeckButton
              decks={filteredDecks}
              selectedDeckKey={randomSelection.deckKey}
              onSelectDeck={handleRandomDeck}
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
            {filteredDecks.map((deck) => {
              const deckKey = `${normalizeSide(deck.side)}-${getDeckKey(deck)}`;
              const isRandomSelection = randomSelection.deckKey === deckKey;

              return (
                <DeckCard
                  key={deckKey}
                  decklist={deck}
                  allCards={allCards}
                  deckbuilder
                  userCollection={userCollection}
                  collectionLoaded={collectionLoaded}
                  discordUser={discordUser}
                  autoOpen={false}
                  randomOpenKey={
                    isRandomSelection ? randomSelection.version : 0
                  }
                  onRandomOpen={handleRandomDeckOpened}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default DeckbuilderDecks;
