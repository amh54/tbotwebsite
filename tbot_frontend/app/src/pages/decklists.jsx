import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import "../css/decklists.css";
import "../css/navbar.css";
import "../css/loading.css";

const getApiBaseUrl = () => {
  const stripTrailingSlashes = (value) => {
    let normalized = value;

    while (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  };

  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return stripTrailingSlashes(envBaseUrl);
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalhost) {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const ARCHETYPE_META = {
  aggro: {
    icon: "⚡",
    description:
      "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7.",
  },
  combo: {
    icon: "🧩",
    description:
      "Uses a specific card synergy to do massive damage to the opponent (OTK or One Turn Kill decks).",
  },
  midrange: {
    icon: "⚖️",
    description:
      "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game.",
  },
  control: {
    icon: "🛡️",
    description:
      "Focuses on removal and card advantage, winning in the late game.",
  },
  tempo: {
    icon: "🏃",
    description:
      "Focuses on slowly building a big board, winning trades and overwhelming the opponent.",
  },
};

const CATEGORY_META = {
  budget: {
    icon: "💵",
    description: "Decks that are cheap for new players",
  },
  competitive: {
    icon: "🏆",
    description: "Some of the best decks in the game",
  },
  ladder: {
    icon: "🪜",
    description: "Decks that are mostly only good for ranked games",
  },
  meme: {
    icon: "😂",
    description: "Decks built for fun/weird combos",
  },
};

function DecklistsPage() {
  const normalizeFilterText = (value) => String(value || "").trim();

  const normalizeFilterKey = (value) =>
    normalizeFilterText(value).toLowerCase();

  const HERO_ALIAS = {
    bc: "beta-carrotina",
    ct: "citron",
    sf: "solar flare",
    cz: "chompzilla",
    gs: "green shadow",
    gk: "grass knuckles",
    sp: "spudow",
    nc: "night cap",
    ro: "rose",
    cc: "captain combustible",
    sb: "super brainz",
    sm: "the smash",
    if: "impfinity",
    rb: "rustbolt",
    eb: "electric boogaloo",
    bf: "brain freeze",
    pb: "professor brainstorm",
    im: "immorticia",
    zm: "z-mech",
    nt: "neptuna",
    hg: "huge-giganticus",
  };

  const [decks, setDecks] = useState([]);
  const [totalDecks, setTotalDecks] = useState(0);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");

  const [hero, setHero] = useState(null);
  const [archetype, setArchetype] = useState([]);
  const [category, setCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allCards, setAllCards] = useState([]);

  /*
   * Load the total number of decks from the dedicated count endpoint.
   */
  useEffect(() => {
    const controller = new AbortController();

    const fetchDeckCount = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/decklist-count/`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Deck count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        setTotalDecks(Number(data?.count) || 0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load deck count:", err);
        }
      }
    };

    fetchDeckCount();

    return () => controller.abort();
  }, []);

  /*
   * Load cards so hero dropdowns can display their images/descriptions.
   */
  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/cardinfo/`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setAllCards(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card information:", err);
        }
      }
    };

    fetchCards();

    return () => controller.abort();
  }, []);

  /*
   * Load all decklists.
   */
  useEffect(() => {
    const controller = new AbortController();

    const fetchDecks = async () => {
      try {
        const decklistsEndpoint = `${API_BASE_URL}/tbotapp/decklists/`;

        const response = await fetch(decklistsEndpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;

          try {
            const errorPayload = await response.json();

            if (errorPayload?.detail) {
              message = `${message}: ${errorPayload.detail}`;
            } else if (errorPayload?.error) {
              message = `${message}: ${errorPayload.error}`;
            }
          } catch (_error) {
            // Ignore non-JSON error payloads.
          }

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        const responseText = await response.text();

        const hint = import.meta.env.VITE_API_BASE_URL
          ? "Check that VITE_API_BASE_URL points to your backend domain."
          : "VITE_API_BASE_URL is missing; set it in frontend deployment settings.";

        if (!contentType.includes("application/json")) {
          if (responseText.trim().startsWith("<")) {
            throw new Error(
              `Received HTML instead of JSON from ${decklistsEndpoint}. ${hint}`,
            );
          }

          throw new Error(
            `Unexpected response type ${
              contentType || "unknown"
            } from ${decklistsEndpoint}. ${hint}`,
          );
        }

        let data;

        try {
          data = JSON.parse(responseText);
        } catch (_parseError) {
          if (responseText.trim().startsWith("<")) {
            throw new Error(
              `Received HTML instead of JSON from ${decklistsEndpoint}. ${hint}`,
            );
          }

          throw new Error(
            `Invalid JSON received from ${decklistsEndpoint}. ${hint}`,
          );
        }

        if (Array.isArray(data)) {
          setDecks(data);
        } else {
          const results = Array.isArray(data?.results) ? data.results : [];

          setDecks(results);
        }

        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);

          const hint = import.meta.env.VITE_API_BASE_URL
            ? ""
            : " Configure VITE_API_BASE_URL in your frontend deployment settings.";

          setError(
            `Unable to load decklists right now.${hint} ${
              err.message || ""
            }`.trim(),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();

    return () => controller.abort();
  }, []);

  /*
   * Filter decks by the currently selected side.
   */
  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = side.toLowerCase();

    return decks.filter(
      (deck) => String(deck.side || "").toLowerCase() === selectedSide,
    );
  }, [decks, side]);

  /*
   * These datasets are used specifically for calculating the dynamic
   * counts shown inside the filter dropdowns.
   *
   * Each filter ignores itself when calculating its own options,
   * but respects the other selected filters.
   */

  /*
   * Hero options:
   * Respect Category + Archetype.
   * Ignore the currently selected Hero.
   */
  const heroOptionDecks = useMemo(() => {
    return sideFilteredDecks.filter((deck) => {
      const categoryMatch =
        !category ||
        normalizeFilterKey(deck.category) ===
          normalizeFilterKey(category.value);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          normalizeFilterKey(deck.archetype).includes(
            normalizeFilterKey(selectedArchetype.value),
          ),
        );

      return categoryMatch && archetypeMatch;
    });
  }, [sideFilteredDecks, category, archetype]);

  /*
   * Category options:
   * Respect Hero + Archetype.
   * Ignore the currently selected Category.
   */
  const categoryOptionDecks = useMemo(() => {
    return sideFilteredDecks.filter((deck) => {
      const heroMatch =
        !hero ||
        normalizeFilterKey(deck.hero) === normalizeFilterKey(hero.value);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          normalizeFilterKey(deck.archetype).includes(
            normalizeFilterKey(selectedArchetype.value),
          ),
        );

      return heroMatch && archetypeMatch;
    });
  }, [sideFilteredDecks, hero, archetype]);

  /*
   * Archetype options:
   * Respect Hero + Category.
   * Ignore the currently selected Archetype.
   */
  const archetypeOptionDecks = useMemo(() => {
    return sideFilteredDecks.filter((deck) => {
      const heroMatch =
        !hero ||
        normalizeFilterKey(deck.hero) === normalizeFilterKey(hero.value);

      const categoryMatch =
        !category ||
        normalizeFilterKey(deck.category) ===
          normalizeFilterKey(category.value);

      return heroMatch && categoryMatch;
    });
  }, [sideFilteredDecks, hero, category]);

  /*
   * Dynamic Hero options and counts.
   */
  const heroOptions = useMemo(() => {
    const heroMap = new Map();

    heroOptionDecks.forEach((deck) => {
      const heroName = normalizeFilterText(deck.hero);

      if (!heroName) {
        return;
      }

      const key = normalizeFilterKey(heroName);

      if (!heroMap.has(key)) {
        heroMap.set(key, {
          heroName,
          side: normalizeFilterKey(deck.side),
          count: 0,
        });
      }

      heroMap.get(key).count += 1;
    });

    return [...heroMap.values()]
      .map(({ heroName, side, count }) => {
        const matchedCard = allCards.find(
          (card) =>
            normalizeFilterKey(card.card_name) === normalizeFilterKey(heroName),
        );

        return {
          value: heroName,
          label: heroName,
          count,
          description: matchedCard?.flavor_text || "",
          image: matchedCard?.thumbnail || "",
          side,
        };
      })
      .sort((a, b) => {
        const sideOrder = {
          plants: 0,
          zombies: 1,
        };

        const sideCompare =
          (sideOrder[a.side] ?? 99) - (sideOrder[b.side] ?? 99);

        if (sideCompare !== 0) {
          return sideCompare;
        }

        return a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        });
      });
  }, [heroOptionDecks, allCards]);

  /*
   * Dynamic Category options and counts.
   */
  const categoryOptions = useMemo(() => {
    const grouped = categoryOptionDecks.reduce((acc, deck) => {
      const normalized = normalizeFilterText(deck.category);

      if (!normalized) {
        return acc;
      }

      const key = normalizeFilterKey(normalized);

      if (!acc[key]) {
        acc[key] = {
          value: normalized,
          label: normalized,
          count: 0,
          ...(CATEGORY_META[key] || {}),
        };
      }

      acc[key].count += 1;

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [categoryOptionDecks]);

  /*
   * Dynamic Archetype options and counts.
   */
  const archetypeOptions = useMemo(() => {
    return Object.entries(ARCHETYPE_META)
      .map(([value, meta]) => {
        const count = archetypeOptionDecks.filter((deck) =>
          normalizeFilterKey(deck.archetype).includes(value),
        ).length;

        return {
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          ...meta,
          count,
        };
      })
      .filter((option) => option.count > 0);
  }, [archetypeOptionDecks]);

  /*
   * Sort decks:
   * Plants -> Zombies -> Hero -> Deck Name
   */
  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const normalizeSide = (value) => String(value || "").toLowerCase();

      const sideOrder = {
        plants: 0,
        zombies: 1,
      };

      const sideCompare =
        (sideOrder[normalizeSide(a.side)] ?? 99) -
        (sideOrder[normalizeSide(b.side)] ?? 99);

      if (sideCompare !== 0) {
        return sideCompare;
      }

      const heroCompare = (a.hero || "").localeCompare(
        b.hero || "",
        undefined,
        {
          sensitivity: "base",
        },
      );

      if (heroCompare !== 0) {
        return heroCompare;
      }

      return (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      });
    });
  }, [decks]);

  /*
   * Clear all filters.
   */
  const clearFilters = () => {
    setSearch("");
    setHero(null);
    setArchetype([]);
    setCategory(null);
  };

  /*
   * Changing Plants/Zombies/All also clears the filters.
   */
  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  /*
   * Final deck filtering.
   */
  const filteredDecks = useMemo(() => {
    return sortedDecks.filter((deck) => {
      const searchValue = String(search || "")
        .trim()
        .toLowerCase();

      const heroAliasMatch = (HERO_ALIAS[searchValue] || "").toLowerCase();

      const expandedSearchValue = heroAliasMatch || searchValue;

      const isHeroShortcutSearch = Boolean(heroAliasMatch);

      const searchableValues = [
        deck.name,
        deck.creator,
        deck.optimization,
        deck.hero,
        deck.archetype,
        deck.cards,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const searchMatch =
        !searchValue ||
        (isHeroShortcutSearch
          ? String(deck.hero || "")
              .toLowerCase()
              .includes(expandedSearchValue)
          : searchableValues.some((value) =>
              value.includes(expandedSearchValue),
            ));

      const sideValue = String(deck.side || "").toLowerCase();

      const sideMatch =
        side === "All" ||
        (side === "Plants" && sideValue === "plants") ||
        (side === "Zombies" && sideValue === "zombies");

      const heroMatch =
        !hero ||
        normalizeFilterKey(deck.hero) === normalizeFilterKey(hero.value);

      const deckArchetype = normalizeFilterKey(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          deckArchetype.includes(normalizeFilterKey(selectedArchetype.value)),
        );

      const categoryMatch =
        !category ||
        normalizeFilterKey(deck.category) ===
          normalizeFilterKey(category.value);

      return (
        searchMatch && sideMatch && heroMatch && archetypeMatch && categoryMatch
      );
    });
  }, [sortedDecks, search, side, hero, archetype, category]);

  /*
   * Loading screen.
   */
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-icon">
            <div className="loading-icon-inner" />
          </div>

          <h2>
            Loading decklists
            <span className="loading-dots">
              <span />
              <span />
              <span />
            </span>
          </h2>

          <p>Preparing the deck browser and loading available decks.</p>

          <div className="loading-status">
            <span>Loading deck data</span>

            <strong>
              {totalDecks > 0 ? `${totalDecks} decks` : "Loading..."}
            </strong>
          </div>

          <div className="loading-progress">
            <div className="loading-progress-bar" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Tbot</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/decklists">Decklists</Link>
          <Link to="/cardinfo">Card Info</Link>
          <Link to="/heroinfo">Hero Info</Link>
          <Link to="/keeporscrap">Keep or Scrap</Link>
        </div>
      </nav>

      <main className="deck-content">
        <h1>Decklists</h1>

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
              />
            </div>

            <div className="select-wrapper">
              <FilterDropdown
                label="Category"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
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

            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>

        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p className="results-count">
            Showing {filteredDecks.length} of {totalDecks} decks
          </p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No decklists found.</p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck) => (
                <DeckCard
                  key={`${deck.side}-${deck.deckid || deck.id || deck.name}`}
                  decklist={deck}
                />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default DecklistsPage;
