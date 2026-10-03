import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/navbar.jsx";

import Footer from "../../components/footer.jsx";
import Seo from "../../components/seo.jsx";
import "../../css/decklists.css";

import UserDeckSuggestionCard from "../../components/decks/userDeckSuggestionCard.jsx";

import FilterDropdown from "../../components/filterDropdown.jsx";

import useTemporaryMessage from "../../utils/useTemporaryMessage.js";

import {
  buildCollectionMap,
  getFilterOptions,
  sortDecks,
  filterDecks,
} from "../../utils/deckFilters.js";

import "../../css/profile/myBugReports.css";

import "../../css/loading.css";

import { API_BASE_URL } from "../../utils/api.js";

const STATUS_LABELS = {
  pending: "Pending",
  reviewing: "Reviewing",
  planned: "Planned",
  completed: "Completed",
  declined: "Declined",
};

const STATUS_DESCRIPTIONS = {
  pending: "Your suggestion has been received and is waiting to be reviewed.",
  reviewing: "We're currently reviewing your suggestion.",
  planned: "This suggestion is planned for a future Tbot update.",
  completed: "This suggestion has been implemented or completed.",
  declined: "This suggestion will not be implemented at this time.",
};

const CATEGORY_LABELS = {
  improvement: "Improvement",
  feature: "New Feature",
  ui: "UI / Design",
  performance: "Performance",
  other: "Other",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getStatusDescription(status) {
  return (
    STATUS_DESCRIPTIONS[status] ||
    "There is currently no additional status information."
  );
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "Other";
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MySuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [deckSuggestions, setDeckSuggestions] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [discordUser, setDiscordUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCollection, setUserCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionLoaded, setCollectionLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [filter, setFilter] = useState("all");

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState(null);

  const {
    visible: collectionLoginMessage,
    show: showCollectionLoginMessage,
    hide: hideCollectionLoginMessage,
  } = useTemporaryMessage(4000);

  useEffect(() => {
    let cancelled = false;

    const loadDeckSuggestions = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/user-deck-suggestions/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.error ||
              "Unable to load your deck suggestions.",
          );
        }

        if (cancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setDeckSuggestions(data);
        } else if (Array.isArray(data.results)) {
          setDeckSuggestions(data.results);
        } else if (Array.isArray(data.suggestions)) {
          setDeckSuggestions(data.suggestions);
        } else {
          setDeckSuggestions([]);
        }
      } catch (requestError) {
        console.error("Unable to load deck suggestions:", requestError);
      }
    };

    const loadSuggestions = async () => {
      setLoading(true);
      setError("");

      try {
        const [response] = await Promise.all([
          fetch(`${API_BASE_URL}/tbotapp/suggestions/my/`, {
            method: "GET",
            credentials: "include",
          }),
          loadDeckSuggestions(),
        ]);

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.detail || data.error || "Unable to load your suggestions.",
          );
        }

        if (cancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setSuggestions(data);
        } else if (Array.isArray(data.results)) {
          setSuggestions(data.results);
        } else if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (requestError) {
        console.error("Unable to load suggestions:", requestError);

        if (!cancelled) {
          setError(requestError.message || "Unable to load your suggestions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCards = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/cardinfo/`);

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setAllCards(data);
        } else if (Array.isArray(data.results)) {
          setAllCards(data.results);
        }
      } catch (requestError) {
        console.error("Unable to load card data:", requestError);
      }
    };

    loadCards();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAuth = async () => {
      setAuthLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/auth/discord/me/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setDiscordUser(null);
          }

          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setDiscordUser(data);
        }
      } catch (requestError) {
        console.error("Unable to load Discord authentication:", requestError);

        if (!cancelled) {
          setDiscordUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    loadAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCollection = async () => {
      if (authLoading || !discordUser) {
        setUserCollection([]);
        setCollectionLoaded(false);
        return;
      }

      setCollectionLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/user-cards/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load your collection.");
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setUserCollection(data);
        } else if (Array.isArray(data.results)) {
          setUserCollection(data.results);
        } else if (Array.isArray(data.cards)) {
          setUserCollection(data.cards);
        } else {
          setUserCollection([]);
        }

        setCollectionLoaded(true);
      } catch (requestError) {
        console.error("Unable to load user collection:", requestError);

        if (!cancelled) {
          setUserCollection([]);
          setCollectionLoaded(false);
        }
      } finally {
        if (!cancelled) {
          setCollectionLoading(false);
        }
      }
    };

    loadCollection();

    return () => {
      cancelled = true;
    };
  }, [authLoading, discordUser]);

  const filteredSuggestions = useMemo(() => {
    if (filter === "decks") {
      return [];
    }

    if (filter === "all") {
      return suggestions;
    }

    return suggestions.filter((suggestion) => suggestion.status === filter);
  }, [suggestions, filter]);

  const sortedDeckSuggestions = useMemo(
    () => sortDecks(deckSuggestions),
    [deckSuggestions],
  );

  const collectionMap = useMemo(
    () => buildCollectionMap(userCollection),
    [userCollection],
  );

  const {
    heroOptions,
    categoryOptions,
    archetypeOptions,
    collectionOptions,
  } = useMemo(
    () =>
      getFilterOptions({
        decks: sortedDeckSuggestions,
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
      sortedDeckSuggestions,
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

  const filteredDeckSuggestions = useMemo(
    () =>
      filterDecks({
        decks: sortedDeckSuggestions,
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
      sortedDeckSuggestions,
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

  const counts = useMemo(() => {
    const combined = [...suggestions, ...deckSuggestions];

    return {
      all: combined.length,
      decks: deckSuggestions.length,
      pending: combined.filter(
        (suggestion) => suggestion.status === "pending",
      ).length,
      reviewing: combined.filter(
        (suggestion) => suggestion.status === "reviewing",
      ).length,
      planned: combined.filter(
        (suggestion) => suggestion.status === "planned",
      ).length,
      completed: combined.filter(
        (suggestion) => suggestion.status === "completed",
      ).length,
      declined: combined.filter(
        (suggestion) => suggestion.status === "declined",
      ).length,
    };
  }, [suggestions, deckSuggestions]);

  const clearDeckFilters = () => {
    setSearch("");
    setSide("All");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection(null);
    hideCollectionLoginMessage();
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection(null);
    hideCollectionLoginMessage();
  };

  const handleCollectionChange = (value) => {
    if (!discordUser) {
      showCollectionLoginMessage();
      return;
    }

    setCollection(value);
    hideCollectionLoginMessage();
  };

  const closeDetails = () => {
    setSelectedSuggestion(null);
  };

  const showingDecks = filter === "decks";

  return (
    <>
    <Seo
      title="My Suggestions - Tbot"
      description="View and track the suggestions you have submitted to the Tbot Plants vs. Zombies Heroes website."
      canonical="/mysuggestions"
      noindex
    />
      <Navbar />

      <main className="my-bug-reports-page">
        <div className="my-bug-reports-container">
          <section className="my-bug-reports-header">
            <div>
              <span className="my-bug-reports-eyebrow">TBOT FEEDBACK</span>

              <h1>My Suggestions</h1>

              <p>
                Track the suggestions you've submitted and see updates from the
                site owner.
              </p>
            </div>

            <div className="my-bug-reports-total">
              <strong>{counts.all}</strong>

              <span>
                {counts.all === 1 ? "Suggestion" : "Suggestions"}
              </span>
            </div>
          </section>

          {!loading && !error && counts.all > 0 && (
            <section className="my-bug-reports-filters">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
                <span>{counts.all}</span>
              </button>

              <button
                type="button"
                className={filter === "pending" ? "active" : ""}
                onClick={() => setFilter("pending")}
              >
                Pending
                <span>{counts.pending}</span>
              </button>

              <button
                type="button"
                className={filter === "reviewing" ? "active" : ""}
                onClick={() => setFilter("reviewing")}
              >
                Reviewing
                <span>{counts.reviewing}</span>
              </button>

              <button
                type="button"
                className={filter === "planned" ? "active" : ""}
                onClick={() => setFilter("planned")}
              >
                Planned
                <span>{counts.planned}</span>
              </button>

              <button
                type="button"
                className={filter === "completed" ? "active" : ""}
                onClick={() => setFilter("completed")}
              >
                Completed
                <span>{counts.completed}</span>
              </button>

              <button
                type="button"
                className={filter === "declined" ? "active" : ""}
                onClick={() => setFilter("declined")}
              >
                Declined
                <span>{counts.declined}</span>
              </button>

              <button
                type="button"
                className={filter === "decks" ? "active" : ""}
                onClick={() => setFilter("decks")}
              >
                Decks
                <span>{counts.decks}</span>
              </button>
            </section>
          )}

          {loading && (
            <div className="my-bug-reports-loading">
              <div className="loading-spinner" />

              <p>Loading your suggestions...</p>
            </div>
          )}

          {!loading && error && (
            <section className="my-bug-reports-state my-bug-reports-error">
              <div className="my-bug-reports-state-icon">!</div>

              <h2>Unable to load suggestions</h2>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </section>
          )}

          {!loading && !error && counts.all === 0 && (
            <section className="my-bug-reports-state">
              <div className="my-bug-reports-state-icon">✓</div>

              <h2>No suggestions yet</h2>

              <p>
                You haven't submitted any suggestions. If you have an idea for
                Tbot, use
                <strong> Submit a Suggestion </strong>
                from the Website Info menu.
              </p>
            </section>
          )}

          {!loading &&
            !error &&
            counts.all > 0 &&
            !showingDecks &&
            filteredSuggestions.length === 0 && (
              <section className="my-bug-reports-state">
                <div className="my-bug-reports-state-icon">—</div>

                <h2>No suggestions in this category</h2>

                <p>You don't have any suggestions with this status.</p>
              </section>
            )}

          {!loading &&
            !error &&
            !showingDecks &&
            filteredSuggestions.length > 0 && (
              <section className="my-bug-reports-list">
                {filteredSuggestions.map((suggestion) => (
                  <article
                    key={suggestion.id}
                    className="my-bug-report-card"
                  >
                    <div className="my-bug-report-card-top">
                      <div className="my-bug-report-card-title">
                        <h2>{suggestion.title}</h2>
                      </div>

                      <span
                        className={`my-bug-report-status status-${suggestion.status}`}
                      >
                        {getStatusLabel(suggestion.status)}
                      </span>
                    </div>

                    <div className="my-bug-report-meta">
                      <span>
                        <strong>Category:</strong>{" "}
                        {getCategoryLabel(suggestion.category)}
                      </span>

                      <span>
                        <strong>Submitted:</strong>{" "}
                        {formatDate(suggestion.created_at)}
                      </span>

                      {suggestion.admin_response && (
                        <span>
                          <strong>Response:</strong> Available
                        </span>
                      )}
                    </div>

                    <p className="my-bug-report-description">
                      {suggestion.description}
                    </p>

                    <div className="my-bug-report-card-bottom">
                      <div className="my-bug-report-status-message">
                        <strong>
                          {getStatusLabel(suggestion.status)}
                        </strong>

                        <span>
                          {getStatusDescription(suggestion.status)}
                        </span>
                      </div>

                      <div className="my-bug-report-actions">
                        {suggestion.discord_thread_url && (
                          <a
                            href={suggestion.discord_thread_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="my-bug-report-button"
                          >
                            View Suggestion Thread
                          </a>
                        )}

                        <button
                          type="button"
                          className="my-bug-report-button"
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}

          {!loading && !error && showingDecks && (
            <section>
              <h2>Deck Suggestions</h2>

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
                    requiresAuth
                    isAuthenticated={!authLoading && Boolean(discordUser)}
                    onAuthRequired={showCollectionLoginMessage}
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

              {collectionLoginMessage && (
                <div className="collection-login-message">
                  <strong>Discord login required</strong>
                  <span>
                    Log in with Discord to use the Collection filter.
                  </span>
                </div>
              )}

              {filteredDeckSuggestions.length > 0 ? (
                
                <div className="deck-grid">
                                <p className="results-count">
                Showing {filteredDeckSuggestions.length} of{" "}
                {deckSuggestions.length} deck suggestions
              </p> <br/>
                  {filteredDeckSuggestions.map((deckSuggestion) => (
                    <UserDeckSuggestionCard
                      key={deckSuggestion.id}
                      suggestion={deckSuggestion}
                    />
                  ))}
                </div>
              ) : (
                <section className="my-bug-reports-state">
                  <div className="my-bug-reports-state-icon">—</div>

                  <h2>No deck suggestions found</h2>

                  <p>
                    No deck suggestions match your current filters.
                  </p>
                </section>
              )}
            </section>
          )}
        </div>
      </main>

      {selectedSuggestion && (
        <div
          className="my-bug-report-modal-overlay"
          onClick={closeDetails}
          role="presentation"
        >
          <div
            className="my-bug-report-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-suggestion-modal-title"
          >
            <div className="my-bug-report-modal-header">
              <div>
                <span className="my-bug-report-modal-eyebrow">
                  SUGGESTION #{selectedSuggestion.id}
                </span>

                <h2 id="my-suggestion-modal-title">
                  {selectedSuggestion.title}
                </h2>
              </div>

              <button
                type="button"
                className="my-bug-report-modal-close"
                onClick={closeDetails}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="my-bug-report-modal-status">
              <span
                className={`my-bug-report-status status-${selectedSuggestion.status}`}
              >
                {getStatusLabel(selectedSuggestion.status)}
              </span>

              <p>
                {getStatusDescription(selectedSuggestion.status)}
              </p>
            </div>

            <div className="my-bug-report-detail-grid">
              <div>
                <span>Category</span>

                <strong>
                  {getCategoryLabel(selectedSuggestion.category)}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {getStatusLabel(selectedSuggestion.status)}
                </strong>
              </div>

              <div>
                <span>Submitted</span>

                <strong>
                  {formatDate(selectedSuggestion.created_at)}
                </strong>
              </div>

              <div>
                <span>Last Updated</span>

                <strong>
                  {formatDate(selectedSuggestion.updated_at)}
                </strong>
              </div>
            </div>

            <div className="my-bug-report-detail-section">
              <h3>Description</h3>

              <div className="my-bug-report-description-box">
                {selectedSuggestion.description}
              </div>
            </div>

            {selectedSuggestion.page_url && (
              <div className="my-bug-report-detail-section">
                <h3>Submitted From</h3>

                <a
                  href={selectedSuggestion.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="my-bug-report-page-url"
                >
                  {selectedSuggestion.page_url}
                </a>
              </div>
            )}

            {selectedSuggestion.admin_response && (
              <div className="my-bug-report-admin-notes">
                <div className="my-bug-report-admin-notes-icon">✓</div>

                <div>
                  <span>Response from TBOT</span>

                  <p>{selectedSuggestion.admin_response}</p>
                </div>
              </div>
            )}

            <div className="my-bug-report-modal-footer">
              <button
                type="button"
                onClick={closeDetails}
                className="my-bug-report-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default MySuggestions;